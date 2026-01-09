import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const EvaluationLoading = () => {
  const loadingState = useStore((s) => s.evaluationLoading);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const currentStep = useMemo(() => {
    if (loadingState.progress < 25) return 0;
    if (loadingState.progress < 50) return 1;
    if (loadingState.progress < 75) return 2;
    return 3;
  }, [loadingState.progress]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStepMessages = () => {
    return [
      "Processing your response",
      "Analyzing content and structure",
      "Generating detailed feedback",
      "Preparing your results",
    ];
  };

  const getStepIcon = (stepIndex: number) => {
    const isCompleted = stepIndex < currentStep;
    const isCurrent = stepIndex === currentStep;
    if (isCompleted) {
      return (
        <svg
          className="w-5 h-5 text-green-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-label="Completed step"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (isCurrent) {
      return (
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      );
    }
    return (
      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
    );
  };

  return (
    <Dialog open={loadingState.isVisible} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-label="AI Evaluation"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            AI Evaluation in Progress
          </h3>
          <p className="text-gray-600 mb-6">
            {loadingState.message || "Analyzing your response"}
            {dots}
          </p>
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingState.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>{Math.round(loadingState.progress)}% Complete</span>
              <span>{formatTime(loadingState.estimatedTime)} remaining</span>
            </div>
          </div>
          <div className="text-left space-y-3 text-sm">
            {getStepMessages().map((message, index) => (
              <div
                key={message}
                className={`flex items-center ${index <= currentStep ? "text-gray-700" : "text-gray-400"}`}
              >
                <div className="mr-3">{getStepIcon(index)}</div>
                <span className={index <= currentStep ? "font-medium" : ""}>
                  {message}
                </span>
              </div>
            ))}
          </div>
          {loadingState.progress < 50 && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  // console.log('Cancel evaluation');
                }}
              >
                Cancel Evaluation
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationLoading;

