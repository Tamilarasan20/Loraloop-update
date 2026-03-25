"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import CalendarView from "../../components/social/CalendarView";

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors text-[14px] font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-gray-200" />
          <h1 className="text-[20px] font-bold">Content Calendar</h1>
        </div>

        <Link
          href="/campaigns/create"
          className="flex items-center gap-2 bg-lime-400 text-white px-6 py-2.5 rounded-full font-bold text-[13px] hover:bg-lime-500 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Calendar */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <CalendarView
          onDayClick={(date) => console.log("Day clicked:", date)}
          onPostClick={(post) => console.log("Post clicked:", post)}
        />
      </div>
    </div>
  );
}
