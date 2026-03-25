"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Dna, Sparkles, Camera, CalendarDays, BarChart3, Zap, Users, FileText, PenSquare, LayoutGrid, Plug } from "lucide-react";

const NAV_ITEMS = [
  { href: "/board", label: "Brand DNA", icon: Dna },
  { href: "/campaigns", label: "Campaigns", icon: Sparkles },
  { href: "/campaigns/create", label: "Create Post", icon: PenSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/content-plan", label: "Content Plan", icon: LayoutGrid },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/automation", label: "Automation", icon: Zap },
  { href: "/team", label: "Team", icon: Users },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/photoshoot", label: "Photoshoot", icon: Camera },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Don't show sidebar on the home page or loading screen
  const hiddenPaths = ["/", "/generate"];
  if (hiddenPaths.some((p) => pathname === p || pathname.startsWith("/generate"))) {
    return null;
  }

  return (
    <aside className="fixed top-0 left-0 h-full z-40 flex flex-col bg-[#1B1B1B] w-[240px] border-r border-white/5 pt-6">
      {/* Logo Area */}
      <div className="flex items-center px-6 mb-10">
        <Link href="/" className="flex items-center group">
          <span className="text-xl font-serif text-[#C1CD7D] tracking-wide">
            google_labs
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/board" && pathname.startsWith("/board"));
          const Icon = item.icon;

          return (
             <Link
               key={item.href}
               href={item.href}
               className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors font-medium text-[15px] ${
                 isActive
                   ? "bg-[#C1CD7D] text-[#1B1B1B]"
                   : "text-[#9A9A9C] hover:text-[#EAEAEA] hover:bg-white/5"
               }`}
             >
               <Icon className="w-5 h-5 shrink-0" />
               <span className="whitespace-nowrap">{item.label}</span>
             </Link>
          );
        })}
      </nav>
    </aside>
  );
}
