import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useStore } from "@/store";
import openAIEvaluationService from "./OpenAIEvaluationService";
import EvaluationLoading from "./components/EvaluationLoading";
import { environment } from "./environment";

interface EvaluationLoadingState {
  isVisible: boolean;
  message: string;
  progress: number;
  estimatedTime: number;
}

interface Question {
  id: number;
  title: string;
  prompt: string;
  minTime: number;
  maxTime: number;
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

const AssessmentSpeakingModule = () => {
  const navigate = useNavigate();
  const {
    arrAssesmentQuestion,
    assessmentSpeakingEvaluation,
    setAssessmentSpeakingEvaluation,
    assessmentSpeakingModule,
    setAssessmentSpeakingModule,
    evaluationLoading,
    setEvaluationLoading,
  } = useStore();

  // Local state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [transcription, setTranscription] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [assessmentId, setAssessmentId] = useState(0);
  const [calculatedScores, setCalculatedScores] =
    useState<CalculatedScores | null>(null);

  // Timer refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userId = localStorage.getItem("USER_ID") || "";

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

    // Load calculated scores from localStorage
    const storedScores = localStorage.getItem("ASSESSMENT_FINAL_SCORES");
    if (storedScores) {
      try {
        const scores = JSON.parse(storedScores) as CalculatedScores;
        setCalculatedScores(scores);
        // console.log("Loaded calculated scores in speaking module:", scores);
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
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [currentQuestion, isSubmitted]);

  const initializeModule = async () => {
    try {
      setIsLoading(true);

      // Check for microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop()); // Stop the test stream

      // Check if arrAssesmentQuestion is available and is an array
      if (!arrAssesmentQuestion || !Array.isArray(arrAssesmentQuestion)) {
        // console.log("Assessment questions not loaded yet, creating default question");
        // Create a default assessment speaking question
        const defaultQuestion = {
          queID: 1,
          queQuestion:
            "Please give a 2-minute presentation introducing yourself in a professional business context. Include your background, skills, and what you can contribute to a team.",
          assessmentID: 1,
          moduleID: 13,
        };

        setCurrentQuestion({
          id: defaultQuestion.queID,
          title: "Assessment Speaking Task",
          prompt: defaultQuestion.queQuestion,
          minTime: 15,
          maxTime: 120,
          timeLimit: 1800,
        });

        setAssessmentId(defaultQuestion.assessmentID);

        setAssessmentSpeakingModule({
          ...assessmentSpeakingModule,
          currentQuestion: defaultQuestion,
          assessmentId: defaultQuestion.assessmentID,
          currentSection: "speaking",
          timeSpent: 0,
        });

        setIsLoading(false);
        return;
      }

      // Wait a bit for questions to load if they're not available yet
      let speakingQuestions = arrAssesmentQuestion.filter(
        (q: any) => q.moduleID === 13,
      );

      // If no questions found, try alternative module IDs or create a default question
      if (speakingQuestions.length === 0) {
        // Try alternative module IDs
        speakingQuestions = arrAssesmentQuestion.filter(
          (q: any) =>
            q.moduleID === 13 ||
            q.moduleID === "13" ||
            q.moduleId === 13 ||
            q.moduleId === "13",
        );

        // If still no questions, create a default assessment speaking question
        if (speakingQuestions.length === 0) {
          // console.log("No speaking questions found, creating default assessment question");
          speakingQuestions = [
            {
              queID: 1,
              queQuestion:
                "Please give a 2-minute presentation introducing yourself in a professional business context. Include your background, skills, and what you can contribute to a team.",
              assessmentID: 1,
              moduleID: 13,
            },
          ];
        }
      }

      // Use the first speaking question
      const question = speakingQuestions[0];
      // console.log("Assessment speaking question:", question);

      setCurrentQuestion({
        id: question.queID || question.questionID || 1,
        title:
          question.questionTitle ||
          question.queQuestion ||
          "Assessment Speaking Task",
        prompt:
          question.queQuestion || question.questionText || question.question,
        minTime: 15,
        maxTime: 120,
        timeLimit: 1800,
      });

      // Set assessment ID
      setAssessmentId(question.assessmentID || 1);

      // Update module state
      setAssessmentSpeakingModule({
        ...assessmentSpeakingModule,
        currentQuestion: question,
        assessmentId: question.assessmentID || 1,
        currentSection: "speaking",
        timeSpent: 0,
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing assessment speaking module:", error);
      setError(
        "Microphone access is required for the assessment speaking module. Please allow microphone permissions and try again.",
      );
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setAssessmentSpeakingModule({
        ...assessmentSpeakingModule,
        timeSpent: assessmentSpeakingModule.timeSpent + 1,
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setAudioChunks(chunks);
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
        setAssessmentSpeakingModule({
          ...assessmentSpeakingModule,
          timeSpent: assessmentSpeakingModule.timeSpent + 1,
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getRecordingTimeColor = (): string => {
    if (!currentQuestion) return "text-gray-500";

    const { minTime, maxTime } = currentQuestion;
    if (recordingTime < minTime) return "text-red-500";
    if (recordingTime > maxTime) return "text-orange-500";
    return "text-green-500";
  };

  const canSubmit = (): boolean => {
    if (!currentQuestion || !audioBlob) return false;

    const { minTime, maxTime } = currentQuestion;
    return recordingTime >= minTime && recordingTime <= maxTime;
  };

  const uploadSpeakingAudioToServer = async (
    audioBlob: Blob,
  ): Promise<string> => {
    try {
      const timestamp = Date.now();
      const fileName = `assessment_speaking_${userId}_${timestamp}.mp3`;

      // Create FormData for file upload
      const formData = new FormData();

      // Create JSON data
      const jsonData = [
        {
          templateConstantCode: "000018",
          apiType: "Android",
          apiVersion: "1.0",
          subpath: "assessment",
        },
      ];

      // Append JSON string
      formData.append("json", JSON.stringify(jsonData));

      // Create file object
      const audioFile = new File([audioBlob], fileName);
      formData.append("audioFile", audioFile);

      // Create empty video file to satisfy API requirement
      const emptyVideoBlob = new Blob([], { type: "video/mp4" });
      const videoFile = new File(
        [emptyVideoBlob],
        `empty_video_${userId}_${timestamp}.mp4`,
      );
      formData.append("videoFile", videoFile);

      // Create empty text file to satisfy API requirement
      const emptyTextBlob = new Blob([""], { type: "text/plain" });
      const textFile = new File(
        [emptyTextBlob],
        `empty_text_${userId}_${timestamp}.txt`,
      );
      formData.append("textFile", textFile);

      // Use environment-based URL for API call
      const apiUrl = environment.production
        ? environment.apiBaseUrl + "users/upload-multiple-media"
        : "/api/users/upload-multiple-media";

      // Send upload request
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      // console.log("Speaking audio upload result:", JSON.stringify(result));

      // Extract the first result from the array
      const uploadResult = result[0];

      if (!uploadResult || uploadResult.status !== "true") {
        throw new Error(uploadResult?.message || "Upload failed");
      }

      // Return server URL with base URL prepended
      const BASE_URL =
        "https://stage.englishmonkapp.com/englishmonk-staging/backend/web/";
      return BASE_URL + uploadResult.audiofilepath;
    } catch (error) {
      console.error("Error uploading speaking audio to server:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !currentQuestion || !audioBlob) {
      return;
    }

    try {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setIsSubmitted(true);
      setAssessmentSpeakingModule({
        ...assessmentSpeakingModule,
        isSubmitted: true,
      });

      // Show evaluation loading
      setEvaluationLoading({
        isVisible: true,
        message: "Transcribing your assessment speech...",
        progress: 0,
        estimatedTime: 30,
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setEvaluationLoading((prev: EvaluationLoadingState) => ({
          ...prev,
          progress: Math.min(prev.progress + 8, 90),
        }));
      }, 2000);

      // Transcribe audio
      let transcribedText = "";
      try {
        transcribedText =
          await openAIEvaluationService.transcribeAudio(audioBlob);

        if (!transcribedText || transcribedText.trim() === "") {
          throw new Error("Transcription is empty");
        }

        setTranscription(transcribedText);
      } catch (error) {
        console.error("Error transcribing audio:", error);
        throw new Error(
          `Failed to transcribe audio: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }

      // Update loading message
      setEvaluationLoading({
        ...evaluationLoading,
        message: "Evaluating your assessment speaking...",
        progress: 50,
      });

      // Perform AI evaluation
      let evaluation: {
        scores: { overall: number; [key: string]: number };
        feedback: { detailed: string };
        rawEvaluation: string;
      } | null = null;
      try {
        const evalResult = await openAIEvaluationService.evaluateSpeaking(
          currentQuestion.prompt,
          transcribedText,
        );

        // Validate evaluation result
        if (!evalResult || !evalResult.scores || !evalResult.feedback) {
          throw new Error("Invalid evaluation result received");
        }

        evaluation = evalResult;
      } catch (error) {
        console.error("Error evaluating speaking:", error);
        throw new Error(
          `Failed to evaluate speaking: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }

      // Clear progress interval
      clearInterval(progressInterval);

      // Update evaluation state
      setAssessmentSpeakingEvaluation({
        ...assessmentSpeakingEvaluation,
        scores: evaluation.scores,
        feedback: evaluation.feedback,
        submission: {
          prompt: currentQuestion.prompt,
          audioBlob: audioBlob,
          transcription: transcribedText,
          assessmentId: assessmentId,
          questionId: currentQuestion.id,
          moduleId: 13,
        },
      });

      // Store speaking evaluation results locally for final submission
      // Convert audioBlob to base64 for localStorage storage
      let audioBlobBase64 = null;
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer)),
        );
        audioBlobBase64 = base64;
      } catch (error) {
        console.error("Error converting audioBlob to base64:", error);
      }

      localStorage.setItem(
        "ASSESSMENT_SPEAKING_EVALUATION",
        JSON.stringify({
          scores: evaluation.scores,
          feedback: evaluation.feedback,
          submission: {
            prompt: currentQuestion.prompt,
            audioBlob: audioBlobBase64,
            audioBlobType: audioBlob?.type || "audio/webm",
            transcription: transcribedText,
            assessmentId: assessmentId,
            questionId: currentQuestion.id,
            moduleId: 13,
          },
        }),
      );

      // Store the speaking audio URL for AI interview upload
      if (audioUrl) {
        localStorage.setItem("ASSESSMENT_SPEAKING_AUDIO_URL", audioUrl);
        // console.log("Speaking audio URL stored for AI interview:", audioUrl);
      }

      // Upload speaking audio file to server and get server URL
      let serverAudioUrl = "";
      try {
        serverAudioUrl = await uploadSpeakingAudioToServer(audioBlob);
        localStorage.setItem("ASSESSMENT_SPEAKING_SERVER_URL", serverAudioUrl);
        // console.log("Speaking audio uploaded to server:", serverAudioUrl);
      } catch (error) {
        console.error("Error uploading speaking audio to server:", error);
      }

      // Hide loading and show completion
      setEvaluationLoading({
        isVisible: false,
        message: "",
        progress: 0,
        estimatedTime: 0,
      });

      // Navigate to results
      navigate("/assessment/speaking-result");
    } catch (error) {
      console.error("Error submitting assessment speaking evaluation:", error);

      // Hide loading
      setEvaluationLoading({
        isVisible: false,
        message: "",
        progress: 0,
        estimatedTime: 0,
      });

      setIsSubmitted(false);
      setAssessmentSpeakingModule({
        ...assessmentSpeakingModule,
        isSubmitted: false,
      });
    }
  };

  const handleReset = () => {
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl("");
    setTranscription("");
    setIsSubmitted(false);
    setAssessmentSpeakingModule({
      ...assessmentSpeakingModule,
      timeSpent: 0,
      isSubmitted: false,
    });

    // Restart timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    startTimer();
  };

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment speaking module...</p>
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
                Assessment Speaking Module
              </h1>
            </div>

            {/* Timer */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Time:{" "}
                <span className="font-mono font-semibold">
                  {formatTime(assessmentSpeakingModule.timeSpent || 0)}
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
          {/* Speaking Prompt */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {currentQuestion?.title}
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Speaking Task:
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
                      • Duration:{" "}
                      {currentQuestion
                        ? formatTime(currentQuestion.minTime)
                        : "0:00"}{" "}
                      -{" "}
                      {currentQuestion
                        ? formatTime(currentQuestion.maxTime)
                        : "0:00"}
                    </li>
                    <li>
                      • Time limit:{" "}
                      {currentQuestion
                        ? formatTime(currentQuestion.timeLimit)
                        : "0:00"}
                    </li>
                    <li>• Clear pronunciation and professional tone</li>
                    <li>
                      • Structured response with introduction and conclusion
                    </li>
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
                    <li>• Speak clearly and at a moderate pace</li>
                    <li>• Use professional language and tone</li>
                    <li>• Structure your response logically</li>
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

          {/* Recording Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Recording Header */}
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Your Assessment Recording
                  </h3>

                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`font-mono ${getRecordingTimeColor()}`}>
                      {formatTime(recordingTime)}
                    </span>
                    {currentQuestion && (
                      <span className="text-gray-500">
                        / {formatTime(currentQuestion.maxTime)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recording Controls */}
              <div className="p-8">
                <div className="text-center">
                  {/* Recording Status */}
                  <div className="mb-8">
                    {isRecording ? (
                      <div className="flex items-center justify-center space-x-2 text-red-500">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-semibold">
                          Recording Assessment...
                        </span>
                      </div>
                    ) : audioBlob ? (
                      <div className="flex items-center justify-center space-x-2 text-green-500">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-semibold">
                          Assessment Recording Complete
                        </span>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        Click the microphone to start your assessment recording
                      </div>
                    )}
                  </div>

                  {/* Recording Button */}
                  <div className="mb-8">
                    {!isRecording && !audioBlob ? (
                      <button
                        onClick={startRecording}
                        disabled={isSubmitted}
                        className="w-24 h-24 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    ) : isRecording ? (
                      <button
                        onClick={stopRecording}
                        className="w-24 h-24 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-2 0v6a1 1 0 102 0V7zm4 0a1 1 0 00-2 0v6a1 1 0 102 0V7z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={playRecording}
                          className="w-16 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={handleReset}
                          disabled={isSubmitted}
                          className="w-16 h-16 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recording Instructions */}
                  <div className="text-sm text-gray-600">
                    {!isRecording && !audioBlob && (
                      <p>
                        Click the microphone button to start your assessment
                        recording
                      </p>
                    )}
                    {isRecording && (
                      <p>
                        Speak clearly into your microphone for the assessment.
                        Click the stop button when finished.
                      </p>
                    )}
                    {audioBlob && !isRecording && (
                      <p>
                        Review your assessment recording and submit when ready
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recording Footer */}
              <div className="border-t px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {currentQuestion && (
                      <div className="text-sm text-gray-600">
                        Target: {formatTime(currentQuestion.minTime)}-
                        {formatTime(currentQuestion.maxTime)}
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
                      Recording Duration
                    </span>
                    <span
                      className={`text-sm font-mono ${getRecordingTimeColor()}`}
                    >
                      {formatTime(recordingTime)} /{" "}
                      {formatTime(currentQuestion.maxTime)}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        recordingTime < currentQuestion.minTime
                          ? "bg-red-500"
                          : recordingTime > currentQuestion.maxTime
                            ? "bg-orange-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min((recordingTime / currentQuestion.maxTime) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Time Remaining
                    </span>
                    <span
                      className={`text-sm font-mono ${
                        (assessmentSpeakingModule.timeSpent || 0) >
                        currentQuestion.timeLimit
                          ? "text-red-500"
                          : "text-gray-600"
                      }`}
                    >
                      {formatTime(
                        Math.max(
                          0,
                          currentQuestion.timeLimit -
                            (assessmentSpeakingModule.timeSpent || 0),
                        ),
                      )}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (assessmentSpeakingModule.timeSpent || 0) >
                        currentQuestion.timeLimit
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${Math.min(((assessmentSpeakingModule.timeSpent || 0) / currentQuestion.timeLimit) * 100, 100)}%`,
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

export default AssessmentSpeakingModule;
