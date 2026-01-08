import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AlreadyAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AlreadyAssessmentModal = ({
  isOpen,
  onClose,
}: AlreadyAssessmentModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Assessment Already Completed
          </DialogTitle>
          <DialogDescription className="space-y-2 text-base">
            <p>You have already completed this assessment.</p>
            <p>
              Your proficiency report has been sent to the L&D Department for
              review.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlreadyAssessmentModal;
