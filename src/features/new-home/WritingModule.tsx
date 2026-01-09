import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "@/store";
import openAIEvaluationService from "./services/OpenAIEvaluationService";
import evaluationAPIService from "./services/EvaluationAPIService";
import EvaluationLoading from "./components/EvaluationLoading";
import { API_BASE_URL } from "@/lib/constants";

const WritingModule = () => {
  const navigate = useNavigate();
  const {
    writingEvaluation,
    setWritingEvaluation,
    writingModule,
    setWritingModule,
    setEvaluationLoading,
    lessonId,
    moduleId,
  } = useStore();

  const [currentQuestion, setCurrentQuestion] = useState<{
    id: number;
    title: string;
    prompt: string;
    minWords: number;
    maxWords: number;
    timeLimit: number;
  } | null>(null);
  const [userResponse, setUserResponse] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const userId = Number(localStorage.getItem("USER_ID") || 0);

  useEffect(() => {
    // const primaryColor =
    //   localStorage.getItem("corporate_primary_color") || "#0000ff";
    // const secondaryColor =
    //   localStorage.getItem("corporate_secondary_color") || "#f5914a";
    // const backgroundColor =
    //   localStorage.getItem("corporate_background_color") || "#fddaa7";
    // const accentColor =
    //   localStorage.getItem("corporate_accent_color") || "#e0d4bc";
    // document.documentElement.style.setProperty("--primary-color", primaryColor);
    // document.documentElement.style.setProperty(
    //   "--secondary-color",
    //   secondaryColor
    // );
    // document.documentElement.style.setProperty(
    //   "--background-color",
    //   backgroundColor
    // );
    // document.documentElement.style.setProperty("--accent-color", accentColor);
    initializeModule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentQuestion && !isSubmitted) {
      timerRef.current = window.setInterval(() => {
        setTimeSpent((t) => t + 1);
        setWritingModule((prev) => ({
          ...prev,
          timeSpent: (prev.timeSpent || 0) + 1,
        }));
      }, 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [currentQuestion, isSubmitted, setWritingModule]);

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
          title: String(q.questionTitle || q.queQuestion || "Writing Task"),
          prompt: String(q.queQuestion || q.questionText || q.question || ""),
          minWords: 100,
          maxWords: 500,
          timeLimit: 1800,
        });
      } else {
        throw new Error("No questions available for this module");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to load writing questions. Please try again.");
    }
  };

  const initializeModule = async () => {
    try {
      setIsLoading(true);
      await getQuestionsApi();
      setWritingModule((prev) => ({ ...prev, timeSpent: 0 }));
      setIsLoading(false);
    } catch (err) {
      console.error("Error initializing writing module:", err);
      setError("Failed to initialize writing module");
      setIsLoading(false);
    }
  };

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setUserResponse(text);
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    const characters = text.length;
    setWordCount(words);
    setCharacterCount(characters);
    setWritingModule((prev) => ({
      ...prev,
      userResponse: text,
      wordCount: words,
      characterCount: characters,
    }));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  const getWordCountColor = () => {
    if (!currentQuestion) return "text-gray-500";
    const { minWords, maxWords } = currentQuestion;
    if (wordCount < minWords) return "text-red-500";
    if (wordCount > maxWords) return "text-orange-500";
    return "text-green-500";
  };

  const canSubmit = () => {
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
      if (timerRef.current) window.clearInterval(timerRef.current);
      setIsSubmitted(true);
      setWritingModule((prev) => ({ ...prev, isSubmitted: true }));
      setEvaluationLoading({
        isVisible: true,
        message: "Evaluating your writing...",
        progress: 0,
        estimatedTime: 25,
      });
      const progressInterval = window.setInterval(() => {
        setEvaluationLoading((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 2000);

      let evaluation;
      try {
        evaluation = await openAIEvaluationService.evaluateWriting(
          currentQuestion.prompt,
          userResponse,
        );
      } finally {
        window.clearInterval(progressInterval);
      }
      setWritingEvaluation((prev) => ({
        ...prev,
        scores: evaluation.scores,
        feedback: evaluation.feedback,
        submission: {
          prompt: currentQuestion.prompt,
          response: userResponse,
          lessonId,
          moduleId,
        },
      }));
      await evaluationAPIService.submitWritingEvaluation({
        userId,
        lessonId,
        moduleId,
        prompt: currentQuestion.prompt,
        response: userResponse,
        score: evaluation.scores.overall,
        feedback: evaluation.feedback.detailed,
        evaluationDetails: evaluation,
      });
      await evaluationAPIService.updateLessonProgress({
        userId,
        lessonId,
        moduleId,
        moduleType: "writing",
        score: evaluation.scores.overall,
      });
      setEvaluationLoading({
        isVisible: false,
        message: "",
        progress: 0,
        estimatedTime: 0,
      });
      navigate("/WritingResult");
    } catch (err) {
      console.error("Error submitting writing evaluation:", err);
      setEvaluationLoading({
        isVisible: false,
        message: "",
        progress: 0,
        estimatedTime: 0,
      });
      setIsSubmitted(false);
      setWritingModule((prev) => ({ ...prev, isSubmitted: false }));
    }
  };

  const handleReset = () => {
    setUserResponse("");
    setWordCount(0);
    setCharacterCount(0);
    setTimeSpent(0);
    setIsSubmitted(false);
    setWritingModule((prev) => ({
      ...prev,
      userResponse: "",
      wordCount: 0,
      characterCount: 0,
      timeSpent: 0,
      isSubmitted: false,
    }));
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeSpent((t) => t + 1);
      setWritingModule((prev) => ({
        ...prev,
        timeSpent: (prev.timeSpent || 0) + 1,
      }));
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading writing module...</p>
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
                Writing Module
              </h1>
            </div>
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
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Your Response
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
              <div className="p-6">
                <textarea
                  value={userResponse}
                  onChange={handleResponseChange}
                  placeholder="Start writing your response here..."
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  disabled={isSubmitted}
                />
              </div>
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
                        width: `${Math.min(
                          (wordCount / currentQuestion.maxWords) * 100,
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
                        width: `${Math.min(
                          (timeSpent / currentQuestion.timeLimit) * 100,
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

export default WritingModule;

