import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useStore } from "@/store";
import PdfPopUp from "./components/PdfPopUp";
import ExamSubmitPopup from "./components/ExamSubmitPopup";
import AudioPopUp from "./components/AudioPopUp";
import AttachIcon from "./assets/attachment.png";

type Question = {
  queID: number;
  queQuestion: string;
  queType: "MCQ" | "Audio" | "Text" | string;
  queOption1?: string;
  queOption2?: string;
  queOption3?: string;
  queOption4?: string;
  queFile?: string;
  lessionID?: number;
  examID?: number;
  moduleID?: number | string;
  queCorrectAns?: string;
  queVerificationRequred?: string;
};

// File type detection utilities
const isPdfFile = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes(".pdf") || lowerUrl.includes("application/pdf");
};

const isAudioFile = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const audioExtensions = [
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".aac",
    ".webm",
    ".mp4",
  ];
  return audioExtensions.some((ext) => lowerUrl.includes(ext));
};

type QuestionStatus = "not-visited" | "answered" | "review" | "not-answered";

const LUTest = () => {
  const { arrQuestions, moduleIds, moduleId, lessonId } = useStore();

  const questions = useMemo<Question[]>(
    () => (arrQuestions as Question[]) ?? [],
    [arrQuestions],
  );

  // Timer: default 1 hour
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          setIsModalOpen(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(seconds).padStart(2, "0")}`;
  };

  // Question nav and answers - using queID as keys
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, number>
  >({}); // key: queID, value: option index (0-based)
  const [answers, setAnswers] = useState<Record<number, string>>({}); // key: queID, value: answer string
  const [questionStatus, setQuestionStatus] = useState<
    Record<number, QuestionStatus>
  >({}); // key: queID, value: status

  // Initialize question status when questions load
  useEffect(() => {
    const initialStatus: Record<number, QuestionStatus> = {};
    questions.forEach((q) => {
      setQuestionStatus((prev) => {
        if (!prev[q.queID]) {
          initialStatus[q.queID] = "not-visited";
        }
        return prev;
      });
    });
    if (Object.keys(initialStatus).length > 0) {
      setQuestionStatus((prev) => ({ ...prev, ...initialStatus }));
    }
  }, [questions]);

  // Get current question object
  const currentQuestionObj = useMemo(() => {
    return questions[currentQuestion - 1] || null;
  }, [questions, currentQuestion]);

  // Get status color for question
  const getStatusColor = (queID: number): string => {
    const status = questionStatus[queID] || "not-visited";
    switch (status) {
      case "answered":
        return "bg-green-500";
      case "review":
        return "bg-yellow-500";
      case "not-answered":
        return "bg-blue-500";
      default:
        return "bg-gray-200";
    }
  };

  const onSelectMCQ = (index: number) => {
    if (!currentQuestionObj) return;
    const queID = currentQuestionObj.queID;
    setSelectedOptions((prev) => ({ ...prev, [queID]: index }));
    setAnswers((prev) => ({ ...prev, [queID]: `Option${index + 1}` }));
  };

  // Audio recording - per question
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlobs, setAudioBlobs] = useState<Record<number, Blob>>({}); // key: queID
  const [blobUrls, setBlobUrls] = useState<Record<number, string>>({}); // key: queID
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let intervalId: number | undefined;
    if (isRecording) {
      intervalId = window.setInterval(
        () => setRecordingTime((t) => t + 1),
        1000,
      );
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isRecording]);

  const formatTimeVoice = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}`;
  };

  const startRecording = async () => {
    if (!currentQuestionObj) return;
    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e: BlobEvent) => {
        chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const queID = currentQuestionObj.queID;
        setAudioBlobs((prev) => ({ ...prev, [queID]: blob }));
        setBlobUrls((prev) => ({
          ...prev,
          [queID]: URL.createObjectURL(blob),
        }));
        stream.getTracks().forEach((t) => {
          t.stop();
        });
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Failed to start recording", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Attachments - per question
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<number, Array<{ url: string; file: File; type: string }>>
  >({}); // key: queID, value: array of files

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentQuestionObj) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const queID = currentQuestionObj.queID;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const fileData = {
        url: String(ev.target?.result || ""),
        file: file,
        type: file.type,
      };
      setUploadedFiles((prev) => ({
        ...prev,
        [queID]: [...(prev[queID] || []), fileData],
      }));
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = "";
  };

  const removeFile = (queID: number, index: number) => {
    setUploadedFiles((prev) => {
      const files = prev[queID] || [];
      const updated = files.filter((_, idx) => idx !== index);
      if (updated.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [queID]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [queID]: updated };
    });
  };

  // Get files for current question
  const currentQuestionFiles = useMemo(() => {
    if (!currentQuestionObj) return [];
    return uploadedFiles[currentQuestionObj.queID] || [];
  }, [currentQuestionObj, uploadedFiles]);

  // PDF and Audio popups - per question
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);

  const handlePdfClick = (flag: boolean) => setIsPdfOpen(flag);
  const handleAudioClick = (flag: boolean) => setIsAudioOpen(flag);

  // Get current question file info
  const currentQuestionFile = useMemo(() => {
    if (!currentQuestionObj?.queFile) return null;
    const fileUrl = currentQuestionObj.queFile;
    if (isPdfFile(fileUrl)) {
      return { type: "pdf", url: fileUrl };
    } else if (isAudioFile(fileUrl)) {
      return { type: "audio", url: fileUrl };
    }
    return null;
  }, [currentQuestionObj]);

  // Submit/summary
  const [arrAnswers, setArrAnswers] = useState<
    Record<
      number,
      {
        answerIsCorrect: string;
        answerIsVerified: string;
        queID: number;
        answerAnswer: string;
        answerCorrectAnswer: string;
      }
    >
  >({}); // key: queID
  const [isLoading, setIsloading] = useState(false);

  const examSummary = useMemo(() => {
    const statuses = Object.values(questionStatus);
    return {
      totalQuestions: questions.length,
      notVisitedQuestions: statuses.filter((s) => s === "not-visited").length,
      notAnsweredQuestions: statuses.filter((s) => s === "not-answered").length,
      markForReviewQuestions: statuses.filter((s) => s === "review").length,
      totalAnsweredQuestions: statuses.filter(
        (s) => s === "answered" || s === "review",
      ).length,
    };
  }, [questionStatus, questions.length]);

  // Helper to update answer in arrAnswers
  const updateAnswer = (
    queID: number,
    answer: {
      answerIsCorrect: string;
      answerIsVerified: string;
      queID: number;
      answerAnswer: string;
      answerCorrectAnswer: string;
    },
  ) => {
    setArrAnswers((prev) => ({ ...prev, [queID]: answer }));
  };

  // Helper to get answer for a question
  const getAnswerForQuestion = (queID: number): string => {
    if (selectedOptions[queID] !== undefined) {
      return `Option${selectedOptions[queID] + 1}`;
    }
    return answers[queID] || "";
  };

  const onSaveNext = () => {
    if (!currentQuestionObj) return;
    const q = currentQuestionObj;
    const queID = q.queID;

    const answerValue = getAnswerForQuestion(queID);
    const selectedOptionIndex = selectedOptions[queID];

    // For MCQ questions, option selection is mandatory
    if (q.queType === "MCQ" && selectedOptionIndex === undefined) {
      toast.warning("Please select an option before proceeding.");
      return;
    }

    const answer = {
      answerIsCorrect:
        q.queVerificationRequred === "No"
          ? q.queType === "MCQ" &&
            selectedOptionIndex !== undefined &&
            `Option${selectedOptionIndex + 1}` === q.queCorrectAns
            ? "Yes"
            : "No"
          : "Pending",
      answerIsVerified:
        q.queVerificationRequred === "No" ? "Verified" : "Pending",
      queID: queID,
      answerAnswer: answerValue,
      answerCorrectAnswer:
        q.queVerificationRequred === "No"
          ? q.queCorrectAns == null
            ? "na"
            : q.queCorrectAns
          : "na",
    };

    updateAnswer(queID, answer);

    // Update question status
    if (q.queType === "MCQ" && selectedOptionIndex === undefined) {
      setQuestionStatus((prev) => ({ ...prev, [queID]: "not-answered" }));
    } else if (answerValue) {
      setQuestionStatus((prev) => ({ ...prev, [queID]: "answered" }));
    } else {
      setQuestionStatus((prev) => ({ ...prev, [queID]: "not-answered" }));
    }

    // Navigate to next question or show modal
    if (currentQuestion >= questions.length) {
      setIsModalOpen(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const onSaveMarkReview = () => {
    if (!currentQuestionObj) return;
    const q = currentQuestionObj;
    const queID = q.queID;

    const answerValue = getAnswerForQuestion(queID);
    const selectedOptionIndex = selectedOptions[queID];

    // For MCQ questions, option selection is mandatory
    if (q.queType === "MCQ" && selectedOptionIndex === undefined) {
      toast.warning("Please select an option before marking for review.");
      return;
    }

    const answer = {
      answerIsCorrect:
        q.queVerificationRequred === "No"
          ? q.queType === "MCQ" &&
            selectedOptionIndex !== undefined &&
            `Option${selectedOptionIndex + 1}` === q.queCorrectAns
            ? "Yes"
            : "No"
          : "Pending",
      answerIsVerified:
        q.queVerificationRequred === "No" ? "Verified" : "Pending",
      queID: queID,
      answerAnswer: answerValue,
      answerCorrectAnswer:
        q.queVerificationRequred === "No"
          ? q.queCorrectAns == null
            ? "na"
            : q.queCorrectAns
          : "na",
    };

    updateAnswer(queID, answer);
    setQuestionStatus((prev) => ({ ...prev, [queID]: "review" }));

    if (currentQuestion >= questions.length) {
      setIsModalOpen(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const onSkipNext = () => {
    if (!currentQuestionObj) return;
    const queID = currentQuestionObj.queID;
    setQuestionStatus((prev) => ({ ...prev, [queID]: "not-answered" }));

    if (currentQuestion >= questions.length) {
      setIsModalOpen(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  return isLoading ? (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Processing your request...</p>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center min-h-screen p-3">
      <div className="flex flex-col items-center w-full max-w-3xl">
        {/* Timer */}
        <div className="flex justify-between items-center mb-4 w-full">
          <div className="text-2xl font-semibold">
            Time Remaining: {formatTime(timeRemaining)}
          </div>
          {currentQuestionFile && currentQuestionFile.type === "pdf" && (
            <div className="flex items-center">
              <button
                type="button"
                className="ml-4 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => handlePdfClick(true)}
                aria-label="Open PDF"
              >
                View PDF
              </button>
            </div>
          )}
        </div>

        {/* Question numbers */}
        <div className="flex flex-wrap gap-2 mb-4">
          {questions.map((q, index) => {
            const isCurrent = currentQuestion === index + 1;
            const statusColor = getStatusColor(q.queID);
            return (
              <button
                type="button"
                key={q.queID}
                className={`w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-colors ${
                  isCurrent
                    ? "ring-2 ring-primary ring-offset-2 text-primary font-bold"
                    : "text-gray-600"
                } ${statusColor}`}
                onClick={() => setCurrentQuestion(index + 1)}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <div className="w-full h-1 bg-gray-300 mb-4"></div>

        {/* Question body */}
        <div className="w-full">
          <div className="text-lg text-primary font-bold mb-2">
            Question {currentQuestion}
          </div>
          <div className="text-lg font-bold mb-4">
            {currentQuestionObj?.queQuestion || ""}
          </div>
          <div className="mb-4">
            {currentQuestionObj?.queType === "MCQ" ? (
              <div className="options-container space-y-2">
                {(
                  [
                    "queOption1",
                    "queOption2",
                    "queOption3",
                    "queOption4",
                  ] as const
                )
                  .map((key) => currentQuestionObj[key])
                  .filter((v): v is string => !!v)
                  .map((value, index) => {
                    const queID = currentQuestionObj.queID;
                    const isSelected = selectedOptions[queID] === index;
                    return (
                      <button
                        type="button"
                        key={`option-${queID}-${value.substring(0, 20)}`}
                        className={`option flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors w-full text-left ${
                          isSelected
                            ? "bg-blue-500 text-white border-blue-600"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        }`}
                        onClick={() => onSelectMCQ(index)}
                      >
                        <span
                          className={`font-bold mr-3 ${
                            isSelected ? "text-white" : "text-blue-600"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="option-text flex-1">{value}</span>
                      </button>
                    );
                  })}
              </div>
            ) : currentQuestionObj?.queType === "Audio" ? (
              <div className="audio-container flex items-center justify-center flex-col">
                <button
                  type="button"
                  className={`px-6 py-3 text-sm font-semibold rounded-full shadow transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-primary hover:bg-primary text-white"
                  }`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </button>
                {isRecording && (
                  <p className="text-lg text-gray-700 mt-4">
                    Recording Time: {formatTimeVoice(recordingTime)}
                  </p>
                )}
                {currentQuestionObj && blobUrls[currentQuestionObj.queID] && (
                  <div className="mt-6 mb-4 w-full">
                    <audio
                      ref={audioRef}
                      src={blobUrls[currentQuestionObj.queID]}
                      controls
                      className="w-full"
                      style={{ minWidth: "100%" }}
                    >
                      <track kind="captions" />
                    </audio>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 h-40 resize-none"
                placeholder="Type your answer here..."
                value={
                  currentQuestionObj
                    ? answers[currentQuestionObj.queID] || ""
                    : ""
                }
                onChange={(e) => {
                  if (!currentQuestionObj) return;
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestionObj.queID]: e.target.value,
                  }));
                }}
              ></textarea>
            )}
          </div>

          {/* Per-question audio file (if queFile is audio) */}
          {currentQuestionFile?.type === "audio" && (
            <div className="mb-6 mt-4 w-full">
              <audio
                className="w-full"
                src={currentQuestionFile.url}
                controls
                style={{ minWidth: "100%" }}
              >
                <track kind="captions" />
              </audio>
            </div>
          )}
        </div>

        {/* Attach Button for writing/speaking types */}
        {(String(currentQuestionObj?.moduleID) === String(moduleIds?.[1]) ||
          String(currentQuestionObj?.moduleID) === String(moduleIds?.[3])) && (
          <div className="flex flex-col self-start mb-4">
            <label
              htmlFor="fileUploadButton"
              className="flex items-center border border-gray-300 rounded-lg p-2 shadow-md cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <img src={AttachIcon} alt="Attachment" className="w-6 h-6 mr-2" />
              <span className="text-primary font-medium">Attach</span>
            </label>
            <input
              type="file"
              id="fileUploadButton"
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* Uploaded files */}
        {currentQuestionFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {currentQuestionFiles.map((fileData, index) => (
              <div
                key={`${currentQuestionObj?.queID}-${index}`}
                className="relative"
              >
                {fileData.type.startsWith("image/") ? (
                  <img
                    src={fileData.url}
                    alt="Uploaded"
                    className="w-20 h-20 object-cover rounded border border-gray-300"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                    <span className="text-xs text-gray-600">File</span>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  onClick={() => {
                    if (currentQuestionObj) {
                      removeFile(currentQuestionObj.queID, index);
                    }
                  }}
                  aria-label="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons - Left: Clear Response, Save & Mark for review | Right: Save & Next, Skip & Next */}
        <div className="flex justify-between items-start w-full gap-4">
          {/* Left side */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="bg-[#ED3C5C] text-white px-6 py-2 rounded-lg shadow-md hover:bg-[#d32f4a] transition-colors w-max"
              onClick={() => {
                if (!currentQuestionObj) return;
                const queID = currentQuestionObj.queID;
                setAnswers((prev) => {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { [queID]: _removed, ...rest } = prev;
                  return rest;
                });
                setSelectedOptions((prev) => {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { [queID]: _removed, ...rest } = prev;
                  return rest;
                });
                setQuestionStatus((prev) => ({
                  ...prev,
                  [queID]: "not-visited",
                }));
              }}
            >
              Clear Response
            </button>
            <button
              type="button"
              className="bg-[#D6B143] text-white px-6 py-2 rounded-lg shadow-md hover:bg-[#c19f3a] transition-colors w-max"
              onClick={onSaveMarkReview}
            >
              Save & Mark for review
            </button>
          </div>

          {/* Right side */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="bg-[#32BF89] text-white px-6 py-2 rounded-lg shadow-md hover:bg-[#2aa876] transition-colors w-max"
              onClick={onSaveNext}
            >
              Save & Next
            </button>
            <button
              type="button"
              className="bg-[#0C78DC] text-white px-6 py-2 rounded-lg shadow-md hover:bg-[#0a6bc4] transition-colors w-max"
              onClick={onSkipNext}
            >
              Skip & Next
            </button>
          </div>
        </div>

        {/* PDF Popup */}
        {isPdfOpen && currentQuestionFile?.type === "pdf" && (
          <PdfPopUp
            pdfUrl={currentQuestionFile.url}
            onClose={() => handlePdfClick(false)}
          />
        )}

        {/* Audio Popup */}
        {isAudioOpen && currentQuestionFile?.type === "audio" && (
          <AudioPopUp
            audioUrl={currentQuestionFile.url}
            onClose={() => handleAudioClick(false)}
          />
        )}

        {/* Submit Modal */}
        {isModalOpen && (
          <ExamSubmitPopup
            onClose={() => setIsModalOpen(false)}
            examSummary={examSummary}
            lessionId={lessonId}
            totalQuestions={questions.length}
            arrAnswers={Object.values(arrAnswers)}
            isAudio={Object.keys(audioBlobs).length > 0}
            ImageUri={
              Object.keys(audioBlobs).length > 0
                ? audioBlobs[Number(Object.keys(audioBlobs)[0])]
                : currentQuestionFiles.length > 0
                  ? currentQuestionFiles[0].file
                  : null
            }
            lengthOfFile={
              Object.keys(audioBlobs).length +
              Object.values(uploadedFiles).reduce(
                (sum, files) => sum + files.length,
                0,
              )
            }
            loading={setIsloading}
            examID={Number(
              currentQuestionObj?.examID || questions[0]?.examID || 0,
            )}
            moduleId={Number(
              currentQuestionObj?.moduleID ||
                questions[0]?.moduleID ||
                moduleId,
            )}
          />
        )}
      </div>
    </div>
  );
};

export default LUTest;
