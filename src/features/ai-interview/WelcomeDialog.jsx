import React from 'react';

const WelcomeDialog = ({ onContinue, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 relative">
                {/* Close button */}
                <button 
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="text-center">
                    <h2 className="text-xl font-bold text-black mb-2">
                        Welcome to Communiqate AI's
                    </h2>
                    <h3 className="text-lg font-bold text-black mb-4">
                        Business Readiness Assessment Portal
                    </h3>
                    <p className="text-black mb-6">
                        We're excited to have you on board! Before you begin, please take a moment to complete
                        your basic details below. This will help us get to know you better and ensure an accurate
                        evaluation of your communication skills and business readiness.
                    </p>
                    <p className="text-black mb-6">
                        Click Continue to start. Good luck!
                    </p>
                    <button
                        onClick={onContinue}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeDialog; 