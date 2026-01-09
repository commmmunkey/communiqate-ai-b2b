interface Exam {
  examName?: string;
  examDuration?: string;
  userexamName?: string;
  userexamReadingSubmitted?: string;
  userexamListeningSubmitted?: string;
  userexamWritingSubmitted?: string;
  userexamSpeakingSubmitted?: string;
  userexampercentage?: string;
  [key: string]: any;
}

interface ExamListViewProps {
  exam: Exam;
  onClickExam: () => void;
  pendingStatus: boolean;
  marks?: string;
}

const ExamListView = ({
  exam,
  onClickExam,
  pendingStatus,
  marks,
}: ExamListViewProps) => {
  // Utility function to convert "HH:MM:SS" to decimal hours
  const convertDurationToHours = (duration: string | undefined): string => {
    if (!duration) return "0.0";
    const parts = duration.split(":").map(Number);
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;
    return (hours + minutes / 60 + seconds / 3600).toFixed(1);
  };

  const getStatusComponent = () => {
    if (
      exam.userexamReadingSubmitted === "No" ||
      exam.userexamListeningSubmitted === "No" ||
      exam.userexamWritingSubmitted === "No" ||
      exam.userexamSpeakingSubmitted === "No"
    ) {
      return (
        <div className="text-gray-600 text-lg font-bold">→</div>
      );
    } else if (pendingStatus) {
      return (
        <div
          style={{
            backgroundColor: "orange",
            alignItems: "baseline",
            marginTop: 10,
            padding: "5px 10px",
            color: "white",
            fontSize: 13,
          }}
        >
          Evaluation Pending
        </div>
      );
    } else {
      const percentage = parseInt(exam.userexampercentage || "0", 10);
      if (percentage >= 70) {
        return (
          <div className="text-green-600 text-lg font-bold">✓</div>
        );
      } else {
        return (
          <div
            style={{
              backgroundColor: "red",
              alignItems: "baseline",
              marginTop: 10,
              padding: "5px 10px",
              color: "white",
              fontSize: 17,
            }}
          >
            {percentage} %
          </div>
        );
      }
    }
  };

  const examDurationInHours = convertDurationToHours(
    exam.examDuration || exam.examName,
  );

  return (
    <div
      className="cursor-pointer flex justify-between items-center border-b border-gray-300 pb-2"
      onClick={onClickExam}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClickExam();
        }
      }}
    >
      <div>
        <div className="text-black font-bold">
          {exam.examName || exam.userexamName || "Exam"}
        </div>
        {pendingStatus ? (
          <div className="flex items-center">
            <div className="text-black font-bold">View Result</div>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="text-gray-600 mr-1">⏱</div>
            <div>{examDurationInHours} hrs</div>
          </div>
        )}
      </div>
      {getStatusComponent()}
    </div>
  );
};

export default ExamListView;

