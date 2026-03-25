"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarProvider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();

  // Don't shift content for pages without a sidebar
  const hiddenPaths = ["/", "/generate"];
  const isHidden = hiddenPaths.some(
    (p) => pathname === p || pathname.startsWith("/generate")
  );

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        !isHidden ? (isCollapsed ? "lg:pl-[80px]" : "lg:pl-[240px]") : ""
      }`}
    >
      {children}
    </div>
  );
}
