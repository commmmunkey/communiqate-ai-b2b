import { useStore } from "@/store";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CaptionTrack {
  src: string;
  label: string;
  srclang: string;
  default?: boolean;
}

interface VideoPopUpProps {
  howtouse: boolean;
  onClose: () => void;
  videoLink: string;
  captionTracks?: CaptionTrack[];
}

const VideoPopUp = ({
  howtouse,
  onClose,
  videoLink,
  captionTracks,
}: VideoPopUpProps) => {
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
  const { setWatchHowToUseApp } = useStore();

  const onClickSkip = () => {
    setWatchHowToUseApp(false);
    localStorage.setItem("IS_SKIPED", "true");
    onClose();
  };
  const onClickWatchLater = () => {
    setWatchHowToUseApp(true);
    localStorage.setItem("IS_SKIPED", "false");
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className={`sm:max-w-2xl ${howtouse ? "border-4 border-primary" : ""}`}
      >
        <div className="w-full">
          <video controls className="w-full h-auto" controlsList="nodownload">
            <source src={videoLink} />
            {(captionTracks ?? []).map((t) => (
              <track
                key={t.srclang + t.label}
                kind="subtitles"
                srcLang={t.srclang}
                src={t.src}
                label={t.label}
                default={t.default}
              />
            ))}
            {/* Always include a track element for accessibility compliance */}
            {(!captionTracks || captionTracks.length === 0) && (
              <track
                kind="captions"
                srcLang="en"
                src=""
                label="No captions available"
              />
            )}
          </video>
        </div>
        {howtouse && (
          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button onClick={onClickSkip} variant="outline" className="flex-1">
              Skip
            </Button>
            <Button onClick={onClickWatchLater} className="flex-1">
              Watch Later
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoPopUp;

