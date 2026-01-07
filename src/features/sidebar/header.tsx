import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarHeader } from "@/components/ui/sidebar";

export default function Header() {
  const getUserData = () => {
    try {
      const userDataStr = localStorage.getItem("USER_DATA");
      if (userDataStr) {
        return JSON.parse(userDataStr);
      }
    } catch (error) {
      console.error("Error parsing USER_DATA from localStorage:", error);
    }
    return null;
  };

  const userData = getUserData();
  const firstName = userData?.userFirstName || "";
  const lastName = userData?.userLastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "User";
  const initials =
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <SidebarHeader className="h-20 border-b border-white/10 bg-slate-900 px-6 justify-center">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10 border-2 border-slate-700">
          <AvatarImage src="/path-to-avatar.jpg" />
          <AvatarFallback className="bg-orange-500 text-white font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-medium">Hi!</span>
          <span className="text-sm font-bold text-blue-400">{fullName}</span>
        </div>
      </div>
    </SidebarHeader>
  );
}
