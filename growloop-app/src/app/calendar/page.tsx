"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import CalendarView from "../../components/social/CalendarView";

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-[#1B1B1B] text-[#EAEAEA]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#9A9A9C] hover:text-[#EAEAEA] transition-colors text-[14px] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <h1 className="text-[20px] font-medium">Content Calendar</h1>
        </div>

        <Link
          href="/campaigns/create"
          className="flex items-center gap-2 bg-[#C1CD7D] text-[#1B1B1B] px-5 py-2.5 rounded-full font-semibold text-[13px] hover:bg-[#D4E08F] transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Calendar */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <CalendarView
          onDayClick={(date) => console.log("Day clicked:", date)}
          onPostClick={(post) => console.log("Post clicked:", post)}
        />
      </div>
    </div>
  );
}
