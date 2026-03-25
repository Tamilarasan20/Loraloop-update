"use client";

import { useSidebar } from "./SidebarProvider";
import { usePathname } from "next/navigation";

export default function TopBar() {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();

  const hiddenPaths = ["/", "/generate"];
  const isHidden = hiddenPaths.some(
    (p) => pathname === p || pathname.startsWith("/generate")
  );

  return (
    <div className={`fixed top-0 right-0 h-16 sm:h-20 lg:h-24 flex items-center justify-between px-6 sm:px-8 lg:px-12 z-20 pointer-events-none transition-all duration-300 ${isHidden ? 'left-0' : (isCollapsed ? 'lg:left-[80px]' : 'lg:left-[240px]')} left-[80px]`}>
      
      {/* Left side: Empty (or contextual actions) */}
      <div className="flex items-center gap-3"></div>

      {/* Right side: Actions (Pointer events enabled here so they're clickable) */}
      <div className="flex items-center gap-4 sm:gap-6 pointer-events-auto">
      </div>

    </div>
  );
}
