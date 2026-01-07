interface AlreadyAssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AlreadyAssessmentModal = ({ isOpen, onClose }: AlreadyAssessmentModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
                <h2 className="text-xl font-bold mb-4">Assessment Already Completed</h2>
                <p className="text-gray-700 mb-6">
                    You have already completed this assessment. </p>
                <p className="text-gray-700 mb-6">
                    Your proficiency report has been sent to the L&D Department for review.</p>
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

export default AlreadyAssessmentModal;

