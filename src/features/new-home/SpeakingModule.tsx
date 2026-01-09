import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "@/store";
import openAIEvaluationService from "./services/OpenAIEvaluationService";
import evaluationAPIService from "./services/EvaluationAPIService";
import EvaluationLoading from "./components/EvaluationLoading";
import { API_BASE_URL } from "@/lib/constants";

const SpeakingModule = () => {
  const navigate = useNavigate();
  const {
    speakingEvaluation,
    setSpeakingEvaluation,
    speakingModule,
    setSpeakingModule,
    setEvaluationLoading,
    lessonId,
    moduleId,
  } = useStore();

  const [currentQuestion, setCurrentQuestion] = useState<{
    id: number;
    title: string;
    prompt: string;
    minTime: number;
    maxTime: number;
    timeLimit: number;
  } | null>(null);
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
  const timerRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const userId = Number(localStorage.getItem("USER_ID") || 0);

  useEffect(() => {
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
    initializeModule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentQuestion && !isSubmitted) {
      timerRef.current = window.setInterval(() => {
        setSpeakingModule((prev) => ({
          ...prev,
          timeSpent: (prev.timeSpent || 0) + 1,
        }));
      }, 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recordingTimerRef.current)
        window.clearInterval(recordingTimerRef.current);
    };
  }, [currentQuestion, isSubmitted, setSpeakingModule]);

  const getQuestionsApi = async () => {
    try {
      const dictParameter = JSON.stringify([
        {
          loginuserID: userId,
          languageID: "1",
          moduleID: moduleId,
          lessionID: lessonId,
          examID: "0",
          usertype: "Premium",
          apiType: "Android",
          apiVersion: "1.0",
        },
      ]);
      const url = `${API_BASE_URL}lesson/get-questions`;
      const response = await fetch(url, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
        body: "json=" + dictParameter,
      });
      const responseJson = await response.json();
      const arrData = responseJson;
      const status_ = responseJson?.[0]?.status;
      const msg = responseJson?.[0]?.message;
      if (status_ === "false") {
        throw new Error(msg || "Failed to fetch questions");
      }
      const questions = arrData?.[0]?.questions;
      if (questions && questions.length > 0) {
        const q = questions[0];
        setCurrentQuestion({
          id: Number(q.questionID || 1),
          title: String(q.questionTitle || q.queQuestion || "Speaking Task"),
          prompt: String(q.queQuestion || q.questionText || q.question || ""),
          minTime: 15,
          maxTime: 120,
          timeLimit: 1800,
        });
      } else {
        throw new Error("No questions available for this module");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to load speaking questions. Please try again.");
    }
  };

  const initializeModule = async () => {
    try {
      setIsLoading(true);
      // ask for mic permissions
      // @ts-expect-error browser API
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      stream.getTracks().forEach((t) => t.stop());
      await getQuestionsApi();
      setSpeakingModule((prev) => ({ ...prev, recordingTime: 0 }));
      setIsLoading(false);
    } catch (err) {
      console.error("Error initializing speaking module:", err);
      setError(
        "Microphone access is required for the speaking module. Please allow microphone permissions and try again.",
      );
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      // @ts-expect-error browser API
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
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
      recorder.ondataavailable = (e: BlobEvent) => {
        chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
        setSpeakingModule((prev) => ({
          ...prev,
          recordingTime: (prev.recordingTime || 0) + 1,
        }));
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current)
        window.clearInterval(recordingTimerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  const getRecordingTimeColor = () => {
    if (!currentQuestion) return "text-gray-500";
    const { minTime, maxTime } = currentQuestion;
    if (recordingTime < minTime) return "text-red-500";
    if (recordingTime > maxTime) return "text-orange-500";
    return "text-green-500";
  };

  const canSubmit = () => {
    if (!currentQuestion || !audioBlob) return false;
    const { minTime, maxTime } = currentQuestion;
    return recordingTime >= minTime && recordingTime <= maxTime;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !currentQuestion || !audioBlob) return;
    try {
      if (timerRef.current) window.clearInterval(timerRef.current);
      setIsSubmitted(true);
      setSpeakingModule((prev) => ({ ...prev, isSubmitted: true }));
      setEvaluationLoading({
        isVisible: true,
        message: "Transcribing your speech...",
        progress: 0,
        estimatedTime: 30,
      });
      const progressInterval = window.setInterval(() => {
        setEvaluationLoading((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 8, 90),
        }));
      }, 2000);

      let transcribedText;
      let evaluation;
      try {
        transcribedText =
          await openAIEvaluationService.transcribeAudio(audioBlob);
        setTranscription(transcribedText);
        setEvaluationLoading((prev) => ({
          ...prev,
          message: "Evaluating your speaking...",
          progress: 50,
        }));
        evaluation = await openAIEvaluationService.evaluateSpeaking(
          currentQuestion.prompt,
          transcribedText,
        );
      } finally {
        window.clearInterval(progressInterval);
      }
      setSpeakingEvaluation((prev) => ({
        ...prev,
        scores: evaluation.scores,
        feedback: evaluation.feedback,
        submission: {
          prompt: currentQuestion.prompt,
          audioBlob: audioBlob,
          transcription: transcribedText,
          lessonId,
          moduleId,
        },
      }));
      await evaluationAPIService.submitSpeakingEvaluation({
        userId,
        lessonId,
        moduleId,
        prompt: currentQuestion.prompt,
        audioUrl,
        transcription: transcribedText,
        score: evaluation.scores.overall,
        feedback: evaluation.feedback.detailed,
        evaluationDetails: evaluation,
      });
      await evaluationAPIService.updateLessonProgress({
        userId,
        lessonId,
        moduleId,
        moduleType: "speaking",
        score: evaluation.scores.overall,
      });
      setEvaluationLoading({
        isVisible: false,
        message: "",
        progress: 0,
        estimatedTime: 0,
      });
      navigate("/SpeakingResult");
    } catch (err) {
      console.error("Error submitting speaking evaluation:", err);
      setEvaluationLoading({
        isVisible: false,
        message: "",
        progress: 0,
        estimatedTime: 0,
      });
      setIsSubmitted(false);
      setSpeakingModule((prev) => ({ ...prev, isSubmitted: false }));
    }
  };

  const handleReset = () => {
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl("");
    setTranscription("");
    setIsSubmitted(false);
    setSpeakingModule((prev) => ({
      ...prev,
      recordingTime: 0,
      audioBlob: null,
      audioUrl: "",
      isSubmitted: false,
    }));
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setSpeakingModule((prev) => ({
        ...prev,
        timeSpent: (prev.timeSpent || 0) + 1,
      }));
    }, 1000);
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
          <p className="text-gray-600">Loading speaking module...</p>
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800"
                aria-label="Back"
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
                Speaking Module
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Time:{" "}
                <span className="font-mono font-semibold">
                  {formatTime(speakingModule.timeSpent || 0)}
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
                      • Duration: {formatTime(currentQuestion?.minTime || 0)} -{" "}
                      {formatTime(currentQuestion?.maxTime || 0)}
                    </li>
                    <li>
                      • Time limit:{" "}
                      {formatTime(currentQuestion?.timeLimit || 0)}
                    </li>
                    <li>• Clear pronunciation and professional tone</li>
                    <li>
                      • Structured response with introduction and conclusion
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Your Recording
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
              <div className="p-8">
                <div className="text-center">
                  <div className="mb-8">
                    {isRecording ? (
                      <div className="flex items-center justify-center space-x-2 text-red-500">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-semibold">Recording...</span>
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
                          Recording Complete
                        </span>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        Click the microphone to start recording
                      </div>
                    )}
                  </div>
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
                              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 011.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {!isRecording && !audioBlob && (
                      <p>
                        Click the microphone button to start recording your
                        response
                      </p>
                    )}
                    {isRecording && (
                      <p>
                        Speak clearly into your microphone. Click the stop
                        button when finished.
                      </p>
                    )}
                    {audioBlob && !isRecording && (
                      <p>Review your recording and submit when ready</p>
                    )}
                  </div>
                </div>
              </div>
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
                      {isSubmitted ? "Submitting..." : "Submit for Evaluation"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

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
                        width: `${Math.min(
                          (recordingTime / currentQuestion.maxTime) * 100,
                          100,
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Time Remaining
                    </span>
                    <span
                      className={`text-sm font-mono ${
                        (speakingModule.timeSpent || 0) >
                        (currentQuestion.timeLimit || 0)
                          ? "text-red-500"
                          : "text-gray-600"
                      }`}
                    >
                      {formatTime(
                        Math.max(
                          0,
                          (currentQuestion.timeLimit || 0) -
                            (speakingModule.timeSpent || 0),
                        ),
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (speakingModule.timeSpent || 0) >
                        (currentQuestion.timeLimit || 0)
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          ((speakingModule.timeSpent || 0) /
                            (currentQuestion.timeLimit || 1)) *
                            100,
                          100,
                        )}%`,
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

export default SpeakingModule;

