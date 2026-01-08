import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PreAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBegin: () => void;
}

const PreAssessmentModal = ({
  isOpen,
  onClose,
  onBegin,
}: PreAssessmentModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Assessment Tool
          </DialogTitle>
          <DialogDescription className="space-y-2 text-base flex flex-col gap-2">
            <span>
              You are about to begin the assessment. Once you click "Begin," the
              timer will start, and you'll have limited time to complete all the
              questions. Please make sure you're ready before proceeding.
            </span>
            <span>Click "Begin" to start the assessment.</span>
            <span>
              Click "Cancel" if you're not ready and want to exit the
              assessment.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onBegin}>Begin</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreAssessmentModal;
