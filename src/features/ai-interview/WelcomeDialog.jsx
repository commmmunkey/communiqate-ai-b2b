import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WelcomeDialog = ({ onContinue, onClose, open = true }) => {
  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} >
      <DialogContent className="sm:max-w-lg" onInteractOutside={e=>e.preventDefault()} onEscapeKeyDown={e=>e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">
            Welcome to Communiqate AI's
          </DialogTitle>
          <DialogTitle className="text-lg text-center">
            Business Readiness Assessment Portal
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-center space-y-4">
          <p>
            We're excited to have you on board! Before you begin, please take a moment to complete
            your basic details below. This will help us get to know you better and ensure an accurate
            evaluation of your communication skills and business readiness.
          </p>
          <p>
            Click Continue to start. Good luck!
          </p>
        </DialogDescription>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onContinue}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog; 