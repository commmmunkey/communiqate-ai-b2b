import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "@/store";
import PdfPopUp from "./components/PdfPopUp";
import ExamSubmitPopup from "./components/ExamSubmitPopup";
import InfoIcon from "./assets/info_header_black.png";
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
};

const LUTest = () => {
  const navigate = useNavigate();
  const { arrQuestions, moduleIds, moduleId, lessonId } = useStore();

  // Theme vars
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

  const questions = useMemo<Question[]>(
    () => (arrQuestions as any) ?? [],
    [arrQuestions]
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
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  // Question nav and answers
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, number>
  >({});
  const [answers, setAnswers] = useState<string[]>(
    Array.from({ length: questions.length || 0 }, () => "")
  );
  const [questionBgColors, setQuestionBgColors] = useState<string[]>(
    Array.from({ length: questions.length || 0 }, () => "bg-gray-200")
  );
  useEffect(() => {
    // sync when questions load
    setAnswers(Array.from({ length: questions.length || 0 }, () => ""));
    setQuestionBgColors(
      Array.from({ length: questions.length || 0 }, () => "bg-gray-200")
    );
  }, [questions.length]);

  const onSelectMCQ = (index: number) => {
    // console.log('MCQ INDEX', index);
    setSelectedOptions((prev) => ({ ...prev, [currentQuestion]: index }));
    const updated = [...answers];
    updated[currentQuestion - 1] = `Option${index + 1}`;
    setAnswers(updated);
  };

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    let intervalId: number | undefined;
    if (isRecording) {
      intervalId = window.setInterval(
        () => setRecordingTime((t) => t + 1),
        1000
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
      "0"
    )}`;
  };
  const startRecording = async () => {
    try {
      // @ts-expect-error browser API
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
        setAudioBlob(blob);
        setBlobUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
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

  // Attachments
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setUploadedImages([String(ev.target?.result || "")]);
      reader.readAsDataURL(file);
      setAvatar(file);
    }
  };
  const removeImage = (i: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== i));
  };
  const [avatar, setAvatar] = useState<File | null>(null);

  // PDF popup
  const [isLessonPDFWatch, setIsLessonPDFWatch] = useState(false);
  const handlePdfClick = (flag: boolean) => setIsLessonPDFWatch(flag);

  // Submit/summary
  const [arrAnswers, setArrAnswers] = useState<any[]>([]);
  const [isLoading, setIsloading] = useState(false);
  const examSummary = useMemo(
    () => ({
      totalQuestions: questions.length,
      notVisitedQuestions: questionBgColors.filter((c) => c === "bg-gray-200")
        .length,
      notAnsweredQuestions: questionBgColors.filter((c) => c === "bg-blue-500")
        .length,
      markForReviewQuestions: questionBgColors.filter(
        (c) => c === "bg-yellow-500"
      ).length,
      totalAnsweredQuestions:
        questionBgColors.filter((c) => c === "bg-yellow-500").length +
        questionBgColors.filter((c) => c === "bg-green-500").length,
    }),
    [questionBgColors, questions.length]
  );

  const onSaveNext = () => {
    const q = questions[currentQuestion - 1];
    if (!q) return;
    const updated = [...answers];
    if (q.queType === "MCQ") {
      const idx = selectedOptions[currentQuestion];
      updated[currentQuestion - 1] =
        idx !== undefined ? `Option${idx + 1}` : "";
    }
    setAnswers(updated);
    const answer = {
      answerIsCorrect:
        (q as any).queVerificationRequred === "No"
          ? q.queType === "MCQ" &&
            `Option${selectedOptions[currentQuestion] + 1}` ===
              (q as any).queCorrectAns
            ? "Yes"
            : "No"
          : "Pending",
      answerIsVerified:
        (q as any).queVerificationRequred === "No" ? "Verified" : "Pending",
      queID: q.queID,
      answerAnswer:
        q.queType === "MCQ"
          ? selectedOptions[currentQuestion] !== undefined
            ? `Option${selectedOptions[currentQuestion] + 1}`
            : ""
          : answers[currentQuestion - 1] ?? "",
      answerCorrectAnswer:
        (q as any).queVerificationRequred === "No"
          ? (q as any).queCorrectAns == null
            ? "na"
            : (q as any).queCorrectAns
          : "na",
    };
    setArrAnswers((prev) => [...prev, answer]);
    // color and nav
    if (currentQuestion >= questions.length) {
      setQuestionBgColors((prev) => {
        const copy = [...prev];
        copy[currentQuestion - 1] = "bg-green-500";
        return copy;
      });
      setIsModalOpen(true);
    } else if (
      q.queType === "MCQ" &&
      selectedOptions[currentQuestion] === undefined
    ) {
      // skip coloring, require answer: mark as not answered (blue) and stay?
      setQuestionBgColors((prev) => {
        const copy = [...prev];
        copy[currentQuestion - 1] = "bg-blue-500";
        return copy;
      });
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuestionBgColors((prev) => {
        const copy = [...prev];
        copy[currentQuestion - 1] = "bg-green-500";
        return copy;
      });
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const onSaveMarkReview = () => {
    const q = questions[currentQuestion - 1];
    if (!q) return;
    const updated = [...answers];
    if (q.queType === "MCQ") {
      const idx = selectedOptions[currentQuestion];
      updated[currentQuestion - 1] =
        idx !== undefined ? `Option${idx + 1}` : "";
    }
    setAnswers(updated);
    const answer = {
      answerIsCorrect:
        (q as any).queVerificationRequred === "No"
          ? q.queType === "MCQ" &&
            `Option${selectedOptions[currentQuestion] + 1}` ===
              (q as any).queCorrectAns
            ? "Yes"
            : "No"
          : "Pending",
      answerIsVerified:
        (q as any).queVerificationRequred === "No" ? "Verified" : "Pending",
      queID: q.queID,
      answerAnswer:
        q.queType === "MCQ"
          ? selectedOptions[currentQuestion] !== undefined
            ? `Option${selectedOptions[currentQuestion] + 1}`
            : ""
          : answers[currentQuestion - 1] ?? "",
      answerCorrectAnswer:
        (q as any).queVerificationRequred === "No"
          ? (q as any).queCorrectAns == null
            ? "na"
            : (q as any).queCorrectAns
          : "na",
    };
    setArrAnswers((prev) => [...prev, answer]);
    if (currentQuestion >= questions.length) {
      setQuestionBgColors((prev) => {
        const copy = [...prev];
        copy[currentQuestion - 1] = "bg-yellow-500";
        return copy;
      });
      setIsModalOpen(true);
    } else {
      setQuestionBgColors((prev) => {
        const copy = [...prev];
        copy[currentQuestion - 1] = "bg-yellow-500";
        return copy;
      });
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const onSkipNext = () => {
    setQuestionBgColors((prev) => {
      const copy = [...prev];
      copy[currentQuestion - 1] = "bg-blue-500";
      return copy;
    });
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
    <div className="flex flex-col items-center justify-center p-3 max-w-screen-md mx-auto">
      {/* Timer and PDF button */}
      <div className="flex justify-between items-center mb-4 w-full">
        <div className="text-2xl font-semibold">
          Time Remaining: {formatTime(timeRemaining)}
        </div>
        {(String(questions?.[0]?.moduleID) === String(moduleIds?.[1]) ||
          String(questions?.[0]?.moduleID) === String(moduleIds?.[3])) && (
          <div className="flex items-center">
            <button
              className="ml-4"
              onClick={() => handlePdfClick(true)}
              aria-label="Open PDF"
            >
              <img src={InfoIcon} alt="Open PDF" className="w-10 h-10" />
            </button>
          </div>
        )}
      </div>

      {/* Question numbers */}
      <div className="flex space-x-4 mb-4">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`w-10 h-10 flex items-center justify-center rounded-full cursor-pointer ${
              currentQuestion === index + 1 ? "text-primary" : "text-gray-600 "
            } ${questionBgColors[index]}`}
            onClick={() => setCurrentQuestion(index + 1)}
          >
            {index + 1}
          </div>
        ))}
      </div>

      <div className="w-full h-1 bg-gray-300 mb-4"></div>

      {/* Question body */}
      <div className="w-full">
        <div className="text-lg text-primary font-bold mb-2">
          Question {currentQuestion}
        </div>
        <div className="text-lg font-bold mb-2">
          {questions.length > 0
            ? questions[currentQuestion - 1].queQuestion
            : ""}
        </div>
        <div className="mb-4">
          {questions[currentQuestion - 1]?.queType === "MCQ" ? (
            <div className="options-container">
              {["queOption1", "queOption2", "queOption3", "queOption4"]
                .map((key) => (questions[currentQuestion - 1] as any)[key])
                .filter((v) => !!v)
                .map((value, index) => (
                  <div
                    key={index}
                    className={`option flex items-center p-2 m-1 border border-gray-300 rounded-lg cursor-pointer ${
                      selectedOptions[currentQuestion] === index
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-800 hover:bg-gray-100"
                    }`}
                    onClick={() => onSelectMCQ(index)}
                  >
                    <span
                      className={`font-bold ${
                        selectedOptions[currentQuestion] === index
                          ? "text-white"
                          : "text-primary"
                      } mr-2`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="option-text">{value}</span>
                  </div>
                ))}
            </div>
          ) : questions[currentQuestion - 1]?.queType === "Audio" ? (
            <div className="audio-container flex items-center justify-center flex-col">
              <button
                className={`px-4 py-2 text-sm font-semibold rounded-full shadow transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${
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
              {blobUrl && (
                <div className="mt-4">
                  <audio ref={audioRef} src={blobUrl} controls />
                </div>
              )}
            </div>
          ) : (
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 h-40 resize-none"
              placeholder="Type your answer here..."
              value={answers[currentQuestion - 1] ?? ""}
              onChange={(e) => {
                const arr = [...answers];
                arr[currentQuestion - 1] = e.target.value;
                setAnswers(arr);
              }}
            ></textarea>
          )}
        </div>

        {/* Listening audio (legacy condition used moduleIDs[2]/[0]; simplified to play queFile if present) */}
        {questions[0]?.queFile && (
          <audio className="m-2" src={questions[0].queFile} controls />
        )}
      </div>

      {/* Attach Button for writing/speaking types (legacy modules 7/9) */}
      {(String(questions?.[0]?.moduleID) === String(moduleIds?.[1]) ||
        String(questions?.[0]?.moduleID) === String(moduleIds?.[3])) && (
        <div className="flex items-center self-start">
          <label
            htmlFor="imageUploadButton"
            className="flex items-center self-start border border-gray-300 rounded-lg p-2 shadow-md cursor-pointer mb-4"
          >
            <img
              src={AttachIcon}
              alt="Attachment"
              className="w-8 h-8 cursor-pointer"
            />
            <span className="text-primary mr-2">Attach</span>
          </label>
          <input
            type="file"
            id="imageUploadButton"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      )}

      {/* Uploaded images */}
      <div className="flex mb-4">
        {uploadedImages.map((image, index) => (
          <div key={index} className="relative mr-4">
            <img
              src={image}
              alt="Uploaded"
              className="w-20 h-20 cursor-pointer"
            />
            <button
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
              onClick={() => removeImage(index)}
            >
              X
            </button>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-between w-full">
        <button
          className="bg-[#ED3C5C] text-white px-4 py-2 rounded-lg shadow-md mr-4"
          onClick={() => {
            // clear current response
            const arr = [...answers];
            arr[currentQuestion - 1] = "";
            setAnswers(arr);
            setSelectedOptions((prev) => {
              const copy = { ...prev };
              delete copy[currentQuestion];
              return copy;
            });
          }}
        >
          Clear Response
        </button>
        <button
          className="bg-[#32BF89] text-white px-4 py-2 rounded-lg shadow-md"
          onClick={onSaveNext}
        >
          Save & Next
        </button>
      </div>

      {(String(questions?.[0]?.moduleID) === String(moduleIds?.[1]) ||
        String(questions?.[0]?.moduleID) === String(moduleIds?.[3])) && (
        <div className="flex justify-between w-full mt-2">
          <button
            className="bg-[#D6B143] text-white px-4 py-2 rounded-lg shadow-md mr-4"
            onClick={onSaveMarkReview}
          >
            Save & Mark for review
          </button>
          <button
            className="bg-[#0C78DC] text-white px-4 py-2 rounded-lg shadow-md"
            onClick={onSkipNext}
          >
            Skip & Next
          </button>
        </div>
      )}

      {isLessonPDFWatch && questions[0]?.queFile && (
        <PdfPopUp
          pdfUrl={questions[0].queFile}
          onClose={() => handlePdfClick(false)}
        />
      )}

      {isModalOpen && (
        <ExamSubmitPopup
          onClose={() => setIsModalOpen(false)}
          examSummary={examSummary}
          lessionId={lessonId}
          totalQuestions={questions.length}
          arrAnswers={arrAnswers}
          isAudio={!!audioBlob}
          ImageUri={audioBlob ?? avatar}
          lengthOfFile={(audioBlob ? 1 : 0) + uploadedImages.length}
          loading={setIsloading}
          examID={Number(questions[0]?.examID || 0)}
          moduleId={Number(questions[0]?.moduleID || moduleId)}
        />
      )}
    </div>
  );
};

export default LUTest;
