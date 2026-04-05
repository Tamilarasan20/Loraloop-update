"use client";

import { useState } from "react";

export type PlatformCategory = "social" | "blog" | "email" | "ads" | "other" | "automation";

export type Platform = {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  gradientFrom?: string;
  gradientTo?: string;
  maxChars: number;
  connected: boolean;
  avatar?: string;
  username?: string;
  category: PlatformCategory;
};

export const ALL_PLATFORMS: Platform[] = [
  // ─── Social Media ───
  {
    id: "instagram-1",
    name: "Instagram",
    type: "instagram",
    icon: "📷",
    color: "#E1306C",
    gradientFrom: "#F58529",
    gradientTo: "#DD2A7B",
    maxChars: 2200,
    connected: true,
    username: "@loraloop.ai",
    category: "social",
  },
  {
    id: "facebook-1",
    name: "Facebook",
    type: "facebook",
    icon: "f",
    color: "#1877F2",
    maxChars: 63206,
    connected: true,
    username: "Loraloop AI",
    category: "social",
  },
  {
    id: "x-1",
    name: "X / Twitter",
    type: "x",
    icon: "𝕏",
    color: "#000000",
    maxChars: 280,
    connected: true,
    username: "@loraloop",
    category: "social",
  },
  {
    id: "linkedin-1",
    name: "LinkedIn",
    type: "linkedin",
    icon: "in",
    color: "#0A66C2",
    maxChars: 3000,
    connected: true,
    username: "Loraloop AI",
    category: "social",
  },
  {
    id: "tiktok-1",
    name: "TikTok",
    type: "tiktok",
    icon: "♪",
    color: "#010101",
    maxChars: 2200,
    connected: false,
    category: "social",
  },
  {
    id: "youtube-1",
    name: "YouTube",
    type: "youtube",
    icon: "▶",
    color: "#FF0000",
    maxChars: 5000,
    connected: false,
    category: "social",
  },
  {
    id: "google-business-1",
    name: "Google Business Profile",
    type: "google_business",
    icon: "G",
    color: "#4285F4",
    maxChars: 1500,
    connected: false,
    category: "social",
  },

  // ─── Blog ───
  {
    id: "wordpress-1",
    name: "WordPress",
    type: "wordpress",
    icon: "W",
    color: "#21759B",
    maxChars: 100000,
    connected: false,
    category: "blog",
  },

  // ─── Email ───
  {
    id: "mailchimp-1",
    name: "Mailchimp",
    type: "mailchimp",
    icon: "🐵",
    color: "#FFE01B",
    maxChars: 100000,
    connected: false,
    category: "email",
  },

  // ─── Ads ───
  {
    id: "meta-ads-1",
    name: "Meta Ads",
    type: "meta_ads",
    icon: "📢",
    color: "#0668E1",
    maxChars: 125,
    connected: false,
    category: "ads",
  },

  // ─── Other ───
  {
    id: "google-drive-1",
    name: "Google Drive",
    type: "google_drive",
    icon: "📁",
    color: "#0F9D58",
    maxChars: 100000,
    connected: false,
    category: "other",
  },

  // ─── Automation ───
  {
    id: "zapier-1",
    name: "Zapier",
    type: "zapier",
    icon: "⚡",
    color: "#FF4A00",
    maxChars: 100000,
    connected: false,
    category: "automation",
  },
];

// ─── Convenience Exports ───
export const SOCIAL_PLATFORMS = ALL_PLATFORMS.filter((p) => p.category === "social");
export const BLOG_PLATFORMS = ALL_PLATFORMS.filter((p) => p.category === "blog");
export const EMAIL_PLATFORMS = ALL_PLATFORMS.filter((p) => p.category === "email");
export const ADS_PLATFORMS = ALL_PLATFORMS.filter((p) => p.category === "ads");
export const OTHER_PLATFORMS = ALL_PLATFORMS.filter((p) => p.category === "other");
export const AUTOMATION_PLATFORMS = ALL_PLATFORMS.filter((p) => p.category === "automation");

// Legacy compat
export const DEFAULT_PLATFORMS = ALL_PLATFORMS;

// ─── Component ───
interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onChange: (selected: string[]) => void;
  showCategories?: boolean;
  filterCategories?: PlatformCategory[];
}

const CATEGORY_LABELS: Record<PlatformCategory, string> = {
  social: "Social Media",
  blog: "Blog",
  email: "Email",
  ads: "Ads",
  other: "Other",
  automation: "Automation Tools",
};

export default function PlatformSelector({
  selectedPlatforms,
  onChange,
  showCategories = false,
  filterCategories,
}: PlatformSelectorProps) {
  const platforms = filterCategories
    ? ALL_PLATFORMS.filter((p) => filterCategories.includes(p.category))
    : ALL_PLATFORMS;

  const togglePlatform = (id: string) => {
    const platform = platforms.find((p) => p.id === id);
    if (!platform?.connected) return;

    if (selectedPlatforms.includes(id)) {
      onChange(selectedPlatforms.filter((p) => p !== id));
    } else {
      onChange([...selectedPlatforms, id]);
    }
  };

  const renderPlatformButton = (platform: Platform) => {
    const isSelected = selectedPlatforms.includes(platform.id);
    const isConnected = platform.connected;

    return (
      <button
        key={platform.id}
        onClick={() => togglePlatform(platform.id)}
        disabled={!isConnected}
        className={`
          relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-200 group
          ${
            isSelected
              ? "border-[#C1CD7D] bg-[#C1CD7D]/10 text-[#EAEAEA] shadow-lg shadow-[#C1CD7D]/10"
              : isConnected
              ? "border-white/10 bg-[#2C2D2E] text-[#9A9A9C] hover:border-white/20 hover:bg-[#363738] hover:text-[#EAEAEA]"
              : "border-white/5 bg-[#2C2D2E]/50 text-[#525355] cursor-not-allowed opacity-60"
          }
        `}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-[14px] shrink-0 transition-transform ${
            isSelected ? "scale-110" : "group-hover:scale-105"
          }`}
          style={
            platform.gradientFrom
              ? { background: `linear-gradient(135deg, ${platform.gradientFrom}, ${platform.gradientTo || platform.color})` }
              : { backgroundColor: isConnected ? platform.color : "#363738" }
          }
        >
          {platform.icon}
        </div>

        <div className="flex flex-col items-start">
          <span className="text-[13px] font-semibold leading-tight">
            {platform.name}
          </span>
          <span className="text-[11px] text-[#9A9A9C] font-medium">
            {isConnected ? platform.username || "Connected" : "Not connected"}
          </span>
        </div>

        {isSelected && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#C1CD7D] rounded-full flex items-center justify-center shadow-md">
            <svg className="w-3 h-3 text-[#1B1B1B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {!isConnected && (
          <span className="text-[10px] bg-[#363738] text-[#9A9A9C] px-2 py-0.5 rounded-full font-medium">
            Connect
          </span>
        )}
      </button>
    );
  };

  if (showCategories) {
    const groupedPlatforms = Object.entries(CATEGORY_LABELS)
      .map(([key, label]) => ({
        category: key as PlatformCategory,
        label,
        platforms: platforms.filter((p) => p.category === key),
      }))
      .filter((g) => g.platforms.length > 0);

    return (
      <div className="flex flex-col gap-6">
        {groupedPlatforms.map((group) => (
          <div key={group.category}>
            <label className="text-[12px] font-semibold text-[#9A9A9C] uppercase tracking-wider mb-3 block">
              {group.label}
            </label>
            <div className="flex gap-3 flex-wrap">
              {group.platforms.map(renderPlatformButton)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-[13px] font-semibold text-[#9A9A9C] uppercase tracking-wider">
        Publish to
      </label>
      <div className="flex gap-3 flex-wrap">
        {platforms.map(renderPlatformButton)}
      </div>
    </div>
  );
}
