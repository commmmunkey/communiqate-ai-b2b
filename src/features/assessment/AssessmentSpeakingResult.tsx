import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "@/store";
import { API_BASE_URL } from "@/lib/constants";
import { toast } from "react-toastify";

interface CalculatedScores {
  assessment_speakingScore?: number;
  assessment_writingScore?: number;
  assessment_listeningScore?: number;
  assessment_readingScore?: number;
  assessment_generalScore?: number;
  assessment_decisionMaking_generalScore?: number;
  assessment_businessEtiquette_generalScore?: number;
  assessment_communicationSkills_generalScore?: number;
}

const AssessmentSpeakingResult = () => {
  const navigate = useNavigate();
  const { assessmentSpeakingEvaluation, assessmentProgress } = useStore();
  const [calculatedScores, setCalculatedScores] =
    useState<CalculatedScores | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Set theme colors
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
    //   secondaryColor,
    // );
    // document.documentElement.style.setProperty(
    //   "--background-color",
    //   backgroundColor,
    // );
    // document.documentElement.style.setProperty("--accent-color", accentColor);

    // Calculate scores immediately when component loads
    calculateAllScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateAllScores = () => {
    try {
      // First, try to load existing scores from localStorage
      const existingScores = localStorage.getItem("ASSESSMENT_FINAL_SCORES");
      let finalScores: CalculatedScores = {
        assessment_speakingScore: 0,
        assessment_writingScore: 0,
        assessment_listeningScore: 0,
        assessment_readingScore: 0,
        assessment_generalScore: 0,
      };

      if (existingScores) {
        try {
          finalScores = JSON.parse(existingScores) as CalculatedScores;
        } catch (error) {
          console.error("Error parsing existing scores:", error);
        }
      }

      // Get speaking scores from current evaluation
      const { scores: speakingScores } = assessmentSpeakingEvaluation;

      // Update the speaking score with the current evaluation
      finalScores.assessment_speakingScore = speakingScores?.overall || 0;

      setCalculatedScores(finalScores);
      localStorage.setItem(
        "ASSESSMENT_FINAL_SCORES",
        JSON.stringify(finalScores),
      );

      // Also store individual speaking score
      localStorage.setItem(
        "ASSESSMENT_SPEAKING_SCORE",
        (speakingScores?.overall || 0).toString(),
      );
    } catch (error) {
      console.error("Error calculating scores:", error);
    }
  };

  const { scores, feedback, submission } = assessmentSpeakingEvaluation;

  if (!scores || !feedback) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            No Results Available
          </h1>
          <p className="text-gray-600 mb-4">
            No assessment speaking results found.
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number): string => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBackground = (score: number): string => {
    if (score >= 8) return "bg-green-100";
    if (score >= 6) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getImprovementSuggestions = (score: number): string[] => {
    if (score >= 8) {
      return [
        "Excellent speaking skills! Your pronunciation and fluency are outstanding.",
        "Consider varying your intonation to make your speech more engaging.",
        "Continue practicing to maintain this high level of performance.",
      ];
    } else if (score >= 6) {
      return [
        "Good effort! Focus on improving pronunciation and clarity.",
        "Work on speaking at a more consistent pace.",
        "Practice organizing your thoughts before speaking.",
      ];
    } else {
      return [
        "Focus on improving basic pronunciation and speaking clearly.",
        "Work on speaking at a slower, more measured pace.",
        "Practice speaking regularly to build confidence and fluency.",
      ];
    }
  };

  const getSpeakingTips = (): string[] => {
    return [
      "Practice speaking clearly and at a moderate pace",
      "Use professional language and tone in business contexts",
      "Structure your response with a clear introduction and conclusion",
      "Focus on pronunciation and fluency",
      "Maintain good posture and breathing while speaking",
    ];
  };

  const submitAssessmentToAPI = async () => {
    try {
      const userId = localStorage.getItem("USER_ID");
      const corporateUserId = localStorage.getItem("corporateUserId") || userId;
      const lessionId = localStorage.getItem("LESSON_ID") || "0";

      // Get calculated scores from localStorage
      const storedScores = localStorage.getItem("ASSESSMENT_FINAL_SCORES");
      let scores: CalculatedScores = {
        assessment_speakingScore: 0,
        assessment_writingScore: 0,
        assessment_listeningScore: 0,
        assessment_readingScore: 0,
        assessment_generalScore: 0,
        assessment_businessEtiquette_generalScore: 0,
        assessment_communicationSkills_generalScore: 0,
        assessment_decisionMaking_generalScore: 0,
      };

      if (storedScores) {
        try {
          scores = JSON.parse(storedScores) as CalculatedScores;
        } catch (error) {
          console.error("Error parsing stored scores:", error);
        }
      }

      // Use calculatedScores if available, otherwise use stored scores
      if (calculatedScores) {
        scores = { ...scores, ...calculatedScores };
      }

      const dictParameter = JSON.stringify([
        {
          corporateUserId: corporateUserId,
          languageID: "1",
          moduleID: "8",
          apiType: "Android",
          apiVersion: "1.0",
          loginUserID: userId,
          lessionID: parseInt(lessionId) || 7,
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

      const apiUrl = `${API_BASE_URL}assessment/submit-user-assessment`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
        body: "json=" + dictParameter,
      });

      const responseJson = await response.json();
      console.log("Assessment API response:", JSON.stringify(responseJson));

      return responseJson;
    } catch (error) {
      console.error("Error submitting assessment to API:", error);
      throw error;
    }
  };

  const handleFinalSubmission = async () => {
    try {
      setIsSubmitting(true);
      console.log("Submitting final assessment results...");

      // Use pre-calculated scores
      if (!calculatedScores) {
        console.error("No calculated scores available");
        toast.error("No scores available to submit");
        setIsSubmitting(false);
        return;
      }

      console.log("Using pre-calculated scores:", calculatedScores);

      // Call assessment submission API
      await submitAssessmentToAPI();

      // Reset Zustand assessment progress state after successful submission
      assessmentProgress.resetAssessment();

      toast.success("Assessment submitted successfully!");
      console.log("Assessment scores submitted successfully.");

      // Navigate to assessment completion page or back to assessment
      navigate("/assessment-completion");
    } catch (error) {
      console.error("Error in final assessment submission:", error);
      toast.error("Failed to submit assessment. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => navigate("/assessment")}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Assessment
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Assessment Speaking Results
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Score Overview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Assessment Results</h2>

            {/* Overall Score */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <svg
                  className="w-32 h-32 transform -rotate-90"
                  viewBox="0 0 120 120"
                  aria-label="Score visualization"
                >
                  <title>
                    Assessment Score: {scores.overall.toFixed(1)}/10
                  </title>
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={
                      scores.overall >= 8
                        ? "#10b981"
                        : scores.overall >= 6
                          ? "#f59e0b"
                          : "#ef4444"
                    }
                    strokeWidth="12"
                    strokeDasharray={`${scores.overall * 3.39} 339`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div
                      className={`text-3xl font-bold ${getScoreColor(scores.overall)}`}
                    >
                      {scores.overall.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Speaking Score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* All Module Scores */}
            {calculatedScores && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${getScoreColor(calculatedScores.assessment_readingScore || 0)}`}
                  >
                    {calculatedScores.assessment_readingScore || 0}/10
                  </div>
                  <div className="text-sm text-gray-600">Reading</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${getScoreColor(calculatedScores.assessment_listeningScore || 0)}`}
                  >
                    {calculatedScores.assessment_listeningScore || 0}/10
                  </div>
                  <div className="text-sm text-gray-600">Listening</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${getScoreColor(calculatedScores.assessment_generalScore || 0)}`}
                  >
                    {calculatedScores.assessment_generalScore || 0}/10
                  </div>
                  <div className="text-sm text-gray-600">General</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${getScoreColor(calculatedScores.assessment_writingScore || 0)}`}
                  >
                    {calculatedScores.assessment_writingScore || 0}/10
                  </div>
                  <div className="text-sm text-gray-600">Writing</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${getScoreColor(calculatedScores.assessment_speakingScore || 0)}`}
                  >
                    {calculatedScores.assessment_speakingScore || 0}/10
                  </div>
                  <div className="text-sm text-gray-600">Speaking</div>
                </div>
              </div>
            )}

            {/* Detailed Speaking Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(scores).map(([criterion, score]) => {
                if (criterion === "overall") return null;
                const scoreValue = score as number;
                return (
                  <div key={criterion} className="text-center">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(scoreValue)}`}
                    >
                      {scoreValue}/10
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {criterion.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Detailed Feedback</h3>
            <div className="prose max-w-none">
              <div
                className={`p-4 rounded-lg ${getScoreBackground(scores.overall)}`}
              >
                <p className="text-gray-800 leading-relaxed">
                  {feedback.detailed}
                </p>
              </div>
            </div>
          </div>

          {/* Transcription */}
          {submission?.transcription && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Your Speech Transcription
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {submission.transcription}
                </p>
              </div>
            </div>
          )}

          {/* Improvement Suggestions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              Improvement Suggestions
            </h3>
            <div className="space-y-4">
              {getImprovementSuggestions(scores.overall).map(
                (suggestion, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-gray-700">{suggestion}</p>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Speaking Tips */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Speaking Tips</h3>
            <div className="space-y-4">
              {getSpeakingTips().map((tip, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* All Module Scores Display */}
          {calculatedScores && (
            <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Complete Assessment Scores
              </h3>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-700">
                    General
                  </div>
                  <div className="text-2xl font-bold text-blue-800">
                    {calculatedScores.assessment_generalScore || 0}/10
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-700">
                    Reading
                  </div>
                  <div className="text-2xl font-bold text-green-800">
                    {calculatedScores.assessment_readingScore || 0}/10
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-purple-700">
                    Listening
                  </div>
                  <div className="text-2xl font-bold text-purple-800">
                    {calculatedScores.assessment_listeningScore || 0}/10
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm font-medium text-orange-700">
                    Writing
                  </div>
                  <div className="text-2xl font-bold text-orange-800">
                    {calculatedScores.assessment_writingScore || 0}/10
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    Speaking
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {calculatedScores.assessment_speakingScore || 0}/10
                  </div>
                </div>
              </div>

              {/* Category-specific General Scores */}
              {calculatedScores.assessment_generalScore &&
                calculatedScores.assessment_generalScore > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3">
                      General Question Categories
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-100 rounded">
                        <div className="text-sm font-medium text-blue-700">
                          Decision Making
                        </div>
                        <div className="text-xl font-bold text-blue-800">
                          {calculatedScores.assessment_decisionMaking_generalScore ||
                            0}
                          /10
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-100 rounded">
                        <div className="text-sm font-medium text-blue-700">
                          Business Etiquette
                        </div>
                        <div className="text-xl font-bold text-blue-800">
                          {calculatedScores.assessment_businessEtiquette_generalScore ||
                            0}
                          /10
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-100 rounded">
                        <div className="text-sm font-medium text-blue-700">
                          Communication Skills
                        </div>
                        <div className="text-xl font-bold text-blue-800">
                          {calculatedScores.assessment_communicationSkills_generalScore ||
                            0}
                          /10
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={handleFinalSubmission}
              disabled={isSubmitting}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-label="Loading"
                >
                  <title>Loading spinner</title>
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {isSubmitting ? "Submitting..." : "Submit Assessment"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/assessment")}
              disabled={isSubmitting}
              className="px-8 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back to Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSpeakingResult;
