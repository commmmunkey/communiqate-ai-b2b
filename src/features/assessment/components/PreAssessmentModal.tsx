interface PreAssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBegin: () => void;
}

const PreAssessmentModal = ({ isOpen, onClose, onBegin }: PreAssessmentModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
                <h2 className="text-xl font-bold mb-4">Assessment Tool</h2>
                <p className="text-gray-700 mb-6">
                    You are about to begin the assessment. Once you click "Begin," the timer will start, and you'll have limited time to complete all the questions. Please make sure you're ready before proceeding.
                </p>

                <p className="text-gray-700 mb-6">
                    Click "Begin" to start the assessment.</p>
                <p className="text-gray-700 mb-6">
                    Click "Cancel" if you're not ready and want to exit the assessment.</p>
                <div className="flex justify-between">
                    <button
                        className="px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary-dark"
                        onClick={onBegin}
                    >
                        Begin
                    </button>
                    <button
                        className="px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary-dark"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreAssessmentModal;

