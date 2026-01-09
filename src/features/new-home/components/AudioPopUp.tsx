import { useEffect, useState, useRef } from "react";
import {
  XIcon,
  Loader2,
  AlertCircle,
  Download,
  Play,
  Pause,
} from "lucide-react";

interface AudioPopUpProps {
  onClose: () => void;
  audioUrl: string;
  onStartAnswering?: () => void;
}

const AudioPopUp = ({
  onClose,
  audioUrl,
  onStartAnswering,
}: AudioPopUpProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  // Focus management for accessibility
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0] as HTMLElement;
      firstElement?.focus();
    }
  }, []);

  // Reset loading state when audioUrl changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioUrl]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      setHasError(false);
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        setHasError(true);
      });
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Fallback: Open audio in new tab
  const handleDownloadOrOpen = () => {
    window.open(audioUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-dialog-title"
      aria-describedby="audio-dialog-description"
      onClick={(e) => {
        // Close on backdrop click only
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        // Close on Escape key or backdrop keyboard interaction
        if (
          e.key === "Escape" ||
          (e.key === "Enter" && e.target === e.currentTarget)
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={containerRef}
        className="bg-white rounded-xl w-full max-w-2xl relative flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2
            id="audio-dialog-title"
            className="text-lg font-semibold text-gray-900"
          >
            Audio Clip
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close audio player"
              title="Close (ESC)"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audio Content Area */}
        <div className="p-6 flex flex-col items-center gap-6">
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-gray-600">Loading audio...</p>
            </div>
          )}

          {hasError ? (
            <div className="flex flex-col items-center gap-4 text-center max-w-md py-8">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unable to load audio
                </h3>
                <p
                  className="text-sm text-gray-600 mb-4"
                  id="audio-dialog-description"
                >
                  The audio clip could not be loaded. You can download it or
                  open it in a new tab.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadOrOpen}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Open Audio
                </button>
              </div>
            </div>
          ) : (
            <>
              <audio
                ref={audioRef}
                src={audioUrl}
                preload="metadata"
                className="hidden"
              />

              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={togglePlayPause}
                className="w-20 h-20 rounded-full bg-primary hover:bg-opacity-90 text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg"
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
                disabled={isLoading}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>

              {/* Progress Bar */}
              <div className="w-full max-w-md space-y-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  disabled={isLoading || hasError}
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Start Answering Button */}
        {onStartAnswering != null && (
          <div className="p-4 border-t border-gray-200 mx-auto">
            <button
              type="button"
              className="hover:bg-[#f5914a] bg-primary text-white font-bold py-2 px-4 rounded w-full sm:w-auto sm:self-center transition-colors"
              onClick={onStartAnswering}
            >
              Start Answering
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPopUp;
