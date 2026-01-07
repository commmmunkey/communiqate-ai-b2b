import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useStore } from "@/store";
import { environment } from "../environment";

interface ExamSummary {
  totalQuestions: number;
  notVisitedQuestions: number;
  notAnsweredQuestions: number;
  markForReviewQuestions: number;
  totalAnsweredQuestions: number;
}

interface ExamSubmitPopupProps {
  onClose: () => void;
  examSummary: ExamSummary;
  lessionId: number;
  totalQuestions: number;
  isAudio: boolean;
  arrAnswers: any[];
  ImageUri: File | Blob | null;
  lengthOfFile: number;
  loading: (isLoading: boolean) => void;
  examID: number;
  moduleId: number;
}

const ExamSubmitPopup = ({
  onClose,
  examSummary,
  lessionId,
  totalQuestions,
  isAudio,
  arrAnswers,
  ImageUri,
  lengthOfFile,
  loading,
  examID,
  moduleId,
}: ExamSubmitPopupProps) => {
  const navigate = useNavigate();
  const {
    moduleId: moduleIDSt,
    lessonId: lessonIDState,
    moduleIds: moduleIDsStateVal,
  } = useStore();

  useEffect(() => {
    const primaryColor =
      localStorage.getItem("corporate_primary_color") || "#0000ff";
    const secondaryColor =
      localStorage.getItem("corporate_secondary_color") || "#f5914a";
    const backgroundColor =
      localStorage.getItem("corporate_background_color") || "#fddaa7";
    const accentColor =
      localStorage.getItem("corporate_accent_color") || "#e0d4bc";

    document.documentElement.style.setProperty("--primary-color", primaryColor);
    document.documentElement.style.setProperty(
      "--secondary-color",
      secondaryColor
    );
    document.documentElement.style.setProperty(
      "--background-color",
      backgroundColor
    );
    document.documentElement.style.setProperty("--accent-color", accentColor);
  }, []);

  const userId = localStorage.getItem("USER_ID");
  const isReadingSubmittedExam = localStorage.getItem("isReadingSubmittedExam");
  const isWrittngSubmittedExam = localStorage.getItem("isWrittngSubmittedExam");
  const isSpeakingSubmittedExam = localStorage.getItem(
    "isSpeakingSubmittedExam"
  );
  const isListeningSubmittedExam = localStorage.getItem(
    "isListeningSubmittedExam"
  );

  const uploadImageToServer = () => {
    loading(true);
    if (lengthOfFile > 0 && ImageUri) {
      const formData = new FormData();
      if (isAudio) {
        formData.append("FileField", ImageUri, "recording.mp4");
      } else {
        formData.append("FileField", ImageUri);
      }
      formData.append("FilePath", "users");
      formData.append(
        "json",
        JSON.stringify([
          { loginuserID: userId, apiType: "Android", apiVersion: "1.0" },
        ])
      );

      const url = environment.production
        ? environment.apiBaseUrl + "users/file-upload"
        : "/api/users/file-upload";
      fetch(url, {
        method: "POST",
        headers: {
          Authorization: "Bearer access-token",
        },
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          submitExamApi(data[0].fileName);
        })
        .catch((error) => {
          console.error("Error uploading image:", error);
          loading(false);
        });
    } else {
      submitExamApi("");
    }
  };

  const setExamTimeApi = () => {
    try {
      const dictParameter = JSON.stringify([
        {
          loginuserID: userId,
          languageID: "1",
          apiType: "Android",
          apiVersion: "1.0",
          examID: examID,
          userexamReadingSubmitted:
            isReadingSubmittedExam === "Yes"
              ? "Yes"
              : moduleId == 6 || moduleId == 8
              ? "Yes"
              : "No",
          userexamListeningSubmitted:
            isListeningSubmittedExam === "Yes"
              ? "Yes"
              : moduleId == 10 || moduleId == 11
              ? "Yes"
              : "No",
          userexamWritingSubmitted:
            isWrittngSubmittedExam === "Yes"
              ? "Yes"
              : moduleId == 7 || moduleId == 9
              ? "Yes"
              : "No",
          userexamSpeakingSubmitted:
            isSpeakingSubmittedExam === "Yes"
              ? "Yes"
              : moduleId == 12 || moduleId == 13
              ? "Yes"
              : "No",
          userexamReadingTimer: 0,
          userexamListeningTimer: 0,
          userexamWritingTimer: 0,
          userexamSpeakingTimer: 0,
          userexamMainTimer: 0,
        },
      ]);

      const url = environment.production
        ? environment.apiBaseUrl + "lesson/set-exam-time"
        : "/api/lesson/set-exam-time";
      fetch(url, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
        body: "json=" + dictParameter,
      })
        .then((response) => response.json())
        .then((responseJson) => {
          loading(false);
          onClose();
          navigate("/examList");
        })
        .catch((error) => {
          console.error("Error in lesson/set-exam-time", error);
          loading(false);
        });
    } catch (error) {
      console.error("Error in lesson/set-exam-time", error);
      loading(false);
    }
  };

  const submitExamApi = (ansImage: string) => {
    try {
      const updatedArrAnswers = arrAnswers.map((answer) => {
        if (
          ansImage &&
          (answer.answerAnswer === "" ||
            answer.answerAnswer === undefined ||
            answer.answerAnswer === null)
        ) {
          return { ...answer, answerAnswer: ansImage };
        } else {
          return answer;
        }
      });

      const dictParameter = JSON.stringify([
        {
          loginuserID: userId,
          languageID: "1",
          apiType: "Android",
          apiVersion: "1.0",
          lessonID: lessionId,
          examID: examID,
          totalQuestions: totalQuestions,
          totalAnswered: examSummary.totalAnsweredQuestions,
          userlessionCorrectAnswers: "0",
          userlessionWrongAnswers: "0",
          answers: updatedArrAnswers,
        },
      ]);

      const url = environment.production
        ? environment.apiBaseUrl + "lesson/submit-answers"
        : "/api/lesson/submit-answers";
      fetch(url, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
        body: "json=" + dictParameter,
      })
        .then((response) => response.json())
        .then((responseJson) => {
          if (examID == 0) {
            loading(false);
            onClose();
            navigate("/NewHome");
          } else {
            setExamTimeApi();
          }
        })
        .catch((error) => {
          console.error("Error in lesson/submit-answers", error);
          loading(false);
        });
    } catch (error) {
      console.error("Error in lesson/submit-answers", error);
      loading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl border-4 border-primary relative">
        <button
          className="absolute -mt-6 -mr-4 rounded-full bg-white p-2"
          onClick={onClose}
        >
          X
        </button>
        <div className="font-bold text-black mb-4">Exam Summary</div>
        <div className="flex justify-between mb-4">
          <div>Total Questions</div>
          <div className="text-primary">{examSummary.totalQuestions}</div>
        </div>
        <div className="w-full h-1 bg-gray-300 mb-4"></div>

        <div className="flex justify-between mb-4">
          <div>Not Answered Questions</div>
          <div className="text-primary">
            {examSummary.notAnsweredQuestions + examSummary.notVisitedQuestions}
          </div>
        </div>
        <div className="w-full h-1 bg-gray-300 mb-4"></div>

        <div className="flex justify-between mb-4">
          <div>Mark For Review Questions</div>
          <div className="text-primary">
            {examSummary.markForReviewQuestions}
          </div>
        </div>
        <div className="w-full h-1 bg-gray-300 mb-4"></div>

        <div className="flex justify-between mb-4">
          <div>Total Answered Questions</div>
          <div className="text-primary">
            {examSummary.totalAnsweredQuestions}
          </div>
        </div>

        <div className="text-black mb-2">
          Would you like to submit the test?
        </div>
        <div className="text-sm text-gray-600 mb-2 -mt-2">
          Please make sure you have answered all questions before submitting.
        </div>

        <button
          onClick={uploadImageToServer}
          className="bg-primary text-white px-4 py-2 rounded-lg w-full"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default ExamSubmitPopup;
