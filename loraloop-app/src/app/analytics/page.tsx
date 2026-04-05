"use client";

import { useState } from "react";
import { ArrowLeft, TrendingUp, Users, Eye, MousePointer, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

// Mock analytics data
const OVERVIEW_STATS = [
  { label: "Total Impressions", value: "124.5K", change: "+12.3%", isPositive: true, icon: Eye },
  { label: "Engagements", value: "8,432", change: "+8.7%", isPositive: true, icon: MousePointer },
  { label: "Followers", value: "15,230", change: "+2.1%", isPositive: true, icon: Users },
  { label: "Engagement Rate", value: "6.8%", change: "-0.3%", isPositive: false, icon: TrendingUp },
];

const PLATFORM_STATS = [
  { name: "X (Twitter)", icon: "𝕏", color: "#000", followers: "5,430", engagement: "7.2%", posts: 42, impressions: "45.2K" },
  { name: "LinkedIn", icon: "in", color: "#0A66C2", followers: "3,210", engagement: "5.8%", posts: 28, impressions: "38.1K" },
  { name: "Instagram", icon: "📷", color: "#E1306C", followers: "4,150", engagement: "8.1%", posts: 35, impressions: "32.8K" },
  { name: "TikTok", icon: "♪", color: "#000", followers: "2,440", engagement: "4.5%", posts: 12, impressions: "8.4K" },
];

const TOP_POSTS = [
  { id: "1", content: "🚀 Just launched our AI-powered content generator!", platform: "x", likes: 342, comments: 45, shares: 128, impressions: "12.4K" },
  { id: "2", content: "5 tips for growing your LinkedIn audience in 2026...", platform: "linkedin", likes: 218, comments: 67, shares: 89, impressions: "8.7K" },
  { id: "3", content: "Behind the scenes of our latest product shoot", platform: "instagram", likes: 567, comments: 34, shares: 23, impressions: "15.2K" },
];

const TIME_RANGES = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");

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
          <h1 className="text-[20px] font-medium flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#C1CD7D]" />
            Analytics
          </h1>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-[#2C2D2E] rounded-xl p-1 border border-white/5">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                timeRange === range.value
                  ? "bg-[#363738] text-[#EAEAEA] shadow-sm"
                  : "text-[#9A9A9C] hover:text-[#EAEAEA]"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {OVERVIEW_STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#2C2D2E] border border-white/5 rounded-[20px] p-6 flex flex-col gap-4 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <stat.icon className="w-5 h-5 text-[#C1CD7D]" />
                <span
                  className={`flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full ${
                    stat.isPositive
                      ? "text-green-400 bg-green-400/10"
                      : "text-red-400 bg-red-400/10"
                  }`}
                >
                  {stat.isPositive ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stat.change}
                </span>
              </div>
              <div>
                <div className="text-[28px] font-bold text-[#EAEAEA] leading-none">
                  {stat.value}
                </div>
                <div className="text-[13px] text-[#9A9A9C] font-medium mt-1">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Engagement Chart Placeholder */}
        <div className="bg-[#2C2D2E] border border-white/5 rounded-[24px] p-6">
          <h3 className="text-[15px] font-medium text-[#EAEAEA] mb-6">
            Engagement Over Time
          </h3>
          <div className="h-[280px] flex items-end justify-between gap-2 px-4">
            {/* Simple bar chart visualization */}
            {Array.from({ length: 30 }, (_, i) => {
              const height = 20 + Math.random() * 80;
              const isHighlight = i === 12 || i === 22;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-lg transition-all hover:opacity-80 cursor-pointer group relative"
                  style={{
                    height: `${height}%`,
                    backgroundColor: isHighlight ? "#C1CD7D" : "#363738",
                  }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1B1B1B] text-[#EAEAEA] text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 shadow-lg font-medium">
                    {Math.round(height * 10)} engagements
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[11px] text-[#9A9A9C] mt-3 px-4 font-medium">
            <span>Mar 1</span>
            <span>Mar 8</span>
            <span>Mar 15</span>
            <span>Mar 22</span>
            <span>Mar 30</span>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-[#2C2D2E] border border-white/5 rounded-[24px] p-6">
          <h3 className="text-[15px] font-medium text-[#EAEAEA] mb-6">
            Platform Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLATFORM_STATS.map((platform) => (
              <div
                key={platform.name}
                className="bg-[#363738] rounded-2xl p-5 flex flex-col gap-4 hover:bg-[#3D3E40] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-[14px]"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.icon}
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-[#EAEAEA]">
                      {platform.name}
                    </div>
                    <div className="text-[12px] text-[#9A9A9C]">
                      {platform.followers} followers
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[18px] font-bold text-[#EAEAEA]">
                      {platform.engagement}
                    </div>
                    <div className="text-[11px] text-[#9A9A9C]">Engagement</div>
                  </div>
                  <div>
                    <div className="text-[18px] font-bold text-[#EAEAEA]">
                      {platform.impressions}
                    </div>
                    <div className="text-[11px] text-[#9A9A9C]">Impressions</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Posts */}
        <div className="bg-[#2C2D2E] border border-white/5 rounded-[24px] p-6">
          <h3 className="text-[15px] font-medium text-[#EAEAEA] mb-6">
            Top Performing Posts
          </h3>
          <div className="flex flex-col gap-3">
            {TOP_POSTS.map((post, i) => (
              <div
                key={post.id}
                className="flex items-center gap-4 bg-[#363738] rounded-2xl p-4 hover:bg-[#3D3E40] transition-colors cursor-pointer"
              >
                <span className="text-[24px] font-bold text-[#525355] w-8 text-center">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-[#EAEAEA] truncate font-medium">
                    {post.content}
                  </p>
                  <span className="text-[12px] text-[#9A9A9C]">{post.platform}</span>
                </div>
                <div className="flex items-center gap-6 text-[12px] text-[#9A9A9C] shrink-0">
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                  <span>🔁 {post.shares}</span>
                  <span className="text-[#C1CD7D] font-semibold">
                    {post.impressions} views
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
