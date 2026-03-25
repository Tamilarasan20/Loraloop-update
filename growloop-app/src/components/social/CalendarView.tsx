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
          <h2 className="text-[26px] font-bold text-gray-900 tracking-tight">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-200 shadow-sm active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 rounded-xl text-[13px] font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 uppercase tracking-wider"
            >
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-200 shadow-sm active:scale-90"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 border border-gray-200/50">
          <button
            onClick={() => setViewMode("month")}
            className={`px-5 py-2 rounded-[10px] text-[13px] font-bold transition-all ${
              viewMode === "month"
                ? "bg-white text-gray-900 shadow-md"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-5 py-2 rounded-[10px] text-[13px] font-bold transition-all ${
              viewMode === "week"
                ? "bg-white text-gray-900 shadow-md"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
          {DAYS.map((day) => (
            <div
              key={day}
              className="px-4 py-4 text-center text-[12px] font-bold text-gray-400 uppercase tracking-widest"
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
                  min-h-[130px] p-3 border-b border-r border-gray-50 cursor-pointer 
                  transition-all hover:bg-gray-50/50 group relative
                  ${!day.isCurrentMonth ? "opacity-20 pointer-events-none" : ""}
                `}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`
                      w-8 h-8 flex items-center justify-center rounded-xl text-[14px] font-bold transition-all
                      ${
                        day.isToday
                          ? "bg-lime-400 text-white shadow-md shadow-lime-100 scale-110"
                          : "text-gray-400"
                      }
                    `}
                  >
                    {day.date.getDate()}
                  </span>

                  {/* Add post button (visible on hover) */}
                  <button className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-lime-50 hover:text-lime-600 shadow-sm">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Post Pills */}
                <div className="flex flex-col gap-1.5">
                  {dayPosts.slice(0, 3).map((post) => (
                    <button
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostClick?.(post);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition-all hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 w-full group/pill bg-gray-50"
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: post.platformColor }}
                      />
                      <span className="text-[11px] text-gray-500 truncate group-hover/pill:text-gray-900 font-bold">
                        {post.content.slice(0, 30)}
                      </span>
                    </button>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[10px] text-gray-400 pl-2 font-bold uppercase tracking-wider">
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
