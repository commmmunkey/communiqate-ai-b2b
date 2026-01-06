import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

interface AssessmentScores {
    assessment_readingScore: number;
    assessment_listeningScore: number;
    assessment_generalScore: number;
    assessment_writingScore: number;
    assessment_speakingScore: number;
}

const AssessmentCompletion = () => {
    const navigate = useNavigate();
    const [assessmentScores, setAssessmentScores] = useState<AssessmentScores | null>(null);

    useEffect(() => {
        // Set theme colors
        const primaryColor = localStorage.getItem("corporate_primary_color") || '#0000ff';
        const secondaryColor = localStorage.getItem("corporate_secondary_color") || '#f5914a';
        const backgroundColor = localStorage.getItem("corporate_background_color") || '#fddaa7';
        const accentColor = localStorage.getItem("corporate_accent_color") || '#e0d4bc';

        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--secondary-color', secondaryColor);
        document.documentElement.style.setProperty('--background-color', backgroundColor);
        document.documentElement.style.setProperty('--accent-color', accentColor);

        // Load assessment scores
        const scoresData = localStorage.getItem('ASSESSMENT_FINAL_SCORES');
        if (scoresData) {
            setAssessmentScores(JSON.parse(scoresData));
        }
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600';
        if (score >= 6) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBackground = (score: number) => {
        if (score >= 8) return 'bg-green-100';
        if (score >= 6) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const handleStartAIInterview = () => {
        // Set a flag to indicate assessment scores are ready for upload
        localStorage.setItem('ASSESSMENT_SCORES_READY', 'true');
        navigate('/');
    };

    const handleGoToHome = () => {
        navigate('/NewHome');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">

                    {/* Success Icon */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Assessment Completed Successfully!
                    </h1>

                    {/* Description */}
                    <p className="text-lg text-gray-600 mb-8">
                        Congratulations! You have successfully completed all assessment modules including Reading, Listening, General, Writing, and Speaking. Your scores have been recorded and will be uploaded to the system after the AI interview.
                    </p>

                    {/* Assessment Summary */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Assessment Summary</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Reading Assessment:</span>
                                <span className="font-medium text-green-600">✓ Completed</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Listening Assessment:</span>
                                <span className="font-medium text-green-600">✓ Completed</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">General Assessment:</span>
                                <span className="font-medium text-green-600">✓ Completed</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Writing Assessment:</span>
                                <span className="font-medium text-green-600">✓ Completed</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Speaking Assessment:</span>
                                <span className="font-medium text-green-600">✓ Completed</span>
                            </div>
                        </div>
                    </div>

                    {/* Assessment Scores */}
                    {assessmentScores && (
                        <div className="bg-blue-50 rounded-lg p-6 mb-8">
                            <h2 className="text-xl font-semibold text-blue-800 mb-4">Your Assessment Scores</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Reading Score:</span>
                                    <span className={`font-bold ${getScoreColor(assessmentScores.assessment_readingScore)}`}>
                                        {assessmentScores.assessment_readingScore}/10
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Listening Score:</span>
                                    <span className={`font-bold ${getScoreColor(assessmentScores.assessment_listeningScore)}`}>
                                        {assessmentScores.assessment_listeningScore}/10
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">General Score:</span>
                                    <span className={`font-bold ${getScoreColor(assessmentScores.assessment_generalScore)}`}>
                                        {assessmentScores.assessment_generalScore}/10
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Writing Score:</span>
                                    <span className={`font-bold ${getScoreColor(assessmentScores.assessment_writingScore)}`}>
                                        {assessmentScores.assessment_writingScore}/10
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Speaking Score:</span>
                                    <span className={`font-bold ${getScoreColor(assessmentScores.assessment_speakingScore)}`}>
                                        {assessmentScores.assessment_speakingScore}/10
                                    </span>
                                </div>
                                <div className="flex justify-between items-center col-span-2 border-t pt-2">
                                    <span className="text-gray-800 font-semibold">Overall Performance:</span>
                                    <span className={`font-bold text-lg ${getScoreColor(
                                        (assessmentScores.assessment_readingScore +
                                            assessmentScores.assessment_listeningScore +
                                            assessmentScores.assessment_generalScore +
                                            assessmentScores.assessment_writingScore +
                                            assessmentScores.assessment_speakingScore) / 5
                                    )}`}>
                                        {((assessmentScores.assessment_readingScore +
                                            assessmentScores.assessment_listeningScore +
                                            assessmentScores.assessment_generalScore +
                                            assessmentScores.assessment_writingScore +
                                            assessmentScores.assessment_speakingScore) / 5).toFixed(1)}/10
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Next Steps */}
                    <div className="bg-blue-50 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold text-blue-800 mb-4">Next Steps</h2>
                        <p className="text-blue-700 mb-4">
                            You can now proceed to the AI Interview (4o) to complete your evaluation process. The AI interview will assess your communication skills and provide comprehensive feedback.
                        </p>
                        <div className="flex items-center justify-center space-x-2 text-blue-600">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="font-medium">AI Interview will upload all scores to the system</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleStartAIInterview}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                            Start AI Interview (4o)
                        </button>

                        <button
                            onClick={handleGoToHome}
                            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                        >
                            Go to Home
                        </button>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-8 text-sm text-gray-500">
                        <p>Your assessment data has been securely stored and will be processed after the AI interview completion.</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AssessmentCompletion;

