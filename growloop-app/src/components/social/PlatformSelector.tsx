"use client";

import { useState, useEffect } from "react";
import { getChannels } from "@/lib/postiz-client";
import type { Channel } from "@/lib/postiz-types";

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
    username: "@scalesoci.ai",
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
    username: "ScaleSoci AI",
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
    username: "@scalesoci",
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
    username: "ScaleSoci AI",
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
  const [fetchedPlatforms, setFetchedPlatforms] = useState<Platform[]>(ALL_PLATFORMS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlatforms() {
      try {
        const channels = await getChannels();
        
        // Map fetched channels to the Platform type, merge with existing ones for base info (icon, color)
        const mappedPlatforms = ALL_PLATFORMS.map((basePlatform) => {
          // Find matching channel by type (e.g., 'x', 'linkedin')
          const channel = channels.find((c) => c.type === basePlatform.type);
          
          if (channel) {
            return {
              ...basePlatform,
              id: channel.id, // Use real Postiz channel ID
              name: channel.name,
              connected: !channel.disabled,
              username: channel.profile || channel.name, // Use 'profile' from Channel
            };
          }
          return basePlatform;
        });
        
        // Ensure all active channels are shown even if not in ALL_PLATFORMS initially
        channels.forEach(channel => {
            if (!mappedPlatforms.some(p => p.id === channel.id)) {
                 const base = ALL_PLATFORMS.find(p => p.type === channel.type);
                 if (base) {
                     mappedPlatforms.push({
                         ...base,
                         id: channel.id,
                         name: channel.name,
                         connected: !channel.disabled,
                         username: channel.profile || channel.name // Use 'profile' from Channel
                     });
                 }
            }
        });

        setFetchedPlatforms(mappedPlatforms);
      } catch (error) {
        console.error("Failed to fetch channels:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlatforms();
  }, []);

  const platforms = filterCategories
    ? fetchedPlatforms.filter((p) => filterCategories.includes(p.category))
    : fetchedPlatforms;

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
          relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-300 group
          ${
            isSelected
              ? "border-lime-400 bg-lime-50 text-gray-900 shadow-md shadow-lime-100"
              : isConnected
              ? "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-900 shadow-sm"
              : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-60"
          }
        `}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-[14px] shrink-0 transition-transform shadow-sm ${
            isSelected ? "scale-110" : "group-hover:scale-105"
          }`}
          style={
            platform.gradientFrom
              ? { background: `linear-gradient(135deg, ${platform.gradientFrom}, ${platform.gradientTo || platform.color})` }
              : { backgroundColor: isConnected ? platform.color : "#cbd5e1" }
          }
        >
          {platform.icon}
        </div>

        <div className="flex flex-col items-start">
          <span className="text-[13px] font-bold leading-tight">
            {platform.name}
          </span>
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">
            {isConnected ? platform.username || "Connected" : "Not connected"}
          </span>
        </div>

        {isSelected && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-lime-500 rounded-full flex items-center justify-center shadow-md border border-white">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {!isConnected && (
          <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase">
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <label className="text-[13px] font-semibold text-[#9A9A9C] uppercase tracking-wider">
          Publish to
        </label>
        <div className="flex items-center gap-3 h-14">
           <div className="w-5 h-5 border-2 border-[#C1CD7D] border-t-transparent rounded-full animate-spin" />
           <span className="text-[13px] text-[#9A9A9C]">Loading channels...</span>
        </div>
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
