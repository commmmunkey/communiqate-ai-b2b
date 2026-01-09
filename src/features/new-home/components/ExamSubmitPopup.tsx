import { useNavigate } from "react-router";
import { useStore } from "@/store";
import { API_BASE_URL } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

  const userId = localStorage.getItem("USER_ID");
  const isReadingSubmittedExam = localStorage.getItem("isReadingSubmittedExam");
  const isWrittngSubmittedExam = localStorage.getItem("isWrittngSubmittedExam");
  const isSpeakingSubmittedExam = localStorage.getItem(
    "isSpeakingSubmittedExam",
  );
  const isListeningSubmittedExam = localStorage.getItem(
    "isListeningSubmittedExam",
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
        ]),
      );

      const url = `${API_BASE_URL}users/file-upload`;
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

      const url = `${API_BASE_URL}lesson/set-exam-time`;
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

      const url = `${API_BASE_URL}lesson/submit-answers`;
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
            navigate("/");
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Exam Summary</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="flex justify-between items-center">
            <div className="text-base">Total Questions</div>
            <div className="text-primary font-semibold">
              {examSummary.totalQuestions}
            </div>
          </div>
          <div className="w-full h-px bg-gray-300"></div>

          <div className="flex justify-between items-center">
            <div className="text-base">Not Answered Questions</div>
            <div className="text-primary font-semibold">
              {examSummary.notAnsweredQuestions +
                examSummary.notVisitedQuestions}
            </div>
          </div>
          <div className="w-full h-px bg-gray-300"></div>

          <div className="flex justify-between items-center">
            <div className="text-base">Mark For Review Questions</div>
            <div className="text-primary font-semibold">
              {examSummary.markForReviewQuestions}
            </div>
          </div>
          <div className="w-full h-px bg-gray-300"></div>

          <div className="flex justify-between items-center">
            <div className="text-base">Total Answered Questions</div>
            <div className="text-primary font-semibold">
              {examSummary.totalAnsweredQuestions}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-medium text-foreground text-base">
            Would you like to submit the test?
          </p>
          <p className="text-sm text-muted-foreground">
            Please make sure you have answered all questions before submitting.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={uploadImageToServer}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExamSubmitPopup;

