import { LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { items } from "./nav-items"
import PrefetchLink from "@/components/PrefetchLink"

export default function AppSidebar() {
  return (
    <Sidebar className="border-r-0">
      {/* HEADER: User Profile */}
      <SidebarHeader className="h-20 border-b border-white/10 bg-slate-900 px-6 justify-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border-2 border-slate-700">
            <AvatarImage src="/path-to-avatar.jpg" />
            <AvatarFallback className="bg-orange-500 text-white font-bold">AS</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Hi!</span>
            <span className="text-sm font-bold text-blue-400">akshya server</span>
          </div>
        </div>
      </SidebarHeader>

      {/* BODY: Main Navigation */}
      <SidebarContent className="bg-slate-900 px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="h-12 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <PrefetchLink to={item.url} className="flex items-center gap-4 px-4">
                      <item.icon className="!h-5 !w-5 text-orange-400" />
                      <span className="text-base font-medium">{item.title}</span>
                    </PrefetchLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER: Logout */}
      <SidebarFooter className="bg-slate-900 p-4 border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-12 text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              onClick={() => console.log("Logging out...")}
            >
              <div className="flex items-center gap-4 px-4">
                <LogOut className="!h-5 !w-5 text-orange-400" />
                <span className="text-base font-medium">Logout</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}