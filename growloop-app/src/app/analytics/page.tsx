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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-[14px] font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-gray-200" />
          <h1 className="text-[20px] font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-lime-600" />
            Analytics
          </h1>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 border border-gray-200/50">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${
                timeRange === range.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
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
              className="bg-white border border-gray-200 rounded-[28px] p-6 flex flex-col gap-4 hover:border-lime-400 transition-all hover:shadow-lg shadow-sm"
            >
              <div className="flex items-center justify-between">
                <stat.icon className="w-5 h-5 text-lime-600" />
                <span
                  className={`flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-full ${
                    stat.isPositive
                      ? "text-green-600 bg-green-50"
                      : "text-red-600 bg-red-50"
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
                <div className="text-[32px] font-bold text-gray-900 leading-none">
                  {stat.value}
                </div>
                <div className="text-[13px] text-gray-500 font-bold mt-2 uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Engagement Chart Placeholder */}
        <div className="bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm">
          <h3 className="text-[16px] font-bold text-gray-900 mb-8">
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
                    backgroundColor: isHighlight ? "#a3e635" : "#f1f5f9",
                  }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl font-bold z-10">
                    {Math.round(height * 10)} engagements
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[12px] text-gray-400 mt-6 px-4 font-bold border-t border-gray-100 pt-4">
            <span>Mar 1</span>
            <span>Mar 8</span>
            <span>Mar 15</span>
            <span>Mar 22</span>
            <span>Mar 30</span>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm">
          <h3 className="text-[16px] font-bold text-gray-900 mb-8">
            Platform Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_STATS.map((platform) => (
              <div
                key={platform.name}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col gap-5 hover:bg-white hover:border-lime-200 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-[16px] shadow-sm"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.icon}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-gray-900">
                      {platform.name}
                    </div>
                    <div className="text-[12px] text-gray-500 font-medium">
                      {platform.followers} followers
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200/50">
                  <div>
                    <div className="text-[20px] font-bold text-gray-900">
                      {platform.engagement}
                    </div>
                    <div className="text-[11px] text-gray-400 font-bold uppercase">Engagement</div>
                  </div>
                  <div>
                    <div className="text-[20px] font-bold text-gray-900">
                      {platform.impressions}
                    </div>
                    <div className="text-[11px] text-gray-400 font-bold uppercase">Impressions</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Posts */}
        <div className="bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm">
          <h3 className="text-[16px] font-bold text-gray-900 mb-8">
            Top Performing Posts
          </h3>
          <div className="flex flex-col gap-4">
            {TOP_POSTS.map((post, i) => (
              <div
                key={post.id}
                className="flex items-center gap-6 bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:bg-white hover:border-lime-200 transition-all hover:shadow-md cursor-pointer group"
              >
                <span className="text-[28px] font-bold text-gray-200 w-10 text-center group-hover:text-lime-200 transition-colors">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-gray-900 truncate font-bold">
                    {post.content}
                  </p>
                  <span className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">{post.platform}</span>
                </div>
                <div className="flex items-center gap-8 text-[13px] text-gray-500 font-bold shrink-0">
                  <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                    <span>❤️</span> {post.likes}
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                    <span>💬</span> {post.comments}
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
                    <span>🔁</span> {post.shares}
                  </div>
                  <div className="bg-lime-50 text-lime-700 px-4 py-1.5 rounded-full text-[12px] border border-lime-100">
                    {post.impressions} views
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
