interface ProficiencyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProficiencyModal = ({ isOpen, onClose }: ProficiencyModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
                <h2 className="text-xl font-bold mb-4">Assessment Submitted!</h2>
                <p className="text-lg mb-4">Your CEFR English Proficiency report has been shared with your L&D Department.
                </p>
                <p className="text-gray-700 mb-6">
                    Grading Scale (in grey): 1 to 10
                    Based on the CEFR levels A1 (Beginner) to C2 (Proficient).  </p>
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

export default ProficiencyModal;

