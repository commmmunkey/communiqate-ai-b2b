import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useStore } from "@/store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "./ConfirmationModal";
import PdfPopUp from "./PdfPopUp";
import roundOrange from "../assets/round_orange.png";
import icHomeRead from "../assets/ic_home_read.png";
import icHomeWriting from "../assets/ic_home_writing.png";
import icHomeListening from "../assets/ic_home_listening.png";
import icHomeTalking from "../assets/ic_home_talking.png";

interface Exam {
  examID: number;
  examName: string;
  examDuration: string;
  userexamReadingSubmitted: string;
  userexamWritingSubmitted: string;
  userexamListeningSubmitted: string;
  userexamSpeakingSubmitted: string;
  userexampercentage: string;
  modules: any[][];
  [key: string]: any;
}

interface PreExamModalProps {
  onClose: () => void;
  exam: Exam;
}

interface TimeState {
  h: string;
  m: string;
  s: string;
}

interface Module {
  moduleName: string;
  moduleID: number;
  isSelected: boolean;
  color: string;
  selIcon: string;
  isSubmitted: string;
}

const PreExamModal = ({ onClose, exam }: PreExamModalProps) => {
  const navigate = useNavigate();
  const { moduleIds, setArrQuestions } = useStore();

  const parseDuration = (duration: string): TimeState => {
    const parts = duration.split(":").map((part) => part.padStart(2, "0"));
    return {
      h: parts[0] || "00",
      m: parts[1] || "00",
      s: parts[2] || "00",
    };
  };

  const [modules, setModules] = useState<Module[]>([
    {
      moduleName: "Reading",
      moduleID: moduleIds[0] || 0,
      isSelected: true,
      color: "rgb(82,240,157)",
      selIcon: icHomeRead,
      isSubmitted: exam.userexamReadingSubmitted,
    },
    {
      moduleName: "Writing",
      moduleID: moduleIds[1] || 0,
      isSelected: false,
      color: "#E7A5FF",
      selIcon: icHomeWriting,
      isSubmitted: exam.userexamWritingSubmitted,
    },
    {
      moduleName: "Listening",
      moduleID: moduleIds[2] || 0,
      isSelected: false,
      color: "#FFC700",
      selIcon: icHomeListening,
      isSubmitted: exam.userexamListeningSubmitted,
    },
    {
      moduleName: "Speaking",
      moduleID: moduleIds[3] || 0,
      isSelected: false,
      color: "#37ADFF",
      selIcon: icHomeTalking,
      isSubmitted: exam.userexamSpeakingSubmitted,
    },
  ]);

  const [time, setTime] = useState<TimeState>(parseDuration(exam.examDuration));
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [isLessonPDFWatch, setIsLessonPDFWatch] = useState(false);
  const [attempts, setAttempts] = useState(5);

  const ex = exam.modules?.[2];
  const pdfUrl = ex?.[0]?.queFile || "";

  useEffect(() => {
    const savedAttempts = localStorage.getItem(`exam_${exam.examID}_attempts`);
    if (savedAttempts !== null) {
      setAttempts(parseInt(savedAttempts, 10));
    } else {
      localStorage.setItem(`exam_${exam.examID}_attempts`, String(attempts));
    }

    const savedTime = localStorage.getItem(`exam_${exam.examID}_time`);
    const savedStartTime = localStorage.getItem(
      `exam_${exam.examID}_startTime`,
    );
    if (savedTime && savedStartTime) {
      const currentTime = new Date().getTime();
      const elapsedTime = Math.floor(
        (currentTime - parseInt(savedStartTime, 10)) / 1000,
      );
      const savedDuration = JSON.parse(savedTime) as TimeState;
      const remainingTimeInSeconds =
        parseInt(savedDuration.h, 10) * 3600 +
        parseInt(savedDuration.m, 10) * 60 +
        parseInt(savedDuration.s, 10) -
        elapsedTime;
      if (remainingTimeInSeconds > 0) {
        setTime({
          h: String(Math.floor(remainingTimeInSeconds / 3600)).padStart(2, "0"),
          m: String(Math.floor((remainingTimeInSeconds % 3600) / 60)).padStart(
            2,
            "0",
          ),
          s: String(remainingTimeInSeconds % 60).padStart(2, "0"),
        });
        setTimerStarted(true);
        startTimer(remainingTimeInSeconds);
      } else {
        setTime({ h: "00", m: "00", s: "00" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam.examID]);

  useEffect(() => {
    if (time.h === "00" && time.m === "00" && time.s === "00") {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    } else if (timerStarted) {
      localStorage.setItem(`exam_${exam.examID}_time`, JSON.stringify(time));
    }
  }, [time, exam.examID, timerStarted, intervalId]);

  const startTimer = (initialTimeInSeconds: number | null = null) => {
    const totalTimeInSeconds =
      initialTimeInSeconds !== null
        ? initialTimeInSeconds
        : parseInt(time.h, 10) * 3600 +
          parseInt(time.m, 10) * 60 +
          parseInt(time.s, 10);
    localStorage.setItem(
      `exam_${exam.examID}_startTime`,
      String(new Date().getTime()),
    );

    const id = window.setInterval(() => {
      let currentTotal = totalTimeInSeconds;
      const savedTime = localStorage.getItem(`exam_${exam.examID}_time`);
      if (savedTime) {
        const savedDuration = JSON.parse(savedTime) as TimeState;
        currentTotal =
          parseInt(savedDuration.h, 10) * 3600 +
          parseInt(savedDuration.m, 10) * 60 +
          parseInt(savedDuration.s, 10);
      }

      currentTotal -= 1;
      if (currentTotal <= 0) {
        clearInterval(id);
        setTime({ h: "00", m: "00", s: "00" });
        setIntervalId(null);
      } else {
        const h = Math.floor(currentTotal / 3600)
          .toString()
          .padStart(2, "0");
        const m = Math.floor((currentTotal % 3600) / 60)
          .toString()
          .padStart(2, "0");
        const s = (currentTotal % 60).toString().padStart(2, "0");
        setTime({ h, m, s });
      }
    }, 1000);
    setIntervalId(id);
    setTimerStarted(true);
  };

  const handleModuleClick = (moduleName: string) => {
    localStorage.setItem(
      "isReadingSubmittedExam",
      exam.userexamReadingSubmitted,
    );
    localStorage.setItem(
      "isWrittngSubmittedExam",
      exam.userexamWritingSubmitted,
    );
    localStorage.setItem(
      "isSpeakingSubmittedExam",
      exam.userexamSpeakingSubmitted,
    );
    localStorage.setItem(
      "isListeningSubmittedExam",
      exam.userexamListeningSubmitted,
    );
    if (!timerStarted) {
      startTimer();
    }
    if (moduleName === "Reading") {
      setArrQuestions(exam.modules[2] || []);
      setIsLessonPDFWatch(true);
    } else if (moduleName === "Writing") {
      setArrQuestions(exam.modules[0] || []);
      navigate("/test");
    } else if (moduleName === "Listening") {
      setArrQuestions(exam.modules[3] || []);
      navigate("/test");
    } else {
      setArrQuestions(exam.modules[1] || []);
      navigate("/test");
    }
  };

  const handleConfirm = () => {
    setIsConfirmModalOpen(false);
    startTimer();
  };

  const handleCancel = () => {
    setIsConfirmModalOpen(false);
  };

  const closePdf = () => {
    setIsLessonPDFWatch(false);
  };

  const startAnswering = () => {
    navigate("/test");
  };

  const handleTryAgain = () => {
    if (attempts > 0) {
      const newAttempts = attempts - 1;
      setAttempts(newAttempts);
      localStorage.setItem(`exam_${exam.examID}_attempts`, String(newAttempts));
      setTime(parseDuration(exam.examDuration));
      setTimerStarted(false);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }
  };

  const isEvaluationPending =
    exam.userexamReadingSubmitted === "Yes" &&
    exam.userexamListeningSubmitted === "Yes" &&
    exam.userexamWritingSubmitted === "Yes" &&
    exam.userexamSpeakingSubmitted === "Yes" &&
    exam.userexampercentage === "0.00";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center items-center my-4 w-24 h-24 border border-primary rounded-full mx-auto">
          {isEvaluationPending ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                className="absolute w-full h-full object-contain"
                src={roundOrange}
                alt="Evaluation Pending"
              />
              <div className="absolute text-center text-white font-bold text-sm">
                Evaluation Pending
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="text-md font-bold">{`${time.h}:${time.m}:${time.s}`}</div>
              <div className="text-xs">Time remaining</div>
            </div>
          )}
        </div>
        {modules.map((item, index) => (
          <div
            key={index}
            className={`p-2.5 rounded mb-2.5 border border-gray-300 flex items-center justify-between ${
              time.h === "00" && time.m === "00" && time.s === "00"
                ? ""
                : item.isSubmitted !== "Yes" && "cursor-pointer"
            }`}
            style={{ backgroundColor: item.color }}
            onClick={() => {
              if (time.h === "00" && time.m === "00" && time.s === "00") {
                return;
              }
              if (item.isSubmitted !== "Yes") {
                handleModuleClick(item.moduleName);
              }
            }}
          >
            <div className="flex items-center">
              <img
                src={item.selIcon}
                className="h-9 w-9 object-contain rounded mr-2.5"
                alt={item.moduleName}
              />
              <span>{item.moduleName}</span>
            </div>
            {item.isSubmitted === "Yes" && (
              <span className="text-sm text-white font-semibold">
                Submitted
              </span>
            )}
          </div>
        ))}
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
        {isLessonPDFWatch && pdfUrl && (
          <PdfPopUp
            pdfUrl={pdfUrl}
            onClose={closePdf}
            onStartAnswering={startAnswering}
          />
        )}
        {!isEvaluationPending && (
          <div className="flex flex-col items-center mt-4">
            {(time.h === "00" && time.m === "00" && time.s === "00") ||
            isEvaluationPending ? (
              <>
                {attempts > 0 ? (
                  <>
                    <Button
                      onClick={handleTryAgain}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold"
                    >
                      Try Again
                    </Button>
                    <p className="mt-2 text-sm text-gray-600">
                      Attempts Remaining: {attempts}
                    </p>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-red-500 font-bold">
                      Sorry, no more attempts left
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PreExamModal;
