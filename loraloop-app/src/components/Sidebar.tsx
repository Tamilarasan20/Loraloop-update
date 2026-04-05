"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Inbox, Zap, ChevronDown } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/integration", label: "Integration", icon: Zap },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Show sidebar on all routes in the new design
  return (
    <aside className="sticky top-0 left-0 h-screen z-40 flex flex-col bg-[#FAFBFC] w-[260px] border-r border-[#E5E7EB] py-6">
      {/* Top Application Logo */}
      <div className="flex items-center px-6 mb-6">
        <div className="w-8 h-8 bg-[#3B82F6] rounded-[8px] flex items-center justify-center">
            {/* L shape made of white blocks, matching original screenshot roughly */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 3H10V15H20V19H6V3Z" fill="white"/>
            </svg>
        </div>
        <div className="ml-auto w-5 h-6 flex justify-between items-center cursor-pointer opacity-70 hover:opacity-100">
           {/* small layout icon */}
           <div className="w-[8px] h-full border-[1.5px] border-[#71717A] rounded-sm"></div>
           <div className="w-[8px] h-full border-[1.5px] border-[#71717A] rounded-sm flex flex-col">
              <div className="flex-1"></div>
              <div className="border-t-[1.5px] border-[#71717A] w-full mt-1.5"></div>
           </div>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="px-5 mb-8">
        <button className="w-full flex items-center justify-between border border-[#E5E7EB] bg-white rounded-xl p-2 hover:bg-gray-50 transition-colors shadow-sm">
            <div className="flex items-center gap-2.5 px-1">
                <div className="w-7 h-7 bg-[#10B981] rounded-md flex items-center justify-center text-white font-bold text-xs uppercase tracking-wider">
                    W
                </div>
                <span className="text-[14px] font-medium text-[#111111]">Work Space 1</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#A1A1AA] mr-1" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col gap-1.5 px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href && pathname !== "/"; // Just keeping Home inactive for visual match since Lora is focused in mock
          const Icon = item.icon;

          return (
             <Link
               key={item.href}
               href={item.href}
               className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-colors font-semibold text-[14px] ${
                 isActive
                   ? "bg-[#E0EEBA] text-[#111111]"
                   : "text-[#3F3F46] hover:text-[#111111] hover:bg-[#F4F4F5]"
               }`}
             >
               <Icon className="w-[18px] h-[18px] shrink-0 opacity-80" strokeWidth={2} />
               <span className="whitespace-nowrap">{item.label}</span>
             </Link>
          );
        })}

        {/* Lora Knowledge Base Active Item */}
        <div className="mt-2 text-[12px] font-bold text-[#A1A1AA] uppercase tracking-wider px-4 mb-1">APPS</div>
        <Link
           href="/"
           className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-colors font-semibold text-[14px] bg-[#2563EB] text-white shadow-md shadow-blue-500/20`}
         >
           <div className="flex items-center justify-center opacity-90">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="2" x2="12" y2="22"></line>
                <line x1="12" y1="2" x2="12" y2="22"></line>
                </svg>
           </div>
           <span className="whitespace-nowrap">Lora Knowledge Base</span>
        </Link>
      </nav>

      {/* User Profile Footer */}
      <div className="px-6 mt-auto">
        <div className="w-9 h-9 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-[14px] shadow-sm cursor-pointer hover:opacity-90 tracking-wide uppercase">
          T
        </div>
      </div>
    </aside>
  );
}
