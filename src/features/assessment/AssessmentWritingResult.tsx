import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '@/store';

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

const AssessmentWritingResult = () => {
    const navigate = useNavigate();
    const { assessmentWritingEvaluation } = useStore();
    const [calculatedScores, setCalculatedScores] = useState<CalculatedScores | null>(null);

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

        // Calculate scores after writing module completion
        calculateScoresAfterWriting();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const calculateScoresAfterWriting = () => {
        try {
            // First, try to load existing scores from localStorage
            const existingScores = localStorage.getItem('ASSESSMENT_FINAL_SCORES');
            let finalScores: CalculatedScores = {
                assessment_speakingScore: 0,
                assessment_writingScore: 0,
                assessment_listeningScore: 0,
                assessment_readingScore: 0,
                assessment_generalScore: 0
            };
            
            if (existingScores) {
                try {
                    finalScores = JSON.parse(existingScores) as CalculatedScores;
                } catch (error) {
                    console.error("Error parsing existing scores:", error);
                }
            }
            
            // Get writing scores from current evaluation
            const { scores: writingScores } = assessmentWritingEvaluation;
            
            // Update the writing score with the current evaluation
            finalScores.assessment_writingScore = writingScores?.overall || 0;
            
            setCalculatedScores(finalScores);
            
            // Store scores immediately
            localStorage.setItem('ASSESSMENT_FINAL_SCORES', JSON.stringify(finalScores));
            
            // Also store individual writing score
            localStorage.setItem('ASSESSMENT_WRITING_SCORE', (writingScores?.overall || 0).toString());
            
        } catch (error) {
            console.error("Error calculating scores after writing:", error);
        }
    };

    const { scores, feedback, submission } = assessmentWritingEvaluation;

    if (!scores || !feedback) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">No Results Available</h1>
                    <p className="text-gray-600 mb-4">No assessment writing results found.</p>
                    <button 
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
        if (score >= 8) return 'text-green-600';
        if (score >= 6) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBackground = (score: number): string => {
        if (score >= 8) return 'bg-green-100';
        if (score >= 6) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const getImprovementSuggestions = (score: number): string[] => {
        if (score >= 8) {
            return [
                "Excellent work! Your writing demonstrates strong professional skills.",
                "Consider adding more specific examples to strengthen your arguments.",
                "Continue practicing to maintain this high level of performance."
            ];
        } else if (score >= 6) {
            return [
                "Good effort! Focus on improving clarity and structure.",
                "Work on using more professional vocabulary and tone.",
                "Practice organizing your thoughts more logically."
            ];
        } else {
            return [
                "Focus on improving basic grammar and sentence structure.",
                "Work on developing clearer, more concise writing.",
                "Practice writing regularly to build confidence and skills."
            ];
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
                                onClick={() => navigate(-1)}
                                className="text-gray-600 hover:text-gray-800"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold text-gray-800">Assessment Writing Results</h1>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                            Assessment ID: {submission?.assessmentId || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Score Overview */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Assessment Score</h2>
                            
                            {/* Overall Score Circle */}
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <svg className="w-32 h-32" viewBox="0 0 36 36">
                                        <path
                                            d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="3"
                                        />
                                        <path
                                            d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke={scores.overall >= 8 ? '#10b981' : scores.overall >= 6 ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="3"
                                            strokeDasharray={`${scores.overall * 10}, 100`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className={`text-3xl font-bold ${getScoreColor(scores.overall)}`}>
                                                {scores.overall.toFixed(1)}
                                            </div>
                                            <div className="text-sm text-gray-500">/ 10</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Score Breakdown */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Score Breakdown</h3>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Clarity & Organization</span>
                                        <span className={`text-sm font-semibold ${getScoreColor(scores.clarity)}`}>
                                            {scores.clarity}/10
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Grammar & Vocabulary</span>
                                        <span className={`text-sm font-semibold ${getScoreColor(scores.grammar)}`}>
                                            {scores.grammar}/10
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Professional Tone</span>
                                        <span className={`text-sm font-semibold ${getScoreColor(scores.tone)}`}>
                                            {scores.tone}/10
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Content Relevance</span>
                                        <span className={`text-sm font-semibold ${getScoreColor(scores.content)}`}>
                                            {scores.content}/10
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Results */}
                    <div className="lg:col-span-2">
                        <div className="space-y-6">
                            
                            {/* AI Feedback */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Assessment Feedback</h2>
                                <div className="prose max-w-none">
                                    <div className={`p-4 rounded-lg ${getScoreBackground(scores.overall)}`}>
                                        <p className="text-gray-800 leading-relaxed">
                                            {feedback.detailed}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Improvement Suggestions */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Improvement Suggestions</h2>
                                <div className="space-y-3">
                                    {getImprovementSuggestions(scores.overall).map((suggestion, index) => (
                                        <div key={index} className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                                            <p className="text-gray-700">{suggestion}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Your Response */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Assessment Response</h2>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Original Prompt:</h3>
                                    <p className="text-gray-800 mb-4 italic">
                                        {submission?.prompt}
                                    </p>
                                    
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Your Response:</h3>
                                    <div className="bg-white p-4 rounded border">
                                        <p className="text-gray-800 whitespace-pre-wrap">
                                            {submission?.response}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Assessment Tips */}
                            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                                <h2 className="text-xl font-semibold text-blue-800 mb-4">Assessment Tips</h2>
                                <div className="space-y-3">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                        <p className="text-blue-700">This assessment evaluates your professional writing skills in a business context.</p>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                        <p className="text-blue-700">Focus on clarity, professionalism, and relevance to the given prompt.</p>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                        <p className="text-blue-700">Practice regularly to improve your writing skills and assessment performance.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-center space-x-4 mt-8">
                                <button
                                    onClick={() => navigate('/AssessmentSpeakingModule')}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Continue to Speaking Assessment
                                </button>
                                <button
                                    onClick={() => navigate('/newassessment')}
                                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Back to Assessment
                                </button>
                            </div>
                            
                            {/* All Module Scores Display */}
                            {calculatedScores && (
                                <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Complete Assessment Scores</h3>
                                    <div className="grid grid-cols-5 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <div className="text-sm font-medium text-blue-700">General</div>
                                            <div className="text-2xl font-bold text-blue-800">{calculatedScores.assessment_generalScore || 0}/10</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-sm font-medium text-green-700">Reading</div>
                                            <div className="text-2xl font-bold text-green-800">{calculatedScores.assessment_readingScore || 0}/10</div>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <div className="text-sm font-medium text-purple-700">Listening</div>
                                            <div className="text-2xl font-bold text-purple-800">{calculatedScores.assessment_listeningScore || 0}/10</div>
                                        </div>
                                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                                            <div className="text-sm font-medium text-orange-700">Writing</div>
                                            <div className="text-2xl font-bold text-orange-800">{calculatedScores.assessment_writingScore || 0}/10</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <div className="text-sm font-medium text-gray-700">Speaking</div>
                                            <div className="text-2xl font-bold text-gray-800">{calculatedScores.assessment_speakingScore || 0}/10</div>
                                        </div>
                                    </div>
                                    
                                    {/* Category-specific General Scores */}
                                    {calculatedScores.assessment_generalScore && calculatedScores.assessment_generalScore > 0 && (
                                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                            <h4 className="text-lg font-semibold text-blue-800 mb-3">General Question Categories</h4>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="text-center p-3 bg-blue-100 rounded">
                                                    <div className="text-sm font-medium text-blue-700">Decision Making</div>
                                                    <div className="text-xl font-bold text-blue-800">{calculatedScores.assessment_decisionMaking_generalScore || 0}/10</div>
                                                </div>
                                                <div className="text-center p-3 bg-blue-100 rounded">
                                                    <div className="text-sm font-medium text-blue-700">Business Etiquette</div>
                                                    <div className="text-xl font-bold text-blue-800">{calculatedScores.assessment_businessEtiquette_generalScore || 0}/10</div>
                                                </div>
                                                <div className="text-center p-3 bg-blue-100 rounded">
                                                    <div className="text-sm font-medium text-blue-700">Communication Skills</div>
                                                    <div className="text-xl font-bold text-blue-800">{calculatedScores.assessment_communicationSkills_generalScore || 0}/10</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentWritingResult;

