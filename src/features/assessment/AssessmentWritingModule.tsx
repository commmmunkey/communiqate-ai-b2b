import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useStore } from "@/store";
import openAIEvaluationService from "./OpenAIEvaluationService";
import EvaluationLoading from "./components/EvaluationLoading";

interface Question {
  id: number;
  title: string;
  prompt: string;
  minWords: number;
  maxWords: number;
  timeLimit: number;
}

interface CalculatedScores {
  assessment_generalScore?: number;
  assessment_readingScore?: number;
  assessment_listeningScore?: number;
  assessment_writingScore?: number;
  assessment_speakingScore?: number;
  assessment_decisionMaking_generalScore?: number;
  assessment_businessEtiquette_generalScore?: number;
  assessment_communicationSkills_generalScore?: number;
}

const AssessmentWritingModule = () => {
  const navigate = useNavigate();
  const {
    arrAssesmentQuestion,
    assessmentWritingEvaluation,
    setAssessmentWritingEvaluation,
    assessmentModule,
    setAssessmentModule,
    evaluationLoading,
    setEvaluationLoading,
  } = useStore();

  // Local state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userResponse, setUserResponse] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState(0);
  const [calculatedScores, setCalculatedScores] =
    useState<CalculatedScores | null>(null);

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const userId = localStorage.getItem("USER_ID") || "";

  useEffect(() => {
    // Set theme colors
    // const primaryColor = localStorage.getItem("corporate_primary_color") || '#0000ff';
    // const secondaryColor = localStorage.getItem("corporate_secondary_color") || '#f5914a';
    // const backgroundColor = localStorage.getItem("corporate_background_color") || '#fddaa7';
    // const accentColor = localStorage.getItem("corporate_accent_color") || '#e0d4bc';

    // document.documentElement.style.setProperty('--primary-color', primaryColor);
    // document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    // document.documentElement.style.setProperty('--background-color', backgroundColor);
    // document.documentElement.style.setProperty('--accent-color', accentColor);

    // Load calculated scores from localStorage
    const storedScores = localStorage.getItem("ASSESSMENT_FINAL_SCORES");
    if (storedScores) {
      try {
        const scores = JSON.parse(storedScores) as CalculatedScores;
        setCalculatedScores(scores);
        // console.log("Loaded calculated scores in writing module:", scores);
      } catch (error) {
        console.error("Error parsing stored scores:", error);
      }
    }

    // Initialize the module
    initializeModule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wait for assessment questions to load
  useEffect(() => {
    if (
      arrAssesmentQuestion &&
      Array.isArray(arrAssesmentQuestion) &&
      arrAssesmentQuestion.length > 0 &&
      !currentQuestion
    ) {
      // console.log("Assessment questions loaded, reinitializing module");
      initializeModule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrAssesmentQuestion]);

  useEffect(() => {
    // Start timer when component mounts
    if (currentQuestion && !isSubmitted) {
      startTimer();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestion, isSubmitted]);

  const initializeModule = async () => {
    try {
      setIsLoading(true);

      // Check if arrAssesmentQuestion is available and is an array
      if (!arrAssesmentQuestion || !Array.isArray(arrAssesmentQuestion)) {
        // console.log("Assessment questions not loaded yet, creating default question");
        // Create a default assessment writing question
        const defaultQuestion = {
          queID: 1,
          queQuestion:
            "Please write a professional business email responding to a customer inquiry about a product or service. Your response should be clear, professional, and demonstrate excellent business communication skills.",
          assessmentID: 1,
          moduleID: 9,
        };

        setCurrentQuestion({
          id: defaultQuestion.queID,
          title: "Assessment Writing Task",
          prompt: defaultQuestion.queQuestion,
          minWords: 100,
          maxWords: 500,
          timeLimit: 1800,
        });

        setAssessmentId(defaultQuestion.assessmentID);

        setAssessmentModule({
          ...assessmentModule,
          currentQuestion: defaultQuestion,
          assessmentId: defaultQuestion.assessmentID,
          currentSection: "writing",
          timeSpent: 0,
        });

        setIsLoading(false);
        return;
      }

      // Wait a bit for questions to load if they're not available yet
      let writingQuestions = arrAssesmentQuestion.filter(
        (q: any) => q.moduleID === 9,
      );

      // If no questions found, try alternative module IDs or create a default question
      if (writingQuestions.length === 0) {
        // Try alternative module IDs
        writingQuestions = arrAssesmentQuestion.filter(
          (q: any) =>
            q.moduleID === 9 ||
            q.moduleID === "9" ||
            q.moduleId === 9 ||
            q.moduleId === "9",
        );

        // If still no questions, create a default assessment writing question
        if (writingQuestions.length === 0) {
          // console.log("No writing questions found, creating default assessment question");
          writingQuestions = [
            {
              queID: 1,
              queQuestion:
                "Please write a professional business email responding to a customer inquiry about a product or service. Your response should be clear, professional, and demonstrate excellent business communication skills.",
              assessmentID: 1,
              moduleID: 9,
            },
          ];
        }
      }

      // Use the first writing question
      const question = writingQuestions[0];
      // console.log("Assessment writing question:", question);

      setCurrentQuestion({
        id: question.queID || question.questionID || 1,
        title:
          question.questionTitle ||
          question.queQuestion ||
          "Assessment Writing Task",
        prompt:
          question.queQuestion || question.questionText || question.question,
        minWords: 100,
        maxWords: 500,
        timeLimit: 1800,
      });

      // Set assessment ID
      setAssessmentId(question.assessmentID || 1);

      // Update module state
      setAssessmentModule({
        ...assessmentModule,
        currentQuestion: question,
        assessmentId: question.assessmentID || 1,
        currentSection: "writing",
        timeSpent: 0,
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing assessment writing module:", error);
      setError(
        "Failed to initialize assessment writing module. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
      setAssessmentModule({
        ...assessmentModule,
        timeSpent: assessmentModule.timeSpent + 1,
      });
    }, 1000);
  };

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setUserResponse(text);

    // Calculate word and character count
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    const characters = text.length;

    setWordCount(words);
    setCharacterCount(characters);

    // Update module state
    setAssessmentModule({
      ...assessmentModule,
      userResponse: text,
      wordCount: words,
      characterCount: characters,
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getWordCountColor = (): string => {
    if (!currentQuestion) return "text-gray-500";

    const { minWords, maxWords } = currentQuestion;
    if (wordCount < minWords) return "text-red-500";
    if (wordCount > maxWords) return "text-orange-500";
    return "text-green-500";
  };

  const canSubmit = (): boolean => {
    if (!currentQuestion) return false;

    const { minWords, maxWords, timeLimit } = currentQuestion;
    return (
      wordCount >= minWords && wordCount <= maxWords && timeSpent <= timeLimit
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !currentQuestion) {
      return;
    }

    try {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setIsSubmitted(true);
      setAssessmentModule({
        ...assessmentModule,
        isSubmitted: true,
      });

      // Show evaluation loading
      setEvaluationLoading({
        isVisible: true,
        message: "Evaluating your assessment writing...",
        progress: 0,
        estimatedTime: 25,
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setEvaluationLoading((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 2000);

      // Perform AI evaluation
      let evaluation;
      try {
        // Validate inputs before making API call
        if (!userResponse || userResponse.trim() === "") {
          throw new Error("Writing response cannot be empty");
        }
        if (!currentQuestion.prompt || currentQuestion.prompt.trim() === "") {
          throw new Error("Writing prompt cannot be empty");
        }

        evaluation = await openAIEvaluationService.evaluateWriting(
          currentQuestion.prompt,
          userResponse,
        );
        
        // Validate evaluation result
        if (!evaluation || !evaluation.scores || !evaluation.feedback) {
          throw new Error("Invalid evaluation result received");
        }
      } catch (error) {
        console.error("Error evaluating writing:", error);
        throw new Error(
          `Failed to evaluate writing: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Clear progress interval
      clearInterval(progressInterval);

      // Update evaluation state
      setAssessmentWritingEvaluation({
        ...assessmentWritingEvaluation,
        scores: evaluation.scores,
        feedback: evaluation.feedback,
        submission: {
          prompt: currentQuestion.prompt,
          response: userResponse,
          assessmentId: assessmentId,
          questionId: currentQuestion.id,
          moduleId: 9,
        },
      });

      // Store writing evaluation results locally for final submission
      localStorage.setItem(
        "ASSESSMENT_WRITING_EVALUATION",
        JSON.stringify({
          scores: evaluation.scores,
          feedback: evaluation.feedback,
          submission: {
            prompt: currentQuestion.prompt,
            response: userResponse,
            assessmentId: assessmentId,
            questionId: currentQuestion.id,
            moduleId: 9,
          },
        }),
      );

      // Store the actual writing text content for AI interview upload
      localStorage.setItem("ASSESSMENT_WRITING_TEXT_CONTENT", userResponse);
      // console.log("Writing text content stored for AI interview:", userResponse);

      // Hide loading and show completion
      setEvaluationLoading({
        isVisible: false,
        message: "",
        progress: 0,
        estimatedTime: 0,
      });

      // Navigate to results
      navigate("/assessment/writing-result");
    } catch (error) {
      console.error("Error submitting assessment writing evaluation:", error);

      // Hide loading
      setEvaluationLoading({
        isVisible: false,
        message: "",
        progress: 0,
        estimatedTime: 0,
      });

      setIsSubmitted(false);
      setAssessmentModule({
        ...assessmentModule,
        isSubmitted: false,
      });
    }
  };

  const handleReset = () => {
    setUserResponse("");
    setWordCount(0);
    setCharacterCount(0);
    setTimeSpent(0);
    setIsSubmitted(false);
    setAssessmentModule({
      ...assessmentModule,
      userResponse: "",
      wordCount: 0,
      characterCount: 0,
      timeSpent: 0,
      isSubmitted: false,
    });

    // Restart timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    startTimer();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment writing module...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EvaluationLoading />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">
                Assessment Writing Module
              </h1>
            </div>

            {/* Timer */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Time:{" "}
                <span className="font-mono font-semibold">
                  {formatTime(timeSpent)}
                </span>
              </div>
              {currentQuestion && (
                <div className="text-sm text-gray-600">
                  Limit:{" "}
                  <span className="font-mono">
                    {formatTime(currentQuestion.timeLimit)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Writing Prompt */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {currentQuestion?.title}
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Writing Task:
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {currentQuestion?.prompt}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Requirements:
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      • Word count: {currentQuestion?.minWords} -{" "}
                      {currentQuestion?.maxWords} words
                    </li>
                    <li>
                      • Time limit:{" "}
                      {formatTime(currentQuestion?.timeLimit || 0)}
                    </li>
                    <li>• Professional business writing style</li>
                    <li>• Clear structure and organization</li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Assessment Tips:
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      • This is an assessment - focus on demonstrating your
                      skills
                    </li>
                    <li>• Use professional language and tone</li>
                    <li>• Structure your response logically</li>
                    <li>• End with a clear conclusion or call to action</li>
                  </ul>
                </div>

                {/* Calculated Scores Display */}
                {/* {calculatedScores && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Previous Module Scores:
                    </h3>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-medium text-blue-700">General</div>
                        <div className="text-lg font-bold text-blue-800">
                          {calculatedScores.assessment_generalScore || 0}/10
                        </div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-medium text-green-700">
                          Reading
                        </div>
                        <div className="text-lg font-bold text-green-800">
                          {calculatedScores.assessment_readingScore || 0}/10
                        </div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="font-medium text-purple-700">
                          Listening
                        </div>
                        <div className="text-lg font-bold text-purple-800">
                          {calculatedScores.assessment_listeningScore || 0}/10
                        </div>
                      </div>
                    </div>

                    {calculatedScores.assessment_generalScore &&
                      calculatedScores.assessment_generalScore > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="text-xs font-medium text-gray-700 mb-2">
                            General Categories:
                          </h4>
                          <div className="grid grid-cols-3 gap-1 text-xs">
                            <div className="text-center p-1 bg-blue-100 rounded">
                              <div className="font-medium text-blue-700">
                                Decision
                              </div>
                              <div className="text-sm font-bold text-blue-800">
                                {calculatedScores.assessment_decisionMaking_generalScore ||
                                  0}
                                /10
                              </div>
                            </div>
                            <div className="text-center p-1 bg-blue-100 rounded">
                              <div className="font-medium text-blue-700">
                                Etiquette
                              </div>
                              <div className="text-sm font-bold text-blue-800">
                                {calculatedScores.assessment_businessEtiquette_generalScore ||
                                  0}
                                /10
                              </div>
                            </div>
                            <div className="text-center p-1 bg-blue-100 rounded">
                              <div className="font-medium text-blue-700">
                                Communication
                              </div>
                              <div className="text-sm font-bold text-blue-800">
                                {calculatedScores.assessment_communicationSkills_generalScore ||
                                  0}
                                /10
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                )} */}
              </div>
            </div>
          </div>

          {/* Writing Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Editor Header */}
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Your Assessment Response
                  </h3>

                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`font-mono ${getWordCountColor()}`}>
                      {wordCount} words
                    </span>
                    <span className="text-gray-500 font-mono">
                      {characterCount} characters
                    </span>
                  </div>
                </div>
              </div>

              {/* Text Editor */}
              <div className="p-6">
                <textarea
                  value={userResponse}
                  onChange={handleResponseChange}
                  placeholder="Start writing your assessment response here..."
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  disabled={isSubmitted}
                />
              </div>

              {/* Editor Footer */}
              <div className="border-t px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {currentQuestion && (
                      <div className="text-sm text-gray-600">
                        Target: {currentQuestion.minWords}-
                        {currentQuestion.maxWords} words
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleReset}
                      disabled={isSubmitted}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset
                    </button>

                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit() || isSubmitted}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitted ? "Submitting..." : "Submit for Assessment"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Indicators */}
            {currentQuestion && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Word Count
                    </span>
                    <span
                      className={`text-sm font-mono ${getWordCountColor()}`}
                    >
                      {wordCount} / {currentQuestion.maxWords}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        wordCount < currentQuestion.minWords
                          ? "bg-red-500"
                          : wordCount > currentQuestion.maxWords
                            ? "bg-orange-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min((wordCount / currentQuestion.maxWords) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Time Remaining
                    </span>
                    <span
                      className={`text-sm font-mono ${
                        timeSpent > currentQuestion.timeLimit
                          ? "text-red-500"
                          : "text-gray-600"
                      }`}
                    >
                      {formatTime(
                        Math.max(0, currentQuestion.timeLimit - timeSpent),
                      )}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        timeSpent > currentQuestion.timeLimit
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${Math.min((timeSpent / currentQuestion.timeLimit) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentWritingModule;
