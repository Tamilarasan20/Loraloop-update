"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Search, Filter, FileText, Clock, CheckCircle, XCircle, Calendar, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";

interface ContentItem {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  status: "draft" | "scheduled" | "published" | "failed";
  date?: string;
  engagement?: number;
}

const MOCK_CONTENT: ContentItem[] = [
  { id: "1", title: "Product Launch Post", content: "Introducing our latest AI feature that helps you...", platforms: ["x", "linkedin"], status: "scheduled", date: "Mar 20, 2026 09:00 AM" },
  { id: "2", title: "Weekly Tips Thread", content: "5 tips for growing your social presence in 2026...", platforms: ["x"], status: "draft" },
  { id: "3", title: "Behind the Scenes", content: "Take a look at how we build products at ScaleSoci...", platforms: ["instagram"], status: "published", engagement: 1240 },
  { id: "4", title: "Blog Promotion", content: "Our latest blog post on AI automation is live!", platforms: ["linkedin", "x"], status: "published", engagement: 890 },
  { id: "5", title: "Team Spotlight", content: "Meet our new engineering lead, Sarah Chen!", platforms: ["linkedin", "instagram"], status: "draft" },
  { id: "6", title: "Customer Success Story", content: "How company X grew their audience by 300%...", platforms: ["linkedin"], status: "failed" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "text-[#9A9A9C]", bg: "bg-white/5", icon: FileText },
  scheduled: { label: "Scheduled", color: "text-blue-400", bg: "bg-blue-400/10", icon: Clock },
  published: { label: "Published", color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle },
  failed: { label: "Failed", color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
};

const PLATFORM_ICONS: Record<string, { icon: string; color: string }> = {
  x: { icon: "𝕏", color: "#000" },
  linkedin: { icon: "in", color: "#0A66C2" },
  instagram: { icon: "📷", color: "#E1306C" },
  tiktok: { icon: "♪", color: "#000" },
};

export default function ContentPage() {
  const [content] = useState(MOCK_CONTENT);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = content.filter((item) => {
    if (filter !== "all" && item.status !== filter) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors text-[14px] font-bold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-gray-200" />
          <h1 className="text-[20px] font-bold tracking-tight">Content Library</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/calendar"
            className="flex items-center gap-2 border border-gray-200 bg-white text-gray-600 px-5 py-2.5 rounded-full font-bold text-[13px] hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </Link>
          <Link
            href="/campaigns/create"
            className="flex items-center gap-2 bg-lime-400 text-white px-6 py-2.5 rounded-full font-bold text-[13px] hover:bg-lime-500 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10">
        {/* Filters & Search */}
        <div className="flex items-center justify-between gap-6">
          <div className="relative flex-1 max-w-[450px]">
            <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search content..."
              className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-gray-900 text-[14px] outline-none focus:border-lime-500 font-bold placeholder-gray-300 shadow-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white rounded-xl p-1.5 border border-gray-100 shadow-sm">
            {["all", "draft", "scheduled", "published", "failed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-[11px] font-extrabold transition-all capitalize uppercase tracking-wider ${
                  filter === f
                    ? "bg-lime-400 text-white shadow-md shadow-lime-100"
                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-4 gap-6">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = content.filter(c => c.status === key).length;
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`bg-white border rounded-[24px] p-6 text-center hover:border-lime-300 transition-all shadow-sm group ${
                  filter === key ? "ring-2 ring-lime-400 border-lime-400" : "border-gray-200"
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-3 transition-transform group-hover:scale-110 ${config.color}`} />
                <div className="text-[28px] font-bold text-gray-900 mb-1">{count}</div>
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{config.label}</div>
              </button>
            );
          })}
        </div>

        {/* Content List */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest px-2">Recently Modified</h2>
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-[32px] p-16 text-center shadow-inner">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <Search className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold">No content found matches your search</p>
            </div>
          ) : (
            filtered.map((item) => {
              const statusConfig = STATUS_CONFIG[item.status];
              const StatusIcon = statusConfig.icon;
              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-[24px] p-6 flex items-center gap-6 hover:border-lime-300 transition-all group cursor-pointer shadow-sm hover:shadow-md"
                >
                  {/* Status */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-transparent ${statusConfig.bg.replace('white/5', 'gray-50')}`}>
                    <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[16px] font-bold text-gray-900 mb-1 leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[14px] text-gray-500 font-bold truncate tracking-tight">{item.content}</p>
                  </div>

                  {/* Platforms */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.platforms.map((p) => {
                      const pConfig = PLATFORM_ICONS[p];
                      return (
                        <div
                          key={p}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-bold shadow-sm"
                          style={{ backgroundColor: pConfig?.color || "#e5e7eb" }}
                        >
                          {pConfig?.icon || "?"}
                        </div>
                      );
                    })}
                  </div>

                  {/* Date / Engagement */}
                  <div className="text-right shrink-0 w-[140px]">
                    {item.date && (
                      <span className="text-[13px] text-gray-400 font-bold uppercase tracking-tighter">{item.date}</span>
                    )}
                    {item.engagement && (
                      <span className="text-[13px] text-lime-600 font-extrabold block">
                        {item.engagement.toLocaleString()} 🔥
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 rounded-xl hover:bg-red-50 text-red-400 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
