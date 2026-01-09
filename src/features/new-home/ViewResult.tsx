import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";

interface Question {
  queQuestion: string;
  queType: string;
  queOption1?: string;
  queOption2?: string;
  queOption3?: string;
  queOption4?: string;
  answerIsCorrect: string;
  answerIsVerified: string;
  answerAnswer: string;
  answerCorrectAnswer: string;
  answerGrade?: string;
  answerNotes?: string;
}

const ViewResult = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [questionBgColors, setQuestionBgColors] = useState<string[]>([]);
  const navigate = useNavigate();

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
      secondaryColor,
    );
    document.documentElement.style.setProperty(
      "--background-color",
      backgroundColor,
    );
    document.documentElement.style.setProperty("--accent-color", accentColor);
  }, []);

  useEffect(() => {
    const storedQuestions = localStorage.getItem("LUResultquestions");
    if (storedQuestions) {
      const parsedQuestions = JSON.parse(storedQuestions) as Question[];
      setQuestions(parsedQuestions);
      const bgColors = parsedQuestions.map((question) =>
        question.answerIsCorrect === "Yes" ? "bg-green-500" : "bg-red-500",
      );
      setQuestionBgColors(bgColors);
    }
  }, []);

  const handleQuestionClick = (questionNumber: number) => {
    setCurrentQuestion(questionNumber);
  };

  const handleNextClick = () => {
    setCurrentQuestion((prev) => (prev < questions.length ? prev + 1 : 1));
  };

  const handleBacktoSummaryClick = () => {
    navigate("/result");
  };

  const currentQuestionData = questions[currentQuestion - 1];

  return (
    <div className="flex flex-col items-center justify-center h-screen p-3 max-w-screen-md mx-auto">
      <div className="flex space-x-4 mb-4">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`w-10 h-10 flex items-center justify-center rounded-full cursor-pointer ${
              currentQuestion === index + 1 ? "text-primary" : "text-white "
            } ${questionBgColors[index]}`}
            onClick={() => handleQuestionClick(index + 1)}
          >
            {index + 1}
          </div>
        ))}
      </div>

      <div className="w-full h-1 bg-gray-300 mb-4"></div>

      {currentQuestionData && (
        <div className="w-full">
          <div className="text-lg text-primary font-bold mb-2">
            Question {currentQuestion}
          </div>
          <div className="text-lg font-bold mb-2">
            {currentQuestionData.queQuestion}
          </div>
          <div className="mb-4">
            {currentQuestionData.queType === "MCQ" ? (
              ["A", "B", "C", "D"].map((optionLetter, index) => {
                const optionKey = `Option${index + 1}`;
                const optionText = currentQuestionData[
                  `queOption${index + 1}` as keyof Question
                ] as string;
                const isCorrect =
                  optionKey === currentQuestionData.answerCorrectAnswer;
                const isUserAnswer =
                  optionKey === currentQuestionData.answerAnswer;

                let optionClass = "bg-white text-gray-800 hover:bg-gray-100";

                if (isCorrect) {
                  optionClass = "bg-green-500 text-white";
                } else if (isUserAnswer && !isCorrect) {
                  optionClass = "bg-red-500 text-white";
                }

                return (
                  <div
                    key={index}
                    className={`option flex items-center p-2 m-1 border border-gray-300 rounded-lg cursor-pointer ${optionClass}`}
                  >
                    <span
                      className={`font-bold mr-2 ${
                        optionClass ===
                        "bg-white text-gray-800 hover:bg-gray-100"
                          ? "text-primary"
                          : "text-white"
                      }`}
                    >
                      {optionLetter}
                    </span>
                    <span className="option-text">{optionText}</span>
                  </div>
                );
              })
            ) : currentQuestionData.queType === "Audio" ? (
              currentQuestionData.answerIsVerified === "Pending" ? (
                <div className="flex items-center justify-center h-48 text-blue-500 font-bold">
                  Your answer is under review. Please check back later for
                  feedback.
                </div>
              ) : (
                <div>
                  <div>Score: {currentQuestionData.answerGrade}%</div>
                  <div>
                    <strong>Expert's Feedback:</strong>{" "}
                    {currentQuestionData.answerNotes}
                  </div>
                  <AudioPlayer
                    src={
                      "https://stage.englishmonkapp.com/englishmonk-staging//backend/web/uploads/users/" +
                      currentQuestionData.answerAnswer
                    }
                    onPlay={() => console.log("onPlay")}
                    className="m-2"
                  />
                </div>
              )
            ) : currentQuestionData.answerIsVerified === "Pending" ? (
              <div className="flex items-center justify-center h-48 text-blue-500 font-bold">
                Your answer is under review. Please check back later for
                feedback.
              </div>
            ) : (
              <div>
                <textarea
                  className="w-full px-4 py-2 border bg-green-500 text-white border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 h-48 resize-none"
                  placeholder="Type your answer here..."
                  value={currentQuestionData.answerAnswer}
                  disabled
                ></textarea>
                <div>Score: {currentQuestionData.answerGrade}%</div>
                <div>
                  <strong>Expert's Feedback:</strong>{" "}
                  {currentQuestionData.answerNotes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between w-full">
        <button
          className="bg-primary text-white px-4 py-2 rounded-lg shadow-md mr-4"
          onClick={handleBacktoSummaryClick}
        >
          Back to Summary
        </button>
        <button
          className="bg-primary text-white px-4 py-2 rounded-lg shadow-md"
          onClick={handleNextClick}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ViewResult;
