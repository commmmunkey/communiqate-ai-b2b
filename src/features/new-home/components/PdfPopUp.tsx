import { useEffect, useState, useRef } from "react";
import { XIcon, Loader2, AlertCircle, Download } from "lucide-react";

interface PdfPopUpProps {
  onClose: () => void;
  pdfUrl: string;
  onStartAnswering?: () => void;
}

const PdfPopUp = ({ onClose, pdfUrl, onStartAnswering }: PdfPopUpProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
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

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Format PDF URL with viewer parameters
  const getPdfViewerUrl = (url: string) => {
    // If URL already contains query params, use &, otherwise use ?
    const separator = url.includes("?") ? "&" : "?";
    // Add parameters to control PDF viewer behavior
    // #toolbar=0 hides browser toolbar, #view=FitH fits horizontal
    return `${url}${separator}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
  };

  // Fallback: Open PDF in new tab
  const handleDownloadOrOpen = () => {
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-dialog-title"
      aria-describedby="pdf-dialog-description"
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
        className="bg-white rounded-xl w-full h-full max-w-6xl max-h-[95vh] relative flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2
            id="pdf-dialog-title"
            className="text-lg font-semibold text-gray-900"
          >
            PDF Document
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close PDF viewer"
              title="Close (ESC)"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}

          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10 p-8">
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Unable to load PDF
                  </h3>
                  <p
                    className="text-sm text-gray-600 mb-4"
                    id="pdf-dialog-description"
                  >
                    The PDF document could not be displayed in the viewer. You
                    can download it or open it in a new tab.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadOrOpen}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Open PDF
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={getPdfViewerUrl(pdfUrl)}
              className="w-full h-full border-0"
              title="PDF Document Viewer"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="fullscreen"
              aria-label="PDF document content"
            />
          )}
        </div>

        {/* Start Answering Button */}
        {onStartAnswering != null && (
          <div className="p-4 border-t border-gray-200 mx-auto">
            <button
              type="button"
              className=" cursor-pointer hover:bg-[#f5914a] bg-primary text-white font-bold py-2 px-4 rounded w-full sm:w-auto sm:self-center transition-colors"
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

export default PdfPopUp;
