import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { OpenAI } from "openai";
import {
  useStore,
  type Question,
  type Answer,
  type SectionType,
} from "@/store";
import { API_BASE_URL } from "@/lib/constants";
import Loading from "./components/Loading";
import PreAssessmentModal from "./components/PreAssessmentModal";
import AlreadyAssessmentModal from "./components/AlreadyAssessmentModal";
import AssesmentQuestionNotModal from "./components/AssesmentQuestionNotModal";
import ProficiencyModal from "./components/ProficiencyModal";
import PdfPopUp from "./components/PdfPopUp";
import MobileNavbar from "./components/MobileNavbar";
import AudioPlayer from "./components/AudioPlayer";
import readingLogo from "./readinglogo.png";

const NewAssessment = () => {
  const navigate = useNavigate();
  const { arrAssesmentQuestion, setArrAssesmentQuestion, assessmentProgress } =
    useStore();

  // Destructure assessment progress state for easier access
  const {
    currentSection,
    currentQuestionIndex,
    answers,
    selectedOptions,
    arrAnswers,
    arrGeneralAnswers,
    arrGeneralQuestions,
    timeRemaining,
  } = assessmentProgress;

  // Local state management (UI-only, not persisted)
  const [isRecording, setIsRecording] = useState(false);
  const [isLessonPDFWatch, setIsLessonPDFWatch] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [questionIndex, setQuestionIndex] = useState(1);
  const corporateUserId =
    localStorage.getItem("corporateUserId") ||
    localStorage.getItem("USER_ID") ||
    "";
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreModalOpen, setIsPreModalOpen] = useState(false);
  const [isAlreadyModalOpen, setIsAlreadyModalOpen] = useState(false);
  const [isloading, setIsloading] = useState(false);
  const [isQuestionAvailable, setIsQuestionAvailable] = useState(false);
  const [firstQuestionWithAudio, setfirstQuestionWithAudio] = useState("");
  const [firstQuestionWithAudioID, setfirstQuestionWithAudioID] =
    useState<number>(0);
  const [firstQuestionWithPDF, setfirstQuestionWithPDF] = useState("");
  const [lessionId, setlessionId] = useState("");
  const [totalAnsweredQuestions, settotalAnsweredQuestions] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [moduleScores, setModuleScores] = useState<ModuleScores>({
    general: 0,
    reading: 0,
    listening: 0,
  });
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [calculatedScores, setCalculatedScores] =
    useState<CalculatedScores | null>(null);
  const [blobUrl, setBlobUrl] = useState("");

  const userId = localStorage.getItem("USER_ID") || "";

  // Ref to store timer ID for proper cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to store score cache for memoization
  const scoreCacheRef = useRef<Map<string, number>>(new Map());

  // Group questions by section
  const sections = {
    general: arrGeneralQuestions || [],
    reading: arrAssesmentQuestion.filter((q: Question) => q.moduleID === 8),
    listening: arrAssesmentQuestion.filter((q: Question) => q.moduleID === 11),
    writing: arrAssesmentQuestion
      .filter((q: Question) => q.moduleID === 9)
      .slice(0, 1),
    speaking: arrAssesmentQuestion
      .filter((q: Question) => q.moduleID === 13)
      .slice(0, 1),
  };

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatTimeVoice = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    // Clear any existing timer before creating a new one (defensive programming)
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setInterval(() => {
      assessmentProgress.setTimeRemaining((prevTime) => {
        if (prevTime <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [assessmentProgress.setTimeRemaining]);

  useEffect(() => {
    // Set theme colors
    const primaryColor =
      localStorage.getItem("corporate_primary_color") || "#0000ff";
    const secondaryColor =
      localStorage.getItem("corporate_secondary_color") || "#f5914a";
    const backgroundColor =
      localStorage.getItem("corporate_background_color") || "#fddaa7";
    const accentColor =
      localStorage.getItem("corporate_accent_color") || "#e0d4bc";

    document.documentElement.style.setProperty("--primary-color", primaryColor);
    document.documentElement.style.setProperty(
      "--secondary-color",
      secondaryColor,
    );
    document.documentElement.style.setProperty(
      "--background-color",
      backgroundColor,
    );
    document.documentElement.style.setProperty("--accent-color", accentColor);

    // Load existing scores from localStorage
    const storedScores = localStorage.getItem("ASSESSMENT_FINAL_SCORES");
    if (storedScores) {
      try {
        const scores = JSON.parse(storedScores) as CalculatedScores;
        setModuleScores({
          general: scores.assessment_generalScore || 0,
          reading: scores.assessment_readingScore || 0,
          listening: scores.assessment_listeningScore || 0,
        });
        setCalculatedScores(scores);
        // console.log("Loaded existing scores from localStorage:", scores);
      } catch (error) {
        console.error("Error parsing stored scores:", error);
      }
    }

    // Check assessment status and show appropriate modal
    checktheStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore file URLs when questions are available (handles navigation back from writing/speaking modules)
  useEffect(() => {
    if (
      assessmentProgress.isAssessmentInProgress &&
      arrAssesmentQuestion.length > 0
    ) {
      const firstQuestionWithAudioObj = arrAssesmentQuestion.find(
        (q: Question) => q.moduleID === 11 && q.queFile,
      );
      const firstQuestionWithPDFObj = arrAssesmentQuestion.find(
        (q: Question) => q.moduleID === 8 && q.queFile,
      );
      const lessIdObj = arrAssesmentQuestion.find((q: Question) => q.lessionID);

      if (firstQuestionWithAudioObj && firstQuestionWithAudioObj.queFile) {
        setfirstQuestionWithAudio(firstQuestionWithAudioObj.queFile);
        setfirstQuestionWithAudioID(firstQuestionWithAudioObj.queID || 0);
      }
      if (firstQuestionWithPDFObj && firstQuestionWithPDFObj.queFile) {
        setfirstQuestionWithPDF(firstQuestionWithPDFObj.queFile);
      }
      if (lessIdObj && lessIdObj.lessionID) {
        setlessionId(lessIdObj.lessionID);
      }
    }
  }, [assessmentProgress.isAssessmentInProgress, arrAssesmentQuestion]);

  const handleSectionClick = (section: SectionType) => {
    if (sections[section].length > 0) {
      // if (section === "writing") {
      //   const currentScores: CalculatedScores = {
      //     assessment_generalScore: moduleScores.general || 0,
      //     assessment_readingScore: moduleScores.reading || 0,
      //     assessment_listeningScore: moduleScores.listening || 0,
      //     assessment_writingScore: 0,
      //     assessment_speakingScore: 0,
      //   };
      //   localStorage.setItem(
      //     "ASSESSMENT_FINAL_SCORES",
      //     JSON.stringify(currentScores),
      //   );
      //   // console.log("Stored scores before writing module:", currentScores);
      //   navigate("/assessment/writing");
      //   return;
      // } else if (section === "speaking") {
      //   const currentScores: CalculatedScores = {
      //     assessment_generalScore: moduleScores.general || 0,
      //     assessment_readingScore: moduleScores.reading || 0,
      //     assessment_listeningScore: moduleScores.listening || 0,
      //     assessment_writingScore: 0,
      //     assessment_speakingScore: 0,
      //   };
      //   localStorage.setItem(
      //     "ASSESSMENT_FINAL_SCORES",
      //     JSON.stringify(currentScores),
      //   );
      //   // console.log("Stored scores before speaking module:", currentScores);
      //   navigate("/assessment/speaking");
      //   return;
      // }

      assessmentProgress.setCurrentSection(section);
      assessmentProgress.setCurrentQuestionIndex(0);
    }
  };

  const handleNext = async () => {
    // Prevent multiple clicks during score calculation
    if (isCalculatingScore) {
      return;
    }

    const currentSectionQuestions = sections[currentSection];
    if (currentQuestionIndex < currentSectionQuestions.length - 1) {
      assessmentProgress.setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // console.log(`=== COMPLETING ${currentSection.toUpperCase()} MODULE ===`);

      if (currentSection === "general") {
        await calculateModuleScore(
          "general",
          arrGeneralQuestions,
          arrGeneralAnswers,
        );
        // console.log("General module completed. Moving to reading module.");
        assessmentProgress.setCurrentSection("reading");
        assessmentProgress.setCurrentQuestionIndex(0);
      } else if (currentSection === "reading") {
        const readingQuestions = arrAssesmentQuestion.filter(
          (q: Question) => q.moduleID === 8,
        );
        const readingAnswers = arrAnswers.filter((ans) => {
          const question = arrAssesmentQuestion.find(
            (q: Question) => q.queID === ans.queID,
          );
          return question && question.moduleID === 8;
        });
        await calculateModuleScore("reading", readingQuestions, readingAnswers);
        // console.log("Reading module completed. Moving to listening module.");
        assessmentProgress.setCurrentSection("listening");
        assessmentProgress.setCurrentQuestionIndex(0);
      } else if (currentSection === "listening") {
        const listeningQuestions = arrAssesmentQuestion.filter(
          (q: Question) => q.moduleID === 11,
        );
        const listeningAnswers = arrAnswers.filter((ans) => {
          const question = arrAssesmentQuestion.find(
            (q: Question) => q.queID === ans.queID,
          );
          return question && question.moduleID === 11;
        });
        await calculateModuleScore(
          "listening",
          listeningQuestions,
          listeningAnswers,
        );
        // console.log("Listening module completed. Moving to writing module.");
        assessmentProgress.setCurrentSection("writing");
        assessmentProgress.setCurrentQuestionIndex(0);
      } else if (currentSection === "writing") {
        assessmentProgress.setCurrentSection("speaking");
        assessmentProgress.setCurrentQuestionIndex(0);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      assessmentProgress.setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      if (currentSection === "reading") {
        assessmentProgress.setCurrentSection("general");
        assessmentProgress.setCurrentQuestionIndex(sections.general.length - 1);
      } else if (currentSection === "listening") {
        assessmentProgress.setCurrentSection("reading");
        assessmentProgress.setCurrentQuestionIndex(sections.reading.length - 1);
      } else if (currentSection === "writing") {
        assessmentProgress.setCurrentSection("listening");
        assessmentProgress.setCurrentQuestionIndex(
          sections.listening.length - 1,
        );
      } else if (currentSection === "speaking") {
        assessmentProgress.setCurrentSection("writing");
        assessmentProgress.setCurrentQuestionIndex(sections.writing.length - 1);
      }
    }
  };

  const checkAnswerCorrectness = useCallback(
    (
      userAnswer: string,
      queCorrectAns: string,
      queSolution: string,
      question: Question,
    ): boolean => {
      if (!userAnswer) return false;

      if (question?.queType === "MCQ") {
        if (userAnswer === queCorrectAns) {
          return true;
        }

        if (queCorrectAns && queCorrectAns.startsWith("Option")) {
          const optionNumber = queCorrectAns.replace("Option", "");
          if (userAnswer === optionNumber) {
            return true;
          }
        }

        if (question?.queOptions) {
          const correctOption = question.queOptions.find(
            (option) => option.optionID === queCorrectAns,
          );

          if (correctOption && userAnswer === correctOption.optionText) {
            return true;
          }
        }

        if (question?.correctoption && userAnswer === question.correctoption) {
          return true;
        }
      }

      if (question?.queType === "Single Text" && queSolution) {
        if (userAnswer === queSolution) {
          return true;
        }

        if (
          userAnswer.toLowerCase().trim() === queSolution.toLowerCase().trim()
        ) {
          return true;
        }

        if (
          queSolution === "1" ||
          queSolution === "2" ||
          queSolution === "3" ||
          queSolution === "4"
        ) {
          if (userAnswer === queSolution) {
            return true;
          }
        }
      }

      if (queSolution && question?.queType !== "MCQ") {
        if (userAnswer === queSolution) {
          return true;
        }

        if (
          userAnswer.toLowerCase().trim() === queSolution.toLowerCase().trim()
        ) {
          return true;
        }

        if (
          queSolution === "1" ||
          queSolution === "2" ||
          queSolution === "3" ||
          queSolution === "4"
        ) {
          if (userAnswer === queSolution) {
            return true;
          }
        }
      }

      if (queCorrectAns && question?.queType !== "MCQ") {
        if (userAnswer === queCorrectAns) {
          return true;
        }

        if (
          userAnswer.toLowerCase().trim() === queCorrectAns.toLowerCase().trim()
        ) {
          return true;
        }
      }

      return false;
    },
    [],
  );

  const calculateModuleScore = useCallback(
    async (
      moduleType: "general" | "reading" | "listening",
      questions: Question[],
      answers: Answer[],
    ): Promise<number> => {
      try {
        // Create cache key based on moduleType, question IDs, and answer values
        const questionIds = questions
          .map((q) => q.queID)
          .sort((a, b) => (a || 0) - (b || 0))
          .join(",");
        const answerKey = answers
          .map((a) => `${a.queID}:${a.answerAnswer || ""}`)
          .sort()
          .join(",");
        const cacheKey = `${moduleType}-${questionIds}-${answerKey}`;

        // Check cache first
        if (scoreCacheRef.current.has(cacheKey)) {
          const cachedScore = scoreCacheRef.current.get(cacheKey);
          if (cachedScore !== undefined) {
            // Still update state and localStorage to maintain behavior
            setModuleScores((prev) => ({ ...prev, [moduleType]: cachedScore }));
            localStorage.setItem(
              `ASSESSMENT_${moduleType.toUpperCase()}_SCORE`,
              cachedScore.toString(),
            );

            const existingScores = JSON.parse(
              localStorage.getItem("ASSESSMENT_FINAL_SCORES") || "{}",
            ) as Partial<CalculatedScores>;

            const allScores: CalculatedScores = {
              assessment_generalScore:
                moduleType === "general"
                  ? cachedScore
                  : existingScores.assessment_generalScore ||
                    moduleScores.general ||
                    0,
              assessment_readingScore:
                moduleType === "reading"
                  ? cachedScore
                  : existingScores.assessment_readingScore ||
                    moduleScores.reading ||
                    0,
              assessment_listeningScore:
                moduleType === "listening"
                  ? cachedScore
                  : existingScores.assessment_listeningScore ||
                    moduleScores.listening ||
                    0,
              assessment_writingScore:
                existingScores.assessment_writingScore || 0,
              assessment_speakingScore:
                existingScores.assessment_speakingScore || 0,
              assessment_decisionMaking_generalScore:
                existingScores.assessment_decisionMaking_generalScore || 0,
              assessment_businessEtiquette_generalScore:
                existingScores.assessment_businessEtiquette_generalScore || 0,
              assessment_communicationSkills_generalScore:
                existingScores.assessment_communicationSkills_generalScore || 0,
            };

            if (moduleType === "general") {
              allScores.assessment_generalScore = cachedScore;
            } else if (moduleType === "reading") {
              allScores.assessment_readingScore = cachedScore;
            } else if (moduleType === "listening") {
              allScores.assessment_listeningScore = cachedScore;
            }

            localStorage.setItem(
              "ASSESSMENT_FINAL_SCORES",
              JSON.stringify(allScores),
            );
            setCalculatedScores(allScores);

            return cachedScore;
          }
        }

        setIsCalculatingScore(true);
        // console.log(`=== CALCULATING ${moduleType.toUpperCase()} MODULE SCORE ===`);

        if (!questions || questions.length === 0) {
          setModuleScores((prev) => ({ ...prev, [moduleType]: 0 }));
          setIsCalculatingScore(false);
          scoreCacheRef.current.set(cacheKey, 0);
          return 0;
        }

        if (!answers || answers.length === 0) {
          setModuleScores((prev) => ({ ...prev, [moduleType]: 0 }));
          setIsCalculatingScore(false);
          scoreCacheRef.current.set(cacheKey, 0);
          return 0;
        }

        let correctAnswers = 0;
        let totalQuestions = 0;

        let decisionMakingCorrect = 0;
        let decisionMakingTotal = 0;
        let businessEtiquetteCorrect = 0;
        let businessEtiquetteTotal = 0;
        let communicationSkillsCorrect = 0;
        let communicationSkillsTotal = 0;

        questions.forEach((question) => {
          const userAnswer = answers.find(
            (ans) => ans.queID === question.queID,
          );

          if (
            moduleType !== "general" &&
            question.queVerificationRequred === "Yes"
          ) {
            return;
          }

          const correctAnswer =
            moduleType === "general"
              ? question.correctoption
              : question.queCorrectAns || question.queSolution;

          if (userAnswer && correctAnswer) {
            totalQuestions++;

            const isCorrect = checkAnswerCorrectness(
              userAnswer.answerAnswer,
              correctAnswer,
              correctAnswer,
              {
                ...question,
                queType: moduleType === "general" ? "MCQ" : question.queType,
              },
            );

            if (isCorrect) {
              correctAnswers++;

              if (moduleType === "general" && question.questiontype) {
                const questionType = question.questiontype.toLowerCase();
                if (questionType.includes("decision")) {
                  decisionMakingCorrect++;
                  decisionMakingTotal++;
                } else if (questionType.includes("etiquette")) {
                  businessEtiquetteCorrect++;
                  businessEtiquetteTotal++;
                } else if (questionType.includes("communication")) {
                  communicationSkillsCorrect++;
                  communicationSkillsTotal++;
                }
              }
            } else {
              if (moduleType === "general" && question.questiontype) {
                const questionType = question.questiontype.toLowerCase();
                if (questionType.includes("decision")) {
                  decisionMakingTotal++;
                } else if (questionType.includes("etiquette")) {
                  businessEtiquetteTotal++;
                } else if (questionType.includes("communication")) {
                  communicationSkillsTotal++;
                }
              }
            }
          }
        });

        const percentage =
          totalQuestions > 0 ? (correctAnswers / totalQuestions) * 10 : 0;
        const finalScore = Math.round(percentage * 10) / 10;

        let categoryScores: Record<string, number> = {};
        if (moduleType === "general") {
          const decisionMakingScore =
            decisionMakingTotal > 0
              ? Math.round(
                  (decisionMakingCorrect / decisionMakingTotal) * 10 * 10,
                ) / 10
              : 0;
          const businessEtiquetteScore =
            businessEtiquetteTotal > 0
              ? Math.round(
                  (businessEtiquetteCorrect / businessEtiquetteTotal) * 10 * 10,
                ) / 10
              : 0;
          const communicationSkillsScore =
            communicationSkillsTotal > 0
              ? Math.round(
                  (communicationSkillsCorrect / communicationSkillsTotal) *
                    10 *
                    10,
                ) / 10
              : 0;

          categoryScores = {
            assessment_decisionMaking_generalScore: decisionMakingScore,
            assessment_businessEtiquette_generalScore: businessEtiquetteScore,
            assessment_communicationSkills_generalScore:
              communicationSkillsScore,
          };
        }

        // Store in cache before updating state
        scoreCacheRef.current.set(cacheKey, finalScore);

        setModuleScores((prev) => ({ ...prev, [moduleType]: finalScore }));

        localStorage.setItem(
          `ASSESSMENT_${moduleType.toUpperCase()}_SCORE`,
          finalScore.toString(),
        );

        const existingScores = JSON.parse(
          localStorage.getItem("ASSESSMENT_FINAL_SCORES") || "{}",
        ) as Partial<CalculatedScores>;

        const allScores: CalculatedScores = {
          assessment_generalScore:
            moduleType === "general"
              ? finalScore
              : existingScores.assessment_generalScore ||
                moduleScores.general ||
                0,
          assessment_readingScore:
            moduleType === "reading"
              ? finalScore
              : existingScores.assessment_readingScore ||
                moduleScores.reading ||
                0,
          assessment_listeningScore:
            moduleType === "listening"
              ? finalScore
              : existingScores.assessment_listeningScore ||
                moduleScores.listening ||
                0,
          assessment_writingScore: existingScores.assessment_writingScore || 0,
          assessment_speakingScore:
            existingScores.assessment_speakingScore || 0,
          assessment_decisionMaking_generalScore:
            moduleType === "general"
              ? categoryScores.assessment_decisionMaking_generalScore
              : existingScores.assessment_decisionMaking_generalScore || 0,
          assessment_businessEtiquette_generalScore:
            moduleType === "general"
              ? categoryScores.assessment_businessEtiquette_generalScore
              : existingScores.assessment_businessEtiquette_generalScore || 0,
          assessment_communicationSkills_generalScore:
            moduleType === "general"
              ? categoryScores.assessment_communicationSkills_generalScore
              : existingScores.assessment_communicationSkills_generalScore || 0,
        };

        if (moduleType === "general") {
          allScores.assessment_generalScore = finalScore;
          allScores.assessment_decisionMaking_generalScore =
            categoryScores.assessment_decisionMaking_generalScore;
          allScores.assessment_businessEtiquette_generalScore =
            categoryScores.assessment_businessEtiquette_generalScore;
          allScores.assessment_communicationSkills_generalScore =
            categoryScores.assessment_communicationSkills_generalScore;
        } else if (moduleType === "reading") {
          allScores.assessment_readingScore = finalScore;
        } else if (moduleType === "listening") {
          allScores.assessment_listeningScore = finalScore;
        }

        localStorage.setItem(
          "ASSESSMENT_FINAL_SCORES",
          JSON.stringify(allScores),
        );
        setCalculatedScores(allScores);

        setIsCalculatingScore(false);
        return finalScore;
      } catch (error) {
        console.error(`Error calculating ${moduleType} score:`, error);
        setIsCalculatingScore(false);
        return 0;
      }
    },
    [checkAnswerCorrectness, moduleScores],
  );

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const newMediaRecorder = new MediaRecorder(stream);
    newMediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        setBlobUrl(URL.createObjectURL(event.data));
        setAudioBlob(event.data);
      }
    });

    newMediaRecorder.start();
    setMediaRecorder(newMediaRecorder);
    setRecording(true);
    setIsRecording(true);
  };

  const handleSubmit = async () => {
    try {
      setIsloading(true);

      // Validate OpenAI API key before proceeding
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        toast.error(
          "OpenAI API key is not configured. Please contact support.",
        );
        setIsloading(false);
        return;
      }

      // Get model from environment, default to gpt-4 if not set
      const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4";

      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      const writingAnswers = sections.writing.map((question) => ({
        questionId: question.queID,
        questionText: question.queQuestion || "",
        answer: answers[question.queID] || "",
      }));

      const writingText = writingAnswers
        .map(
          (ans) =>
            `Question ${ans.questionId}:\n${ans.questionText}\n\nAnswer:\n${ans.answer}\n\n---\n\n`,
        )
        .join("");

      const writingAssessmentPrompt = {
        role: "system" as const,
        content: `You are a professional writing assessor. Evaluate the following business writing responses based on:
1. Clarity and Organization (1-10)
2. Grammar and Vocabulary (1-10)
3. Professional Tone (1-10)
4. Content Relevance (1-10)

Provide a final score out of 10 (average of the above scores).
Also provide brief feedback for improvement.

Here are the responses to evaluate:
${writingText}`,
      };

      let writingScore = 0;
      let writingAssessment = "";

      try {
        const writingCompletion = await openai.chat.completions.create({
          model: model,
          messages: [writingAssessmentPrompt],
          max_tokens: 500,
          temperature: 0.7,
        });

        writingAssessment =
          writingCompletion.choices[0]?.message?.content || "";

        if (!writingAssessment) {
          throw new Error("Empty response from OpenAI for writing assessment");
        }

        const writingScoreMatch =
          writingAssessment.match(/final score:?\s*(\d+\.?\d*)/i) ||
          writingAssessment.match(/overall:?\s*(\d+\.?\d*)/i) ||
          writingAssessment.match(/score:?\s*(\d+\.?\d*)/i);
        writingScore = writingScoreMatch ? parseFloat(writingScoreMatch[1]) : 0;

        // Validate score is within expected range
        if (
          Number.isNaN(writingScore) ||
          writingScore < 0 ||
          writingScore > 10
        ) {
          console.warn("Invalid writing score extracted, defaulting to 0");
          writingScore = 0;
        }
      } catch (error) {
        console.error("Error evaluating writing:", error);
        toast.error("Failed to evaluate writing assessment. Please try again.");
        setIsloading(false);
        return;
      }

      const generalAnswers = sections.general.map((question) => ({
        questionId: question.queID,
        questionText: question.question || "",
        answer: answers[question.queID] || "",
      }));

      const generalText = generalAnswers
        .map(
          (ans) =>
            `Question ${ans.questionId}:\n${ans.questionText}\n\nAnswer:\n${ans.answer}\n\n---\n\n`,
        )
        .join("");

      const generalAssessmentPrompt = {
        role: "system" as const,
        content: `You are a professional business communication assessor. Evaluate the following general business communication responses based on:
1. Business Knowledge (1-10)
2. Communication Clarity (1-10)
3. Professional Judgment (1-10)
4. Problem-Solving Skills (1-10)

Provide a final score out of 10 (average of the above scores).
Also provide brief feedback for improvement.

Here are the responses to evaluate:
${generalText}`,
      };

      let generalScore = 0;
      let generalAssessment = "";

      try {
        const generalCompletion = await openai.chat.completions.create({
          model: model,
          messages: [generalAssessmentPrompt],
          max_tokens: 500,
          temperature: 0.7,
        });

        generalAssessment =
          generalCompletion.choices[0]?.message?.content || "";

        if (!generalAssessment) {
          throw new Error("Empty response from OpenAI for general assessment");
        }

        const generalScoreMatch =
          generalAssessment.match(/final score:?\s*(\d+\.?\d*)/i) ||
          generalAssessment.match(/overall:?\s*(\d+\.?\d*)/i) ||
          generalAssessment.match(/score:?\s*(\d+\.?\d*)/i);
        generalScore = generalScoreMatch ? parseFloat(generalScoreMatch[1]) : 0;

        // Validate score is within expected range
        if (
          Number.isNaN(generalScore) ||
          generalScore < 0 ||
          generalScore > 10
        ) {
          console.warn("Invalid general score extracted, defaulting to 0");
          generalScore = 0;
        }
      } catch (error) {
        console.error("Error evaluating general assessment:", error);
        toast.error("Failed to evaluate general assessment. Please try again.");
        setIsloading(false);
        return;
      }

      const readingAnswers = sections.reading.map((question) => ({
        questionId: question.queID,
        questionText: question.queQuestion || "",
        answer: answers[question.queID] || "",
      }));

      const readingText = readingAnswers
        .map(
          (ans) =>
            `Question ${ans.questionId}:\n${ans.questionText}\n\nAnswer:\n${ans.answer}\n\n---\n\n`,
        )
        .join("");

      const readingAssessmentPrompt = {
        role: "system" as const,
        content: `You are a professional reading comprehension assessor. Evaluate the following reading comprehension responses based on:
1. Comprehension Accuracy (1-10)
2. Critical Analysis (1-10)
3. Information Retention (1-10)
4. Interpretation Skills (1-10)

Provide a final score out of 10 (average of the above scores).
Also provide brief feedback for improvement.

Here are the responses to evaluate:
${readingText}`,
      };

      let readingScore = 0;
      let readingAssessment = "";

      try {
        const readingCompletion = await openai.chat.completions.create({
          model: model,
          messages: [readingAssessmentPrompt],
          max_tokens: 500,
          temperature: 0.7,
        });

        readingAssessment =
          readingCompletion.choices[0]?.message?.content || "";

        if (!readingAssessment) {
          throw new Error("Empty response from OpenAI for reading assessment");
        }

        const readingScoreMatch =
          readingAssessment.match(/final score:?\s*(\d+\.?\d*)/i) ||
          readingAssessment.match(/overall:?\s*(\d+\.?\d*)/i) ||
          readingAssessment.match(/score:?\s*(\d+\.?\d*)/i);
        readingScore = readingScoreMatch ? parseFloat(readingScoreMatch[1]) : 0;

        // Validate score is within expected range
        if (
          Number.isNaN(readingScore) ||
          readingScore < 0 ||
          readingScore > 10
        ) {
          console.warn("Invalid reading score extracted, defaulting to 0");
          readingScore = 0;
        }
      } catch (error) {
        console.error("Error evaluating reading assessment:", error);
        toast.error("Failed to evaluate reading assessment. Please try again.");
        setIsloading(false);
        return;
      }

      const listeningAnswers = sections.listening.map((question) => ({
        questionId: question.queID,
        questionText: question.queQuestion || "",
        answer: answers[question.queID] || "",
      }));

      const listeningText = listeningAnswers
        .map(
          (ans) =>
            `Question ${ans.questionId}:\n${ans.questionText}\n\nAnswer:\n${ans.answer}\n\n---\n\n`,
        )
        .join("");

      const listeningAssessmentPrompt = {
        role: "system" as const,
        content: `You are a professional listening comprehension assessor. Evaluate the following listening comprehension responses based on:
1. Auditory Comprehension (1-10)
2. Detail Retention (1-10)
3. Context Understanding (1-10)
4. Response Accuracy (1-10)

Provide a final score out of 10 (average of the above scores).
Also provide brief feedback for improvement.

Here are the responses to evaluate:
${listeningText}`,
      };

      let listeningScore = 0;
      let listeningAssessment = "";

      try {
        const listeningCompletion = await openai.chat.completions.create({
          model: model,
          messages: [listeningAssessmentPrompt],
          max_tokens: 500,
          temperature: 0.7,
        });

        listeningAssessment =
          listeningCompletion.choices[0]?.message?.content || "";

        if (!listeningAssessment) {
          throw new Error(
            "Empty response from OpenAI for listening assessment",
          );
        }

        const listeningScoreMatch =
          listeningAssessment.match(/final score:?\s*(\d+\.?\d*)/i) ||
          listeningAssessment.match(/overall:?\s*(\d+\.?\d*)/i) ||
          listeningAssessment.match(/score:?\s*(\d+\.?\d*)/i);
        listeningScore = listeningScoreMatch
          ? parseFloat(listeningScoreMatch[1])
          : 0;

        // Validate score is within expected range
        if (
          Number.isNaN(listeningScore) ||
          listeningScore < 0 ||
          listeningScore > 10
        ) {
          console.warn("Invalid listening score extracted, defaulting to 0");
          listeningScore = 0;
        }
      } catch (error) {
        console.error("Error evaluating listening assessment:", error);
        toast.error(
          "Failed to evaluate listening assessment. Please try again.",
        );
        setIsloading(false);
        return;
      }

      let assessment_speakingScore = 0;
      let speakingAssessment = "";

      if (audioBlob) {
        try {
          // Validate audio blob
          if (audioBlob.size === 0) {
            throw new Error("Audio recording is empty");
          }

          const audioFile = new File([audioBlob], "audio.webm", {
            type: "audio/webm",
          });

          const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
          });

          if (!transcription?.text || transcription.text.trim() === "") {
            throw new Error("Empty transcription received from OpenAI");
          }

          const speakingAssessmentPrompt = {
            role: "system" as const,
            content: `You are a professional speaking assessor. Evaluate the following business speaking response based on:
1. Pronunciation and Clarity (1-10)
2. Fluency and Pace (1-10)
3. Grammar and Vocabulary (1-10)
4. Content Organization (1-10)

Provide a final score out of 10 (average of the above scores).
Also provide brief feedback for improvement.

Here is the transcribed response to evaluate:
${transcription.text}`,
          };

          const speakingCompletion = await openai.chat.completions.create({
            model: model,
            messages: [speakingAssessmentPrompt],
            max_tokens: 500,
            temperature: 0.7,
          });

          speakingAssessment =
            speakingCompletion.choices[0]?.message?.content || "";

          if (!speakingAssessment) {
            throw new Error(
              "Empty response from OpenAI for speaking assessment",
            );
          }

          const speakingScoreMatch =
            speakingAssessment.match(/final score:?\s*(\d+\.?\d*)/i) ||
            speakingAssessment.match(/overall:?\s*(\d+\.?\d*)/i) ||
            speakingAssessment.match(/score:?\s*(\d+\.?\d*)/i);
          assessment_speakingScore = speakingScoreMatch
            ? parseFloat(speakingScoreMatch[1])
            : 0;

          // Validate score is within expected range
          if (
            Number.isNaN(assessment_speakingScore) ||
            assessment_speakingScore < 0 ||
            assessment_speakingScore > 10
          ) {
            console.warn("Invalid speaking score extracted, defaulting to 0");
            assessment_speakingScore = 0;
          }
        } catch (error) {
          console.error("Error evaluating speaking assessment:", error);
          toast.error(
            "Failed to evaluate speaking assessment. Please try again.",
          );
          setIsloading(false);
          return;
        }
      }

      const textBlob = new Blob([writingText], { type: "text/plain" });

      let fileUrls: { audioUrl: string; textUrl: string; videoUrl: string } = {
        audioUrl: "",
        textUrl: "",
        videoUrl: "",
      };

      // Only attempt file upload if we have valid data
      try {
        if (!audioBlob || audioBlob.size === 0) {
          console.warn("No audio recording found, skipping audio upload");
          // Continue without audio URL - we still have the scores
        } else {
          const mp3Blob = await convertToMP3(audioBlob);
          fileUrls = await uploadAssessmentFiles(mp3Blob, textBlob);
        }

        const assessmentData = {
          speakingURL: fileUrls.audioUrl,
          writingText: fileUrls.textUrl,
          timestamp: Date.now(),
          assessment_speakingScore: assessment_speakingScore,
          assessment_writingScore: writingScore,
          assessment_readingScore: readingScore,
          assessment_listeningScore: listeningScore,
          assessment_generalScore: generalScore,
          writingAssessment: writingAssessment,
          speakingAssessment: speakingAssessment,
          readingAssessment: readingAssessment,
          listeningAssessment: listeningAssessment,
          generalAssessment: generalAssessment,
          writingAnswers: writingAnswers.map((ans) => ({
            questionId: ans.questionId,
            question: ans.questionText,
            answer: ans.answer,
          })),
        };
        localStorage.setItem("ASSESSMENT_DATA", JSON.stringify(assessmentData));

        await saveAssessmentToGoogleSpreadsheet(assessmentData);

        const updatedAnswers = arrAnswers.map((answer) => {
          if (sections.speaking.some((q) => q.queID === answer.queID)) {
            return {
              ...answer,
              answerAnswer: fileUrls.audioUrl,
              score: assessment_speakingScore,
            };
          }
          if (sections.writing.some((q) => q.queID === answer.queID)) {
            return {
              ...answer,
              answerAnswer: fileUrls.textUrl,
              score: writingScore,
            };
          }
          return answer;
        });

        assessmentProgress.setArrAnswers(updatedAnswers);

        // Upload to server (non-blocking - don't fail if this fails)
        uploadImageToServer().catch((error) => {
          console.error("Error uploading to server:", error);
          // Don't show error to user as scores are already saved
        });
      } catch (error) {
        console.error("Error uploading assessment files:", error);
        // Don't fail the entire assessment if file upload fails
        // Scores are already calculated and saved
        toast.warn(
          "Assessment completed but file upload failed. Scores have been saved.",
        );
        // Still proceed with submission
        uploadImageToServer().catch(() => {
          // Silent fail - scores are already saved
        });
      }
    } catch (error) {
      console.error("Error handling submission:", error);
      toast.error("Failed to submit assessment");
      setIsloading(false);
    }
  };

  const convertToMP3 = async (audioBlob: Blob): Promise<Blob> => {
    try {
      if (MediaRecorder.isTypeSupported("audio/mp3")) {
        return await directMP3Conversion(audioBlob);
      }

      const wavBlob = await convertToWAV(audioBlob);
      // console.warn('MP3 conversion not supported, using WAV format');
      return new Blob([wavBlob], { type: "audio/wav" });
    } catch (error) {
      console.error("Error converting audio:", error);
      // console.warn('Audio conversion failed, using original format');
      return audioBlob;
    }
  };

  const directMP3Conversion = async (audioBlob: Blob): Promise<Blob> => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as { webkitAudioContext?: new () => AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("AudioContext not supported");
      }
      const audioContext = new AudioContextClass();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const destination = audioContext.createMediaStreamDestination();
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(destination);
      source.start(0);

      return new Promise((resolve) => {
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: "audio/mp3",
          audioBitsPerSecond: 128000,
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const mp3Blob = new Blob(chunks, { type: "audio/mp3" });
          resolve(mp3Blob);
        };

        mediaRecorder.start();
        source.onended = () => mediaRecorder.stop();
      });
    } catch {
      throw new Error("Direct MP3 conversion failed");
    }
  };

  const convertToWAV = async (audioBlob: Blob): Promise<Blob> => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as { webkitAudioContext?: new () => AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("AudioContext not supported");
      }
      const audioContext = new AudioContextClass();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const numberOfChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length * numberOfChannels * 2;
      const buffer = new ArrayBuffer(44 + length);
      const view = new DataView(buffer);

      const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(view, 0, "RIFF");
      view.setUint32(4, 36 + length, true);
      writeString(view, 8, "WAVE");
      writeString(view, 12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, audioBuffer.sampleRate, true);
      view.setUint32(28, audioBuffer.sampleRate * 2 * numberOfChannels, true);
      view.setUint16(32, numberOfChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, "data");
      view.setUint32(40, length, true);

      const offset = 44;
      const channelData: Float32Array[] = [];
      for (let i = 0; i < numberOfChannels; i++) {
        channelData.push(audioBuffer.getChannelData(i));
      }

      let index = 0;
      while (index < audioBuffer.length) {
        for (let i = 0; i < numberOfChannels; i++) {
          const sample = channelData[i][index] * 0x7fff;
          view.setInt16(
            offset + (index * numberOfChannels + i) * 2,
            sample < 0
              ? Math.max(-0x8000, Math.floor(sample))
              : Math.min(0x7fff, Math.ceil(sample)),
            true,
          );
        }
        index++;
      }

      return new Blob([buffer], { type: "audio/wav" });
    } catch {
      throw new Error("WAV conversion failed");
    }
  };

  const uploadAssessmentFiles = async (
    audioBlob: Blob,
    textBlob: Blob,
  ): Promise<{ audioUrl: string; textUrl: string; videoUrl: string }> => {
    try {
      const BASE_URL =
        "https://stage.englishmonkapp.com/englishmonk-staging/backend/web/";

      const formData = new FormData();

      const jsonData = [
        {
          templateConstantCode: "000018",
          apiType: "Android",
          apiVersion: "1.0",
          subpath: "assessment",
        },
      ];

      formData.append("json", JSON.stringify(jsonData));

      const timestamp = Date.now();
      const audioFile = new File(
        [audioBlob],
        `assessment_audio_${userId}_${timestamp}.mp3`,
      );
      const textFile = new File(
        [textBlob],
        `assessment_writing_${userId}_${timestamp}.txt`,
      );

      const emptyVideoBlob = new Blob([], { type: "video/mp4" });
      const videoFile = new File(
        [emptyVideoBlob],
        `empty_video_${userId}_${timestamp}.mp4`,
      );

      formData.append("audioFile", audioFile);
      formData.append("textFile", textFile);
      formData.append("videoFile", videoFile);

      const apiUrl = `${API_BASE_URL}users/upload-multiple-media`;

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      // console.log("Upload result:", JSON.stringify(result));

      const uploadResult = result[0];

      if (!uploadResult || uploadResult.status !== "true") {
        throw new Error(uploadResult?.message || "Upload failed");
      }

      return {
        audioUrl: BASE_URL + uploadResult.audiofilepath,
        textUrl: BASE_URL + uploadResult.textfilepath,
        videoUrl: "",
      };
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload assessment files");
      throw error;
    }
  };

  const saveAssessmentToGoogleSpreadsheet = async (assessmentData: {
    speakingURL: string;
    writingText: string;
    assessment_speakingScore: number;
    assessment_writingScore: number;
    assessment_readingScore: number;
    assessment_listeningScore: number;
    assessment_generalScore: number;
  }) => {
    try {
      const userDataString = localStorage.getItem("USER_DATA");
      const userData = userDataString ? JSON.parse(userDataString) : {};
      const firstName =
        userData.userFirstName ||
        localStorage.getItem("USER_NAME")?.split(" ")[0] ||
        "Test";
      const lastName =
        userData.userLastName ||
        localStorage.getItem("USER_NAME")?.split(" ")[1] ||
        "User";
      const candidateId = userData.userID || "UNKNOWN";

      const webAppUrl =
        "https://script.google.com/macros/s/AKfycbzYqO3-LWBk3Nso7B6W7-LTqx_FAA-HNBIVzpVDtxqnBenwvTLBdAHArEBuA2g0Q9zu5A/exec";

      const formBody =
        `candidateId=${encodeURIComponent(candidateId)}&` +
        `firstName=${encodeURIComponent(firstName)}&` +
        `lastName=${encodeURIComponent(lastName)}&` +
        `audioUrl=${encodeURIComponent(assessmentData.speakingURL)}&` +
        `score=${encodeURIComponent(0)}&` +
        `explanation=${encodeURIComponent("Assessment Tool Results")}&` +
        `interviewTranscript=${encodeURIComponent("")}&` +
        `interviewVideo=${encodeURIComponent("")}&` +
        `interviewText=${encodeURIComponent(assessmentData.writingText)}&` +
        `speakingURL=${encodeURIComponent(assessmentData.speakingURL)}&` +
        `writingText=${encodeURIComponent(assessmentData.writingText)}&` +
        `communiqateAiScore=${encodeURIComponent(0)}&` +
        `assessment_speakingScore=${encodeURIComponent(
          assessmentData.assessment_speakingScore,
        )}&` +
        `assessment_writingScore=${encodeURIComponent(
          assessmentData.assessment_writingScore,
        )}&` +
        `assessment_readingScore=${encodeURIComponent(
          assessmentData.assessment_readingScore,
        )}&` +
        `assessment_listeningScore=${encodeURIComponent(
          assessmentData.assessment_listeningScore,
        )}&` +
        `assessment_generalScore=${encodeURIComponent(
          assessmentData.assessment_generalScore,
        )}`;

      const response = await fetch(webAppUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
      });

      await response.text();
      // console.log("Assessment Spreadsheet update result:", result);

      // console.log("Sent assessment data to Google Spreadsheet:", assessmentData);

      toast.success("Assessment data saved to spreadsheet");
    } catch (error) {
      console.error("Error saving assessment to spreadsheet:", error);
      toast.error("Failed to save assessment data to spreadsheet");
    }
  };

  const uploadImageToServer = async (): Promise<void> => {
    try {
      setIsloading(true);

      const formData = new FormData();
      if (audioBlob) {
        formData.append("FileField", audioBlob, `recording${userId}.mp4`);
      }

      formData.append("FilePath", "users");
      formData.append(
        "json",
        JSON.stringify([
          { loginuserID: userId, apiType: "Android", apiVersion: "1.0" },
        ]),
      );

      const apiUrl = `${API_BASE_URL}users/file-upload`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: "Bearer access-token",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      await response.json();
      // console.log('Image uploaded successfully:', JSON.stringify(data));
      submitExamApi();
    } catch (error) {
      console.error("Error uploading image:", error);
      setIsloading(false);
      throw error; // Re-throw so caller can handle it
    }
  };

  const checktheStatus = () => {
    try {
      setIsloading(true);

      // Check if assessment is already in progress (from Zustand)
      if (assessmentProgress.isAssessmentInProgress) {
        // Assessment is in progress - restore state and continue
        setIsloading(false);
        setIsPreModalOpen(false); // Don't show PreModal
        // State is already in Zustand, component will use it
        return;
      }

      // Fresh start - check API status
      const dictParameter = JSON.stringify([
        {
          loginUserID: userId,
          languageID: "1",
          apiType: "Android",
          apiVersion: "1.0",
        },
      ]);

      // console.log("assessment/user-assessment-acess's dictParameter = " + dictParameter);

      const apiUrl = `${API_BASE_URL}assessment/user-assessment-acess`;

      fetch(apiUrl, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
        body: "json=" + dictParameter,
      })
        .then((response) => response.json())
        .then((responseJson) => {
          // console.log("responseJson for exam submit " + JSON.stringify(responseJson));
          if (responseJson[0].status === "false") {
            setIsloading(false);
            setIsAlreadyModalOpen(true);
          } else {
            setIsPreModalOpen(true);
            setIsloading(false);
          }
        });
    } catch {
      // console.log("Error in lesson/submit-answers " + error);
      setIsloading(false);
    }
  };

  const submitExamApi = () => {
    try {
      const storedScores = localStorage.getItem("ASSESSMENT_FINAL_SCORES");
      let scores = calculatedScores;

      if (!scores && storedScores) {
        try {
          scores = JSON.parse(storedScores) as CalculatedScores;
        } catch (error) {
          console.error("Error parsing stored scores:", error);
          scores = {
            assessment_speakingScore: 0,
            assessment_writingScore: 0,
            assessment_listeningScore: 0,
            assessment_readingScore: 0,
            assessment_generalScore: 0,
            assessment_businessEtiquette_generalScore: 0,
            assessment_communicationSkills_generalScore: 0,
            assessment_decisionMaking_generalScore: 0,
          };
        }
      }

      if (!scores) {
        scores = {
          assessment_speakingScore: 0,
          assessment_writingScore: 0,
          assessment_listeningScore: 0,
          assessment_readingScore: 0,
          assessment_generalScore: 0,
          assessment_businessEtiquette_generalScore: 0,
          assessment_communicationSkills_generalScore: 0,
          assessment_decisionMaking_generalScore: 0,
        };
      }

      const dictParameter = JSON.stringify([
        {
          corporateUserId: corporateUserId,
          languageID: "1",
          moduleID: "8",
          apiType: "Android",
          apiVersion: "1.0",
          loginUserID: userId,
          lessionID: lessionId,
          assessment_speakingScore: Math.round(
            scores.assessment_speakingScore || 0,
          ),
          assessment_writingScore: Math.round(
            scores.assessment_writingScore || 0,
          ),
          assessment_listeningScore: Math.round(
            scores.assessment_listeningScore || 0,
          ),
          assessment_readingScore: Math.round(
            scores.assessment_readingScore || 0,
          ),
          assessment_generalScore: Math.round(
            scores.assessment_generalScore || 0,
          ),
          assessment_businessEtiquette_generalScore: Math.round(
            scores.assessment_businessEtiquette_generalScore || 0,
          ),
          assessment_communicationSkills_generalScore: Math.round(
            scores.assessment_communicationSkills_generalScore || 0,
          ),
          assessment_decisionMaking_generalScore: Math.round(
            scores.assessment_decisionMaking_generalScore || 0,
          ),
        },
      ]);

      // console.log("submitExamApi's dictParameter = " + dictParameter);
      // console.log("Using scores:", scores);

      const apiUrl = `${API_BASE_URL}assessment/submit-user-assessment`;

      fetch(apiUrl, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
        body: "json=" + dictParameter,
      })
        .then((response) => response.json())
        .then(() => {
          // console.log("responseJson for exam submit " + JSON.stringify(responseJson));
          // Clear assessment progress after successful submission
          assessmentProgress.resetAssessment();
          setIsModalOpen(true);
          setIsloading(false);
        })
        .catch((error) => {
          console.error("Error submitting assessment:", error);
          setIsloading(false);
          toast.error("Failed to submit assessment");
        });
    } catch (error) {
      console.error("Error in submitExamApi:", error);
      setIsloading(false);
      toast.error("Failed to submit assessment");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && firstQuestionWithAudioID > 0) {
      mediaRecorder.stop();
      setRecording(false);
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      assessmentProgress.updateSelectedOption(firstQuestionWithAudioID, 0);

      // const currentQue = arrAssesmentQuestion.find((que: Question) => que.queID === firstQuestionWithAudioID);
      const updatedAnswers = { ...answers };

      if (firstQuestionWithAudioID in answers) {
        updatedAnswers[firstQuestionWithAudioID] =
          answers[firstQuestionWithAudioID];
      }

      assessmentProgress.setAnswers(updatedAnswers);

      const answer: Answer = {
        answerIsCorrect: "Pending",
        answerIsVerified: "Pending",
        queID: firstQuestionWithAudioID,
        answerAnswer: `recording${userId}.mp4`,
        answerCorrectAnswer: "na",
      };

      assessmentProgress.addAnswer(answer);
    }
  };

  const handleOptionClick = (questionId: number, optionIdx: number) => {
    assessmentProgress.updateSelectedOption(questionId, optionIdx);

    let currentQue: Question | undefined;
    if (currentSection === "general") {
      currentQue = arrGeneralQuestions.find((que) => que.queID === questionId);
    } else {
      currentQue = arrAssesmentQuestion.find(
        (que: Question) => que.queID === questionId,
      );
    }

    const isGeneralQuestion = currentSection === "general";
    const questionType = isGeneralQuestion ? "MCQ" : currentQue?.queType;
    const correctAnswer = isGeneralQuestion
      ? currentQue?.correctoption
      : currentQue?.queCorrectAns;

    // Update answers object
    if (questionType === "MCQ") {
      assessmentProgress.updateAnswer(questionId, `Option${optionIdx + 1}`);
    }

    const answer: Answer = {
      answerIsCorrect:
        isGeneralQuestion || currentQue?.queVerificationRequred === "No"
          ? questionType === "MCQ" && `Option${optionIdx + 1}` === correctAnswer
            ? "Yes"
            : "No"
          : "Pending",
      answerIsVerified:
        isGeneralQuestion || currentQue?.queVerificationRequred === "No"
          ? "Verified"
          : "Pending",
      queID: questionId,
      answerAnswer:
        questionType === "MCQ"
          ? optionIdx !== undefined
            ? `Option${optionIdx + 1}`
            : ""
          : answers[questionId] || "",
      answerCorrectAnswer:
        isGeneralQuestion || currentQue?.queVerificationRequred === "No"
          ? correctAnswer == null
            ? "na"
            : correctAnswer
          : "na",
    };

    if (isGeneralQuestion) {
      assessmentProgress.addGeneralAnswer(answer);
    } else {
      assessmentProgress.addAnswer(answer);
    }
  };

  const closePdf = () => {
    setIsLessonPDFWatch(false);
  };

  const getAssesmentQuestions = () => {
    try {
      setIsloading(true);
      assessmentProgress.startAssessment(); // Mark as started
      getGeneralQuestions();
    } catch {
      setIsloading(false);
      // console.log("Error in Fetching assessment questions " + error);
    }
  };

  const getGeneralQuestions = () => {
    try {
      const dictParameter = JSON.stringify([
        {
          corporateUserId: corporateUserId,
          languageID: "1",
          moduleID: "8",
          isgeneral: "1",
          apiType: "Android",
          apiVersion: "1.0",
        },
      ]);
      // console.log("dictParameter " + JSON.stringify(dictParameter));

      const apiUrl = `${API_BASE_URL}assessment/get-new-questions`;

      fetch(apiUrl, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
        body: "json=" + dictParameter,
      })
        .then((response) => response.json())
        .then((responseJson) => {
          // console.log("General Questions Response: ", JSON.stringify(responseJson));
          if (responseJson[0].data && responseJson[0].data.length > 0) {
            assessmentProgress.setArrGeneralQuestions(responseJson[0].data);
            const newAnswers = Object.fromEntries(
              responseJson[0].data.map((q: Question) => [q.queID, ""]),
            );
            assessmentProgress.setAnswers({
              ...answers,
              ...newAnswers,
            });
          }
          getRegularQuestions();
        })
        .catch(() => {
          // console.log("Error in Fetching general questions: ", error);
          setIsloading(false);
        });
    } catch {
      // console.log("Error in getGeneralQuestions: ", error);
      setIsloading(false);
    }
  };

  const getRegularQuestions = () => {
    try {
      const dictParameter = JSON.stringify([
        {
          corporateUserId: corporateUserId,
          languageID: "1",
          moduleID: "8",
          isgeneral: "0",
          apiType: "Android",
          apiVersion: "1.0",
        },
      ]);
      // console.log("dictParameter " + JSON.stringify(dictParameter));

      const apiUrl = `${API_BASE_URL}assessment/get-new-questions`;

      fetch(apiUrl, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
        body: "json=" + dictParameter,
      })
        .then((response) => response.json())
        .then((responseJson) => {
          // console.log("Regular Questions Response: ", JSON.stringify(responseJson));
          if (responseJson[0].data && responseJson[0].data.length > 0) {
            setArrAssesmentQuestion(responseJson[0].data);
            const newAnswers = Object.fromEntries(
              responseJson[0].data.map((q: Question) => [q.queID, ""]),
            );
            assessmentProgress.setAnswers({
              ...answers,
              ...newAnswers,
            });

            const firstQuestio = responseJson[0].data.find(
              (q: Question) => q.moduleID === 11 && q.queFile,
            );
            const firstQuestioPDF = responseJson[0].data.find(
              (q: Question) => q.moduleID === 8 && q.queFile,
            );
            const lessId = responseJson[0].data.find(
              (q: Question) => q.lessionID,
            );

            if (firstQuestio) {
              setfirstQuestionWithAudio(firstQuestio.queFile || "");
              setfirstQuestionWithAudioID(firstQuestio.queID || 0);
            }
            if (firstQuestioPDF) {
              setfirstQuestionWithPDF(firstQuestioPDF.queFile || "");
            }
            if (lessId) {
              setlessionId(lessId.lessionID || "");
            }

            setIsloading(false);
            setIsPreModalOpen(false);
            assessmentProgress.setTimeRemaining(1200);
          } else {
            setIsloading(false);
            setIsPreModalOpen(false);
            setIsQuestionAvailable(true);
          }
        })
        .catch(() => {
          // console.log("Error in Fetching regular questions: ", error);
          setIsloading(false);
        });
    } catch {
      // console.log("Error in getRegularQuestions: ", error);
      setIsloading(false);
    }
  };

  const handleAnswerChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
    questionId: number,
  ) => {
    assessmentProgress.updateAnswer(questionId, event.target.value);

    const answer: Answer = {
      answerIsCorrect: "Pending",
      answerIsVerified: "Pending",
      queID: questionId,
      answerAnswer: event.target.value,
      answerCorrectAnswer: "na",
    };

    assessmentProgress.addAnswer(answer);
  };

  const handleQuestionClick = (index: number) => {
    if (currentSection === "general") {
      return;
    }
    assessmentProgress.setCurrentQuestionIndex(index);
  };

  if (isloading) {
    return <Loading message={"Processing your request..."} />;
  }

  if (isCalculatingScore) {
    return (
      <Loading message={`Calculating ${currentSection} module score...`} />
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MobileNavbar setShowLogoutDialog={() => {}} />

      <div className="flex flex-col items-center p-3 max-w-screen-md mx-auto flex-1">
        <div className="text-lg md:text-2xl font-semibold mb-4 text-center">
          Time Remaining: {formatTime(timeRemaining)}
        </div>

        {/* Section Progress Indicators */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-4 md:mb-6 justify-center">
          {(
            [
              "general",
              "reading",
              "listening",
              "writing",
              "speaking",
            ] as SectionType[]
          ).map((section) => (
            <div
              key={section}
              onClick={() => handleSectionClick(section)}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-full cursor-pointer transition-colors duration-200 text-sm md:text-base
                                ${
                                  currentSection === section
                                    ? "bg-primary text-white"
                                    : "bg-gray-200 hover:bg-gray-300"
                                } ${
                                  sections[section].length === 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
            >
              <span className="hidden md:inline">
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </span>
              <span className="md:hidden">
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </span>
              {sections[section].length > 0 && (
                <span className="ml-1 md:ml-2 text-xs md:text-sm">
                  ({sections[section].length})
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Current Section Content */}
        <div className="w-full">
          <h2 className="text-lg md:text-2xl font-bold mb-4 capitalize text-center">
            {currentSection}
          </h2>

          {currentSection === "general" && (
            <>
              <div className="mb-4">
                <h4 className="text-lg md:text-xl font-bold">Instructions: </h4>
                <p className="text-base md:text-xl">
                  Answer the following general business questions to assess your
                  professional skills.
                </p>
              </div>
            </>
          )}

          {currentSection === "reading" && (
            <>
              <div className="mb-4">
                <h4 className="text-lg md:text-xl font-bold">Instructions: </h4>
                <p className="text-base md:text-xl">
                  Read the article by clicking the book icon below, and then
                  answer the questions listed below.
                </p>
              </div>
              <div className="flex justify-center mb-4">
                <img
                  src={readingLogo}
                  alt="icon"
                  className="h-12 w-12 md:h-16 md:w-16 cursor-pointer bg-orange-100 p-2 rounded"
                  onClick={() => {
                    setIsLessonPDFWatch(true);
                  }}
                />
              </div>
            </>
          )}

          {currentSection === "listening" && (
            <>
              <div className="mb-4">
                <h4 className="text-lg md:text-xl font-bold">Instructions:</h4>
                <p className="text-base md:text-xl">
                  Listen to the audio clip of a quarterly sales call made by a
                  branch head and answer the following questions.
                </p>
              </div>
              <div className="mb-4">
                <AudioPlayer
                  src={firstQuestionWithAudio}
                  onPlay={() => {
                    /* console.log("onPlay"); */
                  }}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Current Question Display */}
          {sections[currentSection].length > 0 &&
            currentSection !== "writing" &&
            currentSection !== "speaking" && (
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-4">
                {/* Question Numbers Navigation */}
                <div className="flex flex-wrap gap-2 mb-4 border-b pb-4 justify-center">
                  {sections[currentSection].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionClick(index)}
                      disabled={currentSection === "general"}
                      className={`
                                            w-8 h-8 md:w-10 md:h-10 rounded-full text-xs md:text-sm font-medium
                                            flex items-center justify-center
                                            transition-all duration-200
                                            ${
                                              currentQuestionIndex === index
                                                ? "bg-primary text-white shadow-md"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }
                                            ${
                                              currentSection === "general"
                                                ? "cursor-not-allowed opacity-50"
                                                : "cursor-pointer"
                                            }
                                        `}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <div className="question-content">
                  {(() => {
                    const question =
                      sections[currentSection][currentQuestionIndex];
                    const isGeneralQuestion = currentSection === "general";
                    const questionText = isGeneralQuestion
                      ? question.question
                      : question.queQuestion;
                    const questionType = isGeneralQuestion
                      ? "MCQ"
                      : question.queType;

                    return (
                      <div key={question.queID}>
                        <h3 className="font-semibold mb-4 text-sm md:text-base">
                          Q. {questionText}
                        </h3>

                        {questionType === "MCQ" ? (
                          <div className="space-y-2">
                            {isGeneralQuestion
                              ? // Handle general questions with option1, option2, etc.
                                (
                                  [
                                    "option1",
                                    "option2",
                                    "option3",
                                    "option4",
                                  ] as const
                                )
                                  .filter((key) => question[key])
                                  .map((key, index) => (
                                    <div
                                      key={index}
                                      className={`option flex items-center p-3 md:p-2 border rounded-lg cursor-pointer text-sm md:text-base
                                                                        ${
                                                                          selectedOptions[
                                                                            question
                                                                              .queID
                                                                          ] ===
                                                                          index
                                                                            ? "bg-primary text-white border-primary"
                                                                            : "bg-white text-gray-800 hover:bg-gray-100"
                                                                        }`}
                                      onClick={() =>
                                        handleOptionClick(question.queID, index)
                                      }
                                    >
                                      <span
                                        className={`font-bold ${
                                          selectedOptions[question.queID] ===
                                          index
                                            ? "text-white"
                                            : "text-primary"
                                        } mr-2 flex-shrink-0`}
                                      >
                                        {String.fromCharCode(65 + index)}
                                      </span>
                                      <span className="option-text break-words">
                                        {question[key]}
                                      </span>
                                    </div>
                                  ))
                              : // Handle regular questions with queOption1, queOption2, etc.
                                Object.entries(question)
                                  .filter(
                                    ([key, value]) =>
                                      key.startsWith("queOption") &&
                                      typeof value === "string" &&
                                      value,
                                  )
                                  .map(([, value], index) => (
                                    <div
                                      key={index}
                                      className={`option flex items-center p-3 md:p-2 border rounded-lg cursor-pointer text-sm md:text-base
                                                                        ${
                                                                          selectedOptions[
                                                                            question
                                                                              .queID
                                                                          ] ===
                                                                          index
                                                                            ? "bg-primary text-white border-primary"
                                                                            : "bg-white text-gray-800 hover:bg-gray-100"
                                                                        }`}
                                      onClick={() =>
                                        handleOptionClick(question.queID, index)
                                      }
                                    >
                                      <span
                                        className={`font-bold ${
                                          selectedOptions[question.queID] ===
                                          index
                                            ? "text-white"
                                            : "text-primary"
                                        } mr-2 flex-shrink-0`}
                                      >
                                        {String.fromCharCode(65 + index)}
                                      </span>
                                      <span className="option-text break-words">
                                        {value as string}
                                      </span>
                                    </div>
                                  ))}
                          </div>
                        ) : (
                          <textarea
                            className="w-full px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-400 h-32 md:h-40 resize-none text-sm md:text-base"
                            placeholder="Type your answer here..."
                            value={answers[question.queID] || ""}
                            onChange={(e) =>
                              handleAnswerChange(e, question.queID)
                            }
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

          {/* AI Module Information for Writing and Speaking */}
          {currentSection === "writing" && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 mb-4">
                <h4 className="text-base md:text-lg font-semibold text-green-800 mb-2">
                  AI-Powered Writing Assessment
                </h4>
                <p className="text-green-700 mb-3 text-sm md:text-base">
                  This writing section now features advanced AI evaluation with
                  real-time feedback, grammar analysis, and detailed scoring.
                </p>
                <button
                  onClick={() => navigate("/assessment/writing")}
                  className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
                >
                  Start AI Writing Assessment
                </button>
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                <p>• Advanced AI evaluation with GPT-4 analysis</p>
                <p>• Real-time grammar and vocabulary assessment</p>
                <p>• Detailed feedback and improvement suggestions</p>
                <p>• Professional assessment scoring system</p>
              </div>
            </div>
          )}

          {currentSection === "speaking" && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4">
                <h4 className="text-base md:text-lg font-semibold text-blue-800 mb-2">
                  AI-Powered Speaking Assessment
                </h4>
                <p className="text-blue-700 mb-3 text-sm md:text-base">
                  This speaking section now features advanced AI evaluation with
                  real-time feedback, pronunciation analysis, and detailed
                  scoring.
                </p>
                <button
                  onClick={() => navigate("/assessment/speaking")}
                  className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
                >
                  Start AI Speaking Assessment
                </button>
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                <p>• Advanced AI evaluation with Whisper transcription</p>
                <p>• Real-time pronunciation and fluency analysis</p>
                <p>• Detailed feedback and improvement suggestions</p>
                <p>• Professional assessment scoring system</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col md:flex-row justify-between mt-4 gap-2">
            {currentSection !== "general" && (
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0 || isCalculatingScore}
                className="w-full md:w-auto px-4 md:px-6 py-2 bg-gray-200 rounded-lg disabled:opacity-50 text-sm md:text-base"
              >
                Previous
              </button>
            )}
            {currentSection === "speaking" &&
            currentQuestionIndex === sections.speaking.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isCalculatingScore}
                className={`w-full md:w-auto px-4 md:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm md:text-base ${
                  isCalculatingScore ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Submit
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isCalculatingScore}
                className={`w-full md:w-auto px-4 md:px-6 py-2 bg-primary text-white rounded-lg text-sm md:text-base ${
                  currentSection === "general" ? "md:ml-auto" : ""
                } ${isCalculatingScore ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isCalculatingScore ? "Calculating..." : "Next"}
              </button>
            )}
          </div>
        </div>

        {/* Modals */}
        <ProficiencyModal isOpen={isModalOpen} onClose={() => navigate("/")} />
        <PreAssessmentModal
          isOpen={isPreModalOpen}
          onBegin={() => {
            getAssesmentQuestions();
          }}
          onClose={() => navigate("/")}
        />
        <AlreadyAssessmentModal
          isOpen={isAlreadyModalOpen}
          onClose={() => navigate("/")}
        />
        <AssesmentQuestionNotModal
          isOpen={isQuestionAvailable}
          onClose={() => navigate("/")}
        />
        {isLessonPDFWatch && (
          <PdfPopUp pdfUrl={firstQuestionWithPDF} onClose={closePdf} />
        )}
      </div>
    </div>
  );
};

export default NewAssessment;

// Types (local to this component)
interface ModuleScores {
  general: number;
  reading: number;
  listening: number;
}

interface CalculatedScores {
  assessment_generalScore: number;
  assessment_readingScore: number;
  assessment_listeningScore: number;
  assessment_writingScore: number;
  assessment_speakingScore: number;
  assessment_decisionMaking_generalScore?: number;
  assessment_businessEtiquette_generalScore?: number;
  assessment_communicationSkills_generalScore?: number;
}
