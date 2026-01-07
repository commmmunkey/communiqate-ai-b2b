import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";

export default function Logout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    // Dispatch event to notify App.tsx to update auth state
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <SidebarMenuButton className="cursor-pointer h-12 text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <div className="flex items-center gap-4 px-4">
            <LogOut className="h-5! w-5! text-orange-400" />
            <span className="text-base font-medium">Logout</span>
          </div>
        </SidebarMenuButton>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-slate-900 border-none text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
          <AlertDialogDescription className="text-white/80">
            You will be signed out of your account and redirected to the login
            page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-black">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
