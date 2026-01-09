import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ExamListView from "./components/ExamListView";
import Loading from "@/components/Loading";
import PreExamModal from "./components/PreExamModal";
import { API_BASE_URL } from "@/lib/constants";
import scrollNotesSecond from "./assets/scrollNotesSecond.png";
import icCertification from "./assets/ic_certification.png";

interface Exam {
  examID: number;
  examName: string;
  examDuration: string;
  userexamReadingSubmitted: string;
  userexamListeningSubmitted: string;
  userexamWritingSubmitted: string;
  userexamSpeakingSubmitted: string;
  userexampercentage: string;
  modules: any[];
  [key: string]: any;
}

const ExamList = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("USER_ID");
  const [arrexamList, setArrexamList] = useState<Exam[]>([]);
  const [isloading, setIsloading] = useState(false);
  const [isPreExamModalOpen, setIsPreExamModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [usereligible, setUsereligible] = useState(false);
  const [usercertifylink, setUsercertifylink] = useState("");

  useEffect(() => {
    getExamList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getExamList = async () => {
    try {
      setIsloading(true);
      const dictParameter = JSON.stringify([
        {
          loginuserID: userId,
          languageID: "1",
          apiType: "Android",
          apiVersion: "1.0",
        },
      ]);
      const url = `${API_BASE_URL}lesson/get-exams`;
      const response = await fetch(url, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
        body: "json=" + dictParameter,
      });
      const responseJson = await response.json();
      setUsercertifylink(responseJson[0].usercertifylink || "");
      setUsereligible(responseJson[0].usereligible || false);
      setArrexamList(responseJson[0].questions || []);
      setIsloading(false);
    } catch (error) {
      setIsloading(false);
      console.error("Error in Fetching exam list", error);
    }
  };

  const onClose = () => {
    setIsPreExamModalOpen(false);
    setSelectedExam(null);
  };

  const onClickExam = (exam: Exam) => {
    setSelectedExam(exam);
    setIsPreExamModalOpen(true);
  };

  const handleButtonClick = () => {
    if (usercertifylink) {
      window.open(usercertifylink, "_blank");
    } else {
      alert(
        `Congratulations!\n\nYou have earned your Certificate of Completion!\n\nYou will receive your downloadable and printable certificate via a secure web link within 5-10 business days. We will notify you through the app when your certificate is ready.\n\nNow go on and celebrate your accomplishment!`,
      );
    }
  };

  return isloading ? (
    <Loading />
  ) : (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="p-2 pl-6 pr-4 rounded-md items-center justify-center bg-white max-w-screen-2xl min-w-3xl shadow-lg w-full mx-4 my-4">
        {isPreExamModalOpen && selectedExam && (
          <PreExamModal exam={selectedExam} onClose={onClose} />
        )}
        {arrexamList.map((exam, index) => (
          <ExamListView
            key={index}
            exam={exam}
            onClickExam={() => onClickExam(exam)}
            pendingStatus={
              exam.userexamReadingSubmitted === "Yes" &&
              exam.userexamListeningSubmitted === "Yes" &&
              exam.userexamWritingSubmitted === "Yes" &&
              exam.userexamSpeakingSubmitted === "Yes"
            }
            marks={exam.userexampercentage}
          />
        ))}
        {usereligible ? (
          <div className="flex flex-col items-center w-full py-4">
            <div
              className="flex flex-col items-center justify-center w-11/12 h-72 m-4 bg-no-repeat bg-contain bg-center relative"
              style={{ backgroundImage: `url(${scrollNotesSecond})` }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-center text-black font-bold text-lg m-2">
                  🏆 Congratulations! 🏆
                </p>
                <p className="text-center text-black text-base m-2">
                  You have successfully earned your <br /> Certificate of
                  Completion.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleButtonClick}
              className="hover:bg-[#f5914a] bg-primary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Tap here to view your<br />
              certificate
            </button>
          </div>
        ) : (
          <div
            className="flex justify-center mt-4 cursor-pointer"
            onClick={() => {
              navigate("/certificateInstructions");
            }}
          >
            <img
              className="h-12 w-12 object-contain mr-2"
              src={icCertification}
              alt="icon"
            />
            <div className="flex flex-col">
              <span className="text-black text-lg">How to Earn Your</span>
              <span className="text-black text-lg -mt-2">
                Certificate of Completion
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamList;

