import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "@/store";

const SpeakingResult = () => {
  const navigate = useNavigate();
  const { speakingEvaluation } = useStore();
  const [isLoading, setIsLoading] = useState(true);

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
      secondaryColor
    );
    document.documentElement.style.setProperty(
      "--background-color",
      backgroundColor
    );
    document.documentElement.style.setProperty("--accent-color", accentColor);
    if (!speakingEvaluation.scores) {
      navigate("/NewHome");
      return;
    }
    setIsLoading(false);
  }, [speakingEvaluation, navigate]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };
  const getScoreBackground = (score: number) => {
    if (score >= 8) return "bg-green-100";
    if (score >= 6) return "bg-yellow-100";
    return "bg-red-100";
  };
  const getOverallGrade = (score: number) => {
    if (score >= 9) return "A+";
    if (score >= 8) return "A";
    if (score >= 7) return "B+";
    if (score >= 6) return "B";
    if (score >= 5) return "C+";
    if (score >= 4) return "C";
    return "D";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const { scores, feedback, submission } = speakingEvaluation as any;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/NewHome")}
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
                Speaking Assessment Results
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/SpeakingModule")}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Overall Performance
              </h2>
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <svg className="w-32 h-32" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={
                        scores.overall >= 8
                          ? "#10b981"
                          : scores.overall >= 6
                          ? "#f59e0b"
                          : "#ef4444"
                      }
                      strokeWidth="8"
                      strokeDasharray={`${(scores.overall / 10) * 314} 314`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold ${getScoreColor(
                          scores.overall
                        )}`}
                      >
                        {Number(scores.overall).toFixed(1)}
                      </div>
                      <div
                        className={`text-sm font-medium ${getScoreColor(
                          scores.overall
                        )}`}
                      >
                        {getOverallGrade(scores.overall)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Score Breakdown
                </h3>
                {[
                  ["Pronunciation & Clarity", scores.pronunciation],
                  ["Fluency & Pace", scores.fluency],
                  ["Grammar & Vocabulary", scores.grammar],
                  ["Content Organization", scores.content],
                ].map(([label, val]) => (
                  <div key={String(label)}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {label}
                      </span>
                      <span
                        className={`text-sm font-semibold ${getScoreColor(
                          Number(val)
                        )}`}
                      >
                        {Number(val).toFixed(1)}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getScoreColor(
                          Number(val)
                        ).replace("text-", "bg-")}`}
                        style={{ width: `${(Number(val) / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    AI Evaluation Feedback
                  </h3>
                </div>
                <div className="p-6">
                  <div className="prose max-w-none">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                      <p className="text-blue-800 text-sm">
                        <strong>Evaluation Summary:</strong> Your speaking has
                        been evaluated by our AI system based on professional
                        business communication standards.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Detailed Feedback:
                      </h4>
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {feedback.detailed}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Your Speech Transcription
                  </h3>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Original Prompt:
                    </h4>
                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                      {submission.prompt}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      Transcribed Speech:
                    </h4>
                    <div className="bg-gray-50 p-4 rounded border">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {submission.transcription ||
                          "No transcription available."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate("/SpeakingModule")}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Practice Again
                  </button>
                  <button
                    onClick={() => navigate("/NewHome")}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingResult;

