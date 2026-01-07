import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { items } from "./nav-items";
import PrefetchLink from "@/components/PrefetchLink";
import Logout from "./logout";
import Header from "./header";

export default function AppSidebar() {
  return (
    <Sidebar className="border-r-0">
      {/* HEADER: User Profile */}
      <Header />

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
                    <PrefetchLink
                      to={item.url}
                      className="flex items-center gap-4 px-4"
                    >
                      <item.icon className="!h-5 !w-5 text-orange-400" />
                      <span className="text-base font-medium">
                        {item.title}
                      </span>
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
            <Logout />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
