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
  { id: "3", title: "Behind the Scenes", content: "Take a look at how we build products at Growloop...", platforms: ["instagram"], status: "published", engagement: 1240 },
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
    <div className="min-h-screen bg-[#1B1B1B] text-[#EAEAEA]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-[#9A9A9C] hover:text-[#EAEAEA] transition-colors text-[14px] font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <h1 className="text-[20px] font-medium">Content Library</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/calendar"
            className="flex items-center gap-2 border border-white/10 text-[#EAEAEA] px-5 py-2.5 rounded-full font-semibold text-[13px] hover:bg-white/5 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </Link>
          <Link
            href="/campaigns/create"
            className="flex items-center gap-2 bg-[#C1CD7D] text-[#1B1B1B] px-5 py-2.5 rounded-full font-semibold text-[13px] hover:bg-[#D4E08F] transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Filters & Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-[400px]">
            <Search className="w-4 h-4 text-[#9A9A9C] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search content..."
              className="w-full bg-[#2C2D2E] border border-transparent rounded-xl py-3 pl-11 pr-4 text-[#EAEAEA] text-[14px] outline-none focus:border-[#4A4B4D] font-medium placeholder-[#525355]"
            />
          </div>
          <div className="flex items-center gap-2 bg-[#2C2D2E] rounded-xl p-1 border border-white/5">
            {["all", "draft", "scheduled", "published", "failed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors capitalize ${
                  filter === f
                    ? "bg-[#363738] text-[#EAEAEA] shadow-sm"
                    : "text-[#9A9A9C] hover:text-[#EAEAEA]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = content.filter(c => c.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`bg-[#2C2D2E] border border-white/5 rounded-2xl p-4 text-center hover:border-white/10 transition-colors ${
                  filter === key ? "ring-1 ring-[#C1CD7D]" : ""
                }`}
              >
                <config.icon className={`w-5 h-5 mx-auto mb-2 ${config.color}`} />
                <div className="text-[22px] font-bold text-[#EAEAEA]">{count}</div>
                <div className="text-[12px] text-[#9A9A9C] font-medium capitalize">{config.label}</div>
              </button>
            );
          })}
        </div>

        {/* Content List */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="bg-[#2C2D2E] border border-white/5 rounded-2xl p-12 text-center">
              <p className="text-[#9A9A9C] text-[14px]">No content found</p>
            </div>
          ) : (
            filtered.map((item) => {
              const statusConfig = STATUS_CONFIG[item.status];
              return (
                <div
                  key={item.id}
                  className="bg-[#2C2D2E] border border-white/5 rounded-2xl p-5 flex items-center gap-5 hover:border-white/10 transition-colors group cursor-pointer"
                >
                  {/* Status */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${statusConfig.bg}`}>
                    <statusConfig.icon className={`w-5 h-5 ${statusConfig.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-medium text-[#EAEAEA] mb-0.5">
                      {item.title}
                    </h4>
                    <p className="text-[13px] text-[#9A9A9C] truncate">{item.content}</p>
                  </div>

                  {/* Platforms */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.platforms.map((p) => {
                      const pConfig = PLATFORM_ICONS[p];
                      return (
                        <div
                          key={p}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: pConfig?.color || "#363738" }}
                        >
                          {pConfig?.icon || "?"}
                        </div>
                      );
                    })}
                  </div>

                  {/* Date / Engagement */}
                  <div className="text-right shrink-0 w-[120px]">
                    {item.date && (
                      <span className="text-[12px] text-[#9A9A9C] font-medium">{item.date}</span>
                    )}
                    {item.engagement && (
                      <span className="text-[12px] text-[#C1CD7D] font-semibold">
                        {item.engagement.toLocaleString()} engagements
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 rounded-lg hover:bg-white/5 text-[#9A9A9C]">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-red-500/10 text-[#9A9A9C] hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
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
