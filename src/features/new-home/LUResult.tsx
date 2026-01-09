import { useEffect } from "react";
import { useNavigate } from "react-router";
import roundOrangeImg from "./assets/round_orange.png";
import scoreImg from "./assets/Score.png";

const LUResult = () => {
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
      secondaryColor
    );
    document.documentElement.style.setProperty(
      "--background-color",
      backgroundColor
    );
    document.documentElement.style.setProperty("--accent-color", accentColor);
  }, []);

  const LUResultMarks = localStorage.getItem("LUResultMarks");
  const LUResultTotalQuestion = localStorage.getItem("LUResultTotalQuestion");
  const LUResultCorrectQuestion = localStorage.getItem(
    "LUResultCorrectQuestion"
  );

  const onClickViewResult = () => {
    navigate("/viewResult");
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full max-w-screen-sm mx-auto px-4 py-8">
      {LUResultMarks == "0.00" ? (
        <div className="relative w-full flex justify-center">
          <img
            src={roundOrangeImg}
            alt="Pending Evaluation"
            className="w-24 h-24 sm:w-32 sm:h-32"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white text-sm sm:text-lg font-bold">
              <div>Pending</div>
              <div>Evaluation</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full flex justify-center">
          <img
            src={scoreImg}
            alt="Score"
            className="w-24 h-24 sm:w-32 sm:h-32"
          />
          <div className="absolute inset-0 flex items-center justify-center text-primary text-xs sm:text-lg font-bold mb-6">
            {LUResultMarks}%
          </div>
        </div>
      )}
      <div className="flex justify-between w-full mt-6">
        <div className="text-left text-sm sm:text-lg">Total Questions</div>
        <div className="text-right text-sm sm:text-lg text-primary">
          {LUResultTotalQuestion}
        </div>
      </div>
      <div className="flex justify-between w-full mt-2">
        <div className="text-left text-sm sm:text-lg">Correct Answer(s)</div>
        <div className="text-right text-sm sm:text-lg text-primary">
          {LUResultCorrectQuestion}
        </div>
      </div>
      <button
        onClick={onClickViewResult}
        className="mt-8 bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-150"
      >
        View Result
      </button>
    </div>
  );
};

export default LUResult;

