import React, { useEffect } from 'react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    feedback: string;
    setFeedback: (value: string) => void;
}

const FeedbackModal = ({ isOpen, onClose, onSubmit, feedback, setFeedback }: FeedbackModalProps) => {
    useEffect(() => {
        // Fetch and set theme colors from localStorage or API here
        const primaryColor = localStorage.getItem("corporate_primary_color") || '#0000ff';
        const secondaryColor = localStorage.getItem("corporate_secondary_color") || '#f5914a';
        const backgroundColor = localStorage.getItem("corporate_background_color") || '#fddaa7';
        const accentColor = localStorage.getItem("corporate_accent_color") || '#e0d4bc';

        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--secondary-color', secondaryColor);
        document.documentElement.style.setProperty('--background-color', backgroundColor);
        document.documentElement.style.setProperty('--accent-color', accentColor);
    }, []);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFeedback(e.target.value);
    };

    const handleSubmit = () => {
        onSubmit();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-4 relative rounded-lg w-full max-w-lg">
                {/* Close button */}
                <button
                    className="absolute top-0 right-0 mt-4 mr-4 text-lg font-semibold"
                    onClick={onClose}
                >
                    X
                </button>

                <h2 className="text-lg leading-6 font-medium text-black mb-2 text-center">Add Feedback</h2>
                <p className="text-sm text-gray-600 mb-4 text-center">Share your feedback so that we can serve you better.</p>

                <textarea
                    className="w-full h-32 p-2 border border-gray-300 rounded-md"
                    placeholder="Write here..."
                    value={feedback}
                    onChange={handleChange}
                />

                <button
                    className="mt-4 bg-primary text-white px-4 py-2 rounded-full w-full"
                    onClick={handleSubmit}
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default FeedbackModal;

