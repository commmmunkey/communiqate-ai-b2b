interface AssesmentQuestionNotModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AssesmentQuestionNotModal = ({ isOpen, onClose }: AssesmentQuestionNotModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
                <h2 className="text-xl font-bold mb-4">Assessment Questions Not Available</h2>
                <p className="text-gray-700 mb-6">
                    We're sorry, but it looks like this assessment is currently unavailable. No questions have been added yet. Please check back later or contact your administrator for further assistance. </p>
                <div className="flex justify-center">
                    <button
                        className="px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary-dark"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssesmentQuestionNotModal;

