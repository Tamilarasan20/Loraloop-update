"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface CalendarPost {
  id: string;
  content: string;
  platform: string;
  platformColor: string;
  platformIcon: string;
  date: string; // ISO
  status: "scheduled" | "published" | "draft" | "failed";
}

// Mock data
const MOCK_POSTS: CalendarPost[] = [
  { id: "1", content: "Launching our new AI feature! 🚀", platform: "x", platformColor: "#000", platformIcon: "𝕏", date: new Date().toISOString(), status: "scheduled" },
  { id: "2", content: "We're hiring engineers to build the future...", platform: "linkedin", platformColor: "#0A66C2", platformIcon: "in", date: new Date().toISOString(), status: "scheduled" },
  { id: "3", content: "Behind the scenes of our product shoot", platform: "instagram", platformColor: "#E1306C", platformIcon: "📷", date: new Date(Date.now() + 86400000).toISOString(), status: "draft" },
  { id: "4", content: "Tips for growing your social presence", platform: "x", platformColor: "#000", platformIcon: "𝕏", date: new Date(Date.now() + 86400000 * 3).toISOString(), status: "scheduled" },
  { id: "5", content: "Our latest blog post on AI automation", platform: "linkedin", platformColor: "#0A66C2", platformIcon: "in", date: new Date(Date.now() + 86400000 * 5).toISOString(), status: "scheduled" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface CalendarViewProps {
  posts?: CalendarPost[];
  onDayClick?: (date: Date) => void;
  onPostClick?: (post: CalendarPost) => void;
}

export default function CalendarView({ posts = MOCK_POSTS, onDayClick, onPostClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month fill
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
      });
    }

    // Next month fill (to complete last row)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [year, month]);

  const getPostsForDay = (date: Date) => {
    return posts.filter((p) => {
      const postDate = new Date(p.date);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigate = (dir: -1 | 1) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-[24px] font-medium text-[#EAEAEA]">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-white/5 text-[#9A9A9C] hover:text-[#EAEAEA] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-1.5 rounded-xl text-[13px] font-medium text-[#9A9A9C] hover:text-[#EAEAEA] hover:bg-white/5 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-2 rounded-xl hover:bg-white/5 text-[#9A9A9C] hover:text-[#EAEAEA] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#2C2D2E] rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setViewMode("month")}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              viewMode === "month"
                ? "bg-[#363738] text-[#EAEAEA] shadow-sm"
                : "text-[#9A9A9C] hover:text-[#EAEAEA]"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              viewMode === "week"
                ? "bg-[#363738] text-[#EAEAEA] shadow-sm"
                : "text-[#9A9A9C] hover:text-[#EAEAEA]"
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#2C2D2E] border border-white/5 rounded-[24px] overflow-hidden shadow-xl">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {DAYS.map((day) => (
            <div
              key={day}
              className="px-4 py-3 text-center text-[12px] font-semibold text-[#9A9A9C] uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dayPosts = getPostsForDay(day.date);
            return (
              <div
                key={i}
                onClick={() => onDayClick?.(day.date)}
                className={`
                  min-h-[120px] p-2 border-b border-r border-white/5 cursor-pointer 
                  transition-colors hover:bg-white/[0.02] group relative
                  ${!day.isCurrentMonth ? "opacity-30" : ""}
                `}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`
                      w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-medium
                      ${
                        day.isToday
                          ? "bg-[#C1CD7D] text-[#1B1B1B] font-bold"
                          : "text-[#9A9A9C]"
                      }
                    `}
                  >
                    {day.date.getDate()}
                  </span>

                  {/* Add post button (visible on hover) */}
                  <button className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[#9A9A9C] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Post Pills */}
                <div className="flex flex-col gap-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <button
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostClick?.(post);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-left transition-colors hover:bg-white/10 w-full group/pill"
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: post.platformColor }}
                      />
                      <span className="text-[11px] text-[#9A9A9C] truncate group-hover/pill:text-[#EAEAEA] font-medium">
                        {post.content.slice(0, 30)}
                      </span>
                    </button>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[10px] text-[#9A9A9C] pl-2 font-medium">
                      +{dayPosts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
