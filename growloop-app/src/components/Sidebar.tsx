"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Dna, Sparkles, Camera, CalendarDays, BarChart3, Zap, Users, FileText, PenSquare, LayoutGrid, Plug, Rocket, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSidebar } from "./SidebarProvider";

const NAV_ITEMS = [
  { href: "/", label: "New Business DNA", icon: Sparkles },
  { href: "/board", label: "Business DNA", icon: Dna },
  { href: "/campaigns", label: "Campaigns", icon: Sparkles },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/content", label: "Content Library", icon: FileText },
  { href: "/content-plan", label: "Content Plan", icon: LayoutGrid },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/automation", label: "Automation", icon: Zap },
  { href: "/team", label: "Team", icon: Users },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/photoshoot", label: "Photoshoot", icon: Camera },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  // Don't show sidebar on the home page or loading screen
  const hiddenPaths = ["/", "/generate"];
  if (hiddenPaths.some((p) => pathname === p || pathname.startsWith("/generate"))) {
    return null;
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 flex flex-col bg-[#F9FAFB] border-r border-gray-200 pt-6 transition-all duration-300 ${
        isCollapsed ? "w-[80px]" : "w-[240px]"
      }`}
    >
      {/* Logo Area & Toggle */}
      <div className={`flex items-center mb-10 ${isCollapsed ? "justify-center px-0" : "justify-between px-6"}`}>
        {!isCollapsed && (
          <Link href="/" className="flex items-center group">
            <span className="text-2xl font-black text-gray-900 tracking-tighter">
              ScaleSoci
            </span>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/board" && pathname.startsWith("/board"));
          const Icon = item.icon;

          return (
             <Link
               key={item.href}
               href={item.href}
               title={isCollapsed ? item.label : undefined}
               className={`flex items-center ${isCollapsed ? "justify-center w-12 h-12 p-0 mx-auto" : "gap-4 px-4 py-2.5"} rounded-xl transition-all font-medium text-[14px] ${
                 isActive
                   ? "bg-[#C1CD7D] text-white shadow-sm"
                   : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
               }`}
             >
               <Icon className="w-5 h-5 shrink-0" />
               {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
             </Link>
          );
        })}
      </nav>
    </aside>
  );
}
