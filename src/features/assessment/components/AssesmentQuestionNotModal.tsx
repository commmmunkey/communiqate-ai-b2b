import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AssesmentQuestionNotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AssesmentQuestionNotModal = ({
  isOpen,
  onClose,
}: AssesmentQuestionNotModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Assessment Questions Not Available
          </DialogTitle>
          <DialogDescription className="text-base">
            We're sorry, but it looks like this assessment is currently
            unavailable. No questions have been added yet. Please check back
            later or contact your administrator for further assistance.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssesmentQuestionNotModal;
