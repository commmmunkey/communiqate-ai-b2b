import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "@/store";
import { environment } from "../environment";
import VideoPopUp from "./VideoPopUp";
import PdfPopUp from "./PdfPopUp";
import AudioPopUp from "./AudioPopUp";
import EvaluationLoading from "./EvaluationLoading";
import IconFree from "../assets/free.png";
import IconPremium from "../assets/PREMIUM.png";
import IconVideo from "../assets/8.png";
import IconWriting from "../assets/ic_home_writing.png";
import IconSpeaking from "../assets/ic_home_talking.png";
import IconReading from "../assets/ic_home_read.png";
import IconListening from "../assets/ic_home_listening.png";

interface HomeListViewProps {
  item: any;
  isFree: boolean;
  showSkillCategory?: boolean;
}

const HomeListView = ({
  item,
  isFree,
  showSkillCategory = false,
}: HomeListViewProps) => {
  // useEffect(() => {
  // 	const primaryColor = localStorage.getItem('corporate_primary_color') || '#0000ff';
  // 	const secondaryColor = localStorage.getItem('corporate_secondary_color') || '#f5914a';
  // 	const backgroundColor = localStorage.getItem('corporate_background_color') || '#fddaa7';
  // 	const accentColor = localStorage.getItem('corporate_accent_color') || '#e0d4bc';

  // 	document.documentElement.style.setProperty('--primary-color', primaryColor);
  // 	document.documentElement.style.setProperty('--secondary-color', secondaryColor);
  // 	document.documentElement.style.setProperty('--background-color', backgroundColor);
  // 	document.documentElement.style.setProperty('--accent-color', accentColor);
  // }, []);

  const getSkillCategoryColor = (category?: string) => {
    if (!category) return "#6B7280";
    const categoryLower = category.toLowerCase();
    switch (categoryLower) {
      case "communication skills":
      case "communications skills":
        return "#87CEEB";
      case "decision making":
        return "#10B981";
      case "business etiquette":
        return "#8B5CF6";
      case "reading":
        return "#3B82F6";
      case "writing":
        return "#EF4444";
      case "speaking":
        return "#F59E0B";
      case "listening":
        return "#EC4899";
      default:
        return "#FF8C00";
    }
  };

  const getTextColor = (backgroundColor: string) => {
    const lightColors = ["#87CEEB", "#10B981", "#F59E0B", "#FF8C00"];
    return lightColors.includes(backgroundColor) ? "#000000" : "#FFFFFF";
  };

  const [isLessonVideoWatch, setIsLessonVideoWatch] = useState(false);
  const [isLessonPDFWatch, setIsLessonPDFWatch] = useState(false);
  const [isLessonAudioWatch, setIsLessonAudioWatch] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [captions, setCaptions] = useState<
    { src: string; label: string; srclang: string; default?: boolean }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    arrQuestions,
    setArrQuestions,
    setLessonId,
    setModuleId,
    moduleIds,
    setModuleIds,
    setWritingEvaluation,
    setSpeakingEvaluation,
  } = useStore();

  const userId = localStorage.getItem("USER_ID") || "";
  const navigate = useNavigate();
  const moduleIDs = useMemo(
    () =>
      String(item.moduleID || "")
        .split(",")
        .map((id: string) => id.trim()),
    [item.moduleID],
  );
  const onClickLessonVideo = () => {
    // console.log('Clicked', item.LessonFileURL);
    getCaptions();
  };

  const getCaptions = () => {
    try {
      const dictParameter = JSON.stringify([
        { lessionId: item.LessonID, apiType: "Android", apiVersion: "1.0" },
      ]);
      // console.log('params for corporate/subtitle-info', dictParameter);
      fetch(
        environment.production
          ? environment.apiBaseUrl + "corporate/subtitle-info"
          : "/api/corporate/subtitle-info",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
          body: "json=" + dictParameter,
        },
      )
        .then((response) => response.json())
        .then((responseJson) => {
          const status_ = responseJson[0]?.status;
          const data = responseJson[0]?.data || [];
          if (status_ === "true") {
            const transformed = data.map((d: any) => ({
              src: d.subtitleFile,
              label: d.languageName,
              srclang: d.languageCode,
              default: d.languageCode === "en",
            }));
            setCaptions(transformed);
            setIsLessonVideoWatch(true);
          } else {
            // console.log('Error in Fetching captions', responseJson[0]?.message);
            setIsLessonVideoWatch(true);
          }
        });
    } catch (error) {
      // console.log('Error in Fetching captions', error);
      setIsLessonVideoWatch(true);
    }
  };

  const closePopup = () => setIsLessonVideoWatch(false);
  const closePdf = () => setIsLessonPDFWatch(false);
  const closeAudio = () => setIsLessonAudioWatch(false);
  const startAnswering = () => navigate("/LUTest");

  // Helper function to check if file is an audio file
  const isAudioFile = (url: string | null): boolean => {
    if (!url) return false;
    const audioExtensions = [
      ".mp3",
      ".wav",
      ".ogg",
      ".m4a",
      ".aac",
      ".webm",
      ".flac",
    ];
    const lowerUrl = url.toLowerCase();
    return audioExtensions.some((ext) => lowerUrl.includes(ext));
  };

  const getQuestionsApi = (moduleID: string) => {
    try {
      const dictParameter = JSON.stringify([
        {
          loginuserID: userId,
          languageID: "1",
          moduleID,
          lessionID: item.LessonID,
          examID: "0",
          usertype: "Premium",
          apiType: "Android",
          apiVersion: "1.0",
        },
      ]);
      // console.log('params for lesson/get-questions', dictParameter);
      fetch(
        environment.production
          ? environment.apiBaseUrl + "lesson/get-questions"
          : "/api/lesson/get-questions",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
          body: "json=" + dictParameter,
        },
      )
        .then((response) => response.json())
        .then((responseJson) => {
          const arrData = responseJson;
          const status_ = responseJson[0]?.status;
          localStorage.setItem(
            `QuestionsFor${item.LessonID}${moduleID}`,
            JSON.stringify(arrData[0]?.questions?.[0] ?? {}),
          );
          // console.log('lesson/get-questions', responseJson);
          setArrQuestions(arrData[0]?.questions ?? []);
          if (status_ !== "false") {
            const nextFileUrl = arrData[0]?.questions?.[0]?.queFile ?? null;
            if (nextFileUrl == null) {
              navigate("/LUTest");
            } else if (isAudioFile(nextFileUrl)) {
              setAudioUrl(nextFileUrl);
              setIsLessonAudioWatch(true);
            } else {
              setPdfUrl(nextFileUrl);
              setIsLessonPDFWatch(true);
            }
          }
        });
    } catch (error) {
      console.error("Error in Fetching Questions", error);
    }
  };

  const getExamResult = async (moduleID: string) => {
    setIsLoading(true);
    // console.log('=== ITEM DEBUG ===', item);
    setLessonId(Number(item.LessonID));
    setModuleIds(moduleIDs);
    // console.log(userId, 'LessonID', item.LessonID);
    try {
      if (moduleID === moduleIDs[1]) {
        await handleWritingModule(moduleID);
      } else if (moduleID === moduleIDs[3]) {
        await handleSpeakingModule(moduleID);
      } else {
        await handleExistingModule(moduleID);
      }
    } catch (error) {
      console.error("Error handling module:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWritingModule = async (moduleID: string) => {
    try {
      setWritingEvaluation((prev) => ({
        ...prev,
        submission: {
          ...prev.submission,
          lessonId: Number(item.LessonID),
          moduleId: Number(moduleID),
        },
      }));
      setModuleId(Number(moduleID));
      navigate("/WritingModule");
    } catch (error) {
      console.error("Error setting up writing module:", error);
    }
  };

  const handleSpeakingModule = async (moduleID: string) => {
    try {
      try {
        // ensure mic perms
        // @ts-expect-error browser API
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        return;
      }
      setSpeakingEvaluation((prev) => ({
        ...prev,
        submission: {
          ...prev.submission,
          lessonId: Number(item.LessonID),
          moduleId: Number(moduleID),
        },
      }));
      setModuleId(Number(moduleID));
      navigate("/SpeakingModule");
    } catch (error) {
      console.error("Error setting up speaking module:", error);
    }
  };

  const handleExistingModule = async (moduleID: string) => {
    try {
      const dictParameter = JSON.stringify([
        {
          loginuserID: userId,
          languageID: "1",
          lessionID: item.LessonID,
          examID: "0",
          usertype: "Premium",
          apiType: "Android",
          apiVersion: "1.0",
        },
      ]);
      const response = await fetch(
        environment.production
          ? environment.apiBaseUrl + "lesson/get-submitted-answers"
          : "/api/lesson/get-submitted-answers",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
          body: "json=" + dictParameter,
        },
      );
      const responseJson = await response.json();
      // console.log('responseJson of result', responseJson);
      const status = responseJson[0]?.status;
      if (status === "true") {
        const questions = responseJson[0]?.questions ?? [];
        const lesson = responseJson[0]?.lesson ?? {};
        const filteredQuestions = questions.filter(
          (q: any) => String(q.moduleID) === String(moduleID),
        );
        localStorage.setItem(
          "LUResultquestions",
          JSON.stringify(filteredQuestions),
        );
        setModuleId(Number(moduleID));
        if (
          moduleID === moduleIDs[0] &&
          Number(lesson.userlessonReadingcorrectqus) !== 0
        ) {
          localStorage.setItem("LUResultMarks", lesson.userlessonReadingBand);
          localStorage.setItem(
            "LUResultTotalQuestion",
            lesson.userlessonReadingtotalqus,
          );
          localStorage.setItem(
            "LUResultCorrectQuestion",
            lesson.userlessonReadingcorrectqus,
          );
          localStorage.setItem("LUResultModuleId", moduleID);
          navigate("/LUResult");
        } else if (
          moduleID === moduleIDs[2] &&
          Number(lesson.userlessonListeningcorrectqus) !== 0
        ) {
          localStorage.setItem("LUResultMarks", lesson.userlessonListeningBand);
          localStorage.setItem(
            "LUResultTotalQuestion",
            lesson.userlessonListeningtotalqus,
          );
          localStorage.setItem(
            "LUResultCorrectQuestion",
            lesson.userlessonListeningcorrectqus,
          );
          localStorage.setItem("LUResultModuleId", moduleID);
          navigate("/LUResult");
        } else {
          getQuestionsApi(moduleID);
        }
      } else {
        getQuestionsApi(moduleID);
      }
    } catch (error) {
      console.error("Error in Fetching Questions:", error);
    }
  };

  const getModuleIcon = (
    moduleID: string,
    hasScore: boolean,
    score: string,
  ) => {
    const isWriting = moduleID === moduleIDs[1];
    const isSpeaking = moduleID === moduleIDs[3];
    if (hasScore && Number(score) > 0) {
      return (
        <CircleWithPercentage
          percentage={parseFloat(score)}
          label={score}
          moduleType={isWriting ? "Writing" : isSpeaking ? "Speaking" : ""}
        />
      );
    }
    if (isWriting)
      return (
        <img
          className="h-12 w-12 object-contain opacity-100 hover:opacity-80 transition-opacity cursor-pointer"
          src={IconWriting}
          alt="writing"
        />
      );
    if (isSpeaking)
      return (
        <img
          className="h-12 w-12 object-contain opacity-100 hover:opacity-80 transition-opacity cursor-pointer"
          src={IconSpeaking}
          alt="speaking"
        />
      );
    if (moduleID === moduleIDs[0])
      return (
        <img
          className="h-12 w-12 object-contain opacity-100 hover:opacity-80 transition-opacity cursor-pointer"
          src={IconReading}
          alt="reading"
        />
      );
    if (moduleID === moduleIDs[2])
      return (
        <img
          className="h-12 w-12 object-contain opacity-100 hover:opacity-80 transition-opacity cursor-pointer"
          src={IconListening}
          alt="listening"
        />
      );
    return (
      <img
        className="h-12 w-12 object-contain opacity-100 cursor-pointer"
        src={IconReading}
        alt="module"
      />
    );
  };

  return (
    <div className="m-2 rounded-md flex flex-col bg-background max-w-screen-sm mx-auto">
      <div className="p-2 pl-6 pr-4 rounded-md flex items-center justify-between bg-white border-2 border-primary">
        <div className="flex items-center flex-1">
          <img
            className="h-8 w-8 object-contain mr-2"
            src={isFree ? IconFree : IconPremium}
            alt="icon"
          />
          <span className="text-primary text-lg">{item.LessonName}</span>
        </div>
        {showSkillCategory && item.skillscategory && (
          <div
            className="px-2 py-1 rounded-md text-xs font-semibold ml-2 whitespace-nowrap"
            style={{
              backgroundColor: getSkillCategoryColor(item.skillscategory),
              color: getTextColor(getSkillCategoryColor(item.skillscategory)),
            }}
          >
            {item.skillscategory}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-row justify-between mb-4">
        <button
          onClick={onClickLessonVideo}
          className="hover:scale-105 transition-transform"
        >
          <img
            className="h-12 w-12 object-contain opacity-100 cursor-pointer"
            src={IconVideo}
            alt="button"
          />
        </button>
        <button
          onClick={() => {
            getExamResult(moduleIDs[0]);
          }}
          disabled={isLoading}
          className="hover:scale-105 transition-transform disabled:opacity-50"
        >
          {getModuleIcon(
            moduleIDs[0],
            item.userlessonReadingBand !== null &&
              item.userlessonReadingBand !== "0.00",
            item.userlessonReadingBand,
          )}
        </button>
        <button
          onClick={() => {
            getExamResult(moduleIDs[1]);
          }}
          disabled={isLoading}
          className="hover:scale-105 transition-transform disabled:opacity-50"
        >
          {getModuleIcon(
            moduleIDs[1],
            item.userlessonWritingBand !== null &&
              item.userlessonWritingBand !== "0.00",
            item.userlessonWritingBand,
          )}
        </button>
        <button
          onClick={() => {
            getExamResult(moduleIDs[3]);
          }}
          disabled={isLoading}
          className="hover:scale-105 transition-transform disabled:opacity-50"
        >
          {getModuleIcon(
            moduleIDs[3],
            item.userlessonSpeakingBand !== null &&
              item.userlessonSpeakingBand !== "0.00",
            item.userlessonSpeakingBand,
          )}
        </button>
        <button
          onClick={() => {
            getExamResult(moduleIDs[2]);
          }}
          disabled={isLoading}
          className="hover:scale-105 transition-transform disabled:opacity-50"
        >
          {getModuleIcon(
            moduleIDs[2],
            item.userlessonListeningBand !== null &&
              item.userlessonListeningBand !== "0.00",
            item.userlessonListeningBand,
          )}
        </button>
      </div>
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-md">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading module...</p>
          </div>
        </div>
      )}
      {isLessonVideoWatch && (
        <VideoPopUp
          howtouse={false}
          videoLink={item.LessonFileURL}
          onClose={closePopup}
          captionTracks={captions}
        />
      )}
      {isLessonPDFWatch && (
        <PdfPopUp
          pdfUrl={pdfUrl}
          onClose={closePdf}
          onStartAnswering={startAnswering}
        />
      )}
      {isLessonAudioWatch && (
        <AudioPopUp
          audioUrl={audioUrl}
          onClose={closeAudio}
          onStartAnswering={startAnswering}
        />
      )}
      <EvaluationLoading />
    </div>
  );
};

const CircleWithPercentage = ({
  percentage,
  label,
  moduleType,
}: {
  percentage: number;
  label: string;
  moduleType: string;
}) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const getScoreColor = () => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  const getStrokeColor = () => {
    if (percentage >= 80) return "stroke-green-600";
    if (percentage >= 60) return "stroke-yellow-600";
    return "stroke-red-600";
  };
  return (
    <div className="relative flex items-center justify-center group">
      <svg className="absolute top-0 left-0" width="48" height="48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gray-300"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className={getStrokeColor()}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div
        className={`h-12 w-12 rounded-full bg-white flex items-center justify-center text-xs font-semibold ${getScoreColor()}`}
      >
        {Math.trunc(Number(label))}%
      </div>
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
        {moduleType} Score
      </div>
    </div>
  );
};

export default HomeListView;
