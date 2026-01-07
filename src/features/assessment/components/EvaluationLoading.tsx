import { useEffect, useState } from 'react';
import { useStore } from '@/store';

const EvaluationLoading = () => {
    const { evaluationLoading } = useStore();
    const [dots, setDots] = useState('');
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Update current step based on progress
        if (evaluationLoading.progress < 25) {
            setCurrentStep(0);
        } else if (evaluationLoading.progress < 50) {
            setCurrentStep(1);
        } else if (evaluationLoading.progress < 75) {
            setCurrentStep(2);
        } else {
            setCurrentStep(3);
        }
    }, [evaluationLoading.progress]);

    if (!evaluationLoading.isVisible) {
        return null;
    }

    const formatTime = (seconds: number): string => {
        if (seconds < 60) {
            return `${seconds}s`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    const getStepMessages = (): string[] => {
        return [
            'Processing your response',
            'Analyzing content and structure',
            'Generating detailed feedback',
            'Preparing your results'
        ];
    };

    const getStepIcon = (stepIndex: number) => {
        const isCompleted = stepIndex < currentStep;
        const isCurrent = stepIndex === currentStep;
        
        if (isCompleted) {
            return (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            );
        } else if (isCurrent) {
            return (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            );
        } else {
            return (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
            );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
                <div className="text-center">
                    {/* AI Evaluation Icon */}
                    <div className="mb-6">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        AI Evaluation in Progress
                    </h3>

                    {/* Status Message */}
                    <p className="text-gray-600 mb-6">
                        {evaluationLoading.message || 'Analyzing your response'}{dots}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${evaluationLoading.progress}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 mt-2">
                            <span>{Math.round(evaluationLoading.progress)}% Complete</span>
                            <span>{formatTime(evaluationLoading.estimatedTime)} remaining</span>
                        </div>
                    </div>

                    {/* Evaluation Steps */}
                    <div className="text-left space-y-3 text-sm">
                        {getStepMessages().map((message, index) => (
                            <div key={index} className={`flex items-center ${index <= currentStep ? 'text-gray-700' : 'text-gray-400'}`}>
                                <div className="mr-3">
                                    {getStepIcon(index)}
                                </div>
                                <span className={index <= currentStep ? 'font-medium' : ''}>
                                    {message}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Tips */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="text-left">
                                <p className="text-xs text-blue-700 font-medium mb-1">
                                    Evaluation Tips:
                                </p>
                                <ul className="text-xs text-blue-600 space-y-1">
                                    <li>• This evaluation typically takes 15-30 seconds</li>
                                    <li>• The AI analyzes clarity, grammar, and professional tone</li>
                                    <li>• Detailed feedback will be provided for improvement</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Cancel Button (Optional) */}
                    {evaluationLoading.progress < 50 && (
                        <div className="mt-4">
                            <button 
                                className="text-xs text-gray-500 hover:text-gray-700 underline"
                                onClick={() => {
                                    // This would need to be implemented with a cancel function
                                    // console.log('Cancel evaluation');
                                }}
                            >
                                Cancel Evaluation
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvaluationLoading;

