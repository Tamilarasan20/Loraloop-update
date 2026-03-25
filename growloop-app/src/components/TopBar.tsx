"use client";

import { MoreVertical } from "lucide-react";

export default function TopBar() {
  return (
    <div className="fixed top-0 left-64 right-0 h-16 sm:h-20 lg:h-24 flex items-center justify-between px-6 sm:px-8 lg:px-12 z-20 pointer-events-none">
      
      {/* Left side: Empty (or contextual actions) */}
      <div className="flex items-center gap-3"></div>

      {/* Right side: Actions (Pointer events enabled here so they're clickable) */}
      <div className="flex items-center gap-4 sm:gap-6 pointer-events-auto">
        <button className="text-[#9A9A9C] hover:text-[#EAEAEA] transition-colors p-2 rounded-full hover:bg-white/5">
          <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* User Avatar */}
        <button className="relative group cursor-pointer">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 ring-2 ring-transparent group-hover:ring-white/20 transition-all">
            {/* Using a placeholder avatar image for realism matching the screenshot */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://ui-avatars.com/api/?name=User&background=3B82F6&color=fff" alt="User" className="w-full h-full object-cover" />
          </div>
        </button>
      </div>

    </div>
  );
}
