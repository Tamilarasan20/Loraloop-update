"use client";

import { useState } from "react";
import { ArrowLeft, Search, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ALL_PLATFORMS, type Platform, type PlatformCategory } from "../../components/social/PlatformSelector";

const CATEGORY_CONFIG: Record<PlatformCategory, { label: string; icon: string; description: string }> = {
  social: { label: "Social Media", icon: "📱", description: "Connect your social media accounts to publish and schedule content" },
  blog: { label: "Blog", icon: "📝", description: "Publish articles directly to your blog platform" },
  email: { label: "Email Marketing", icon: "📧", description: "Send newsletters and email campaigns" },
  ads: { label: "Advertising", icon: "📢", description: "Run ads across social and search platforms" },
  other: { label: "Other Tools", icon: "🔧", description: "Additional productivity and storage integrations" },
  automation: { label: "Automation", icon: "⚡", description: "Connect automation platforms for advanced workflows" },
};

function IntegrationCard({ platform }: { platform: Platform }) {
  return (
    <div className="bg-[#2C2D2E] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-all group">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-[18px] shrink-0 shadow-lg"
        style={
          platform.gradientFrom
            ? { background: `linear-gradient(135deg, ${platform.gradientFrom}, ${platform.gradientTo || platform.color})` }
            : { backgroundColor: platform.color }
        }
      >
        {platform.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-[#EAEAEA]">{platform.name}</span>
          {platform.connected && (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
        </div>
        <span className="text-[12px] text-[#9A9A9C]">
          {platform.connected ? platform.username || "Connected" : "Available"}
        </span>
      </div>
      <button
        className={`px-5 py-2.5 rounded-xl font-semibold text-[13px] transition-all ${
          platform.connected
            ? "bg-[#363738] text-[#9A9A9C] hover:bg-[#414244] hover:text-[#EAEAEA]"
            : "bg-[#C1CD7D] text-[#1B1B1B] hover:bg-[#D4E08F] shadow-md hover:shadow-lg"
        }`}
      >
        {platform.connected ? "Manage" : "Connect"}
      </button>
    </div>
  );
}

export default function IntegrationsPage() {
  const [search, setSearch] = useState("");

  const filteredPlatforms = search
    ? ALL_PLATFORMS.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.type.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_PLATFORMS;

  const groups = (Object.entries(CATEGORY_CONFIG) as [PlatformCategory, typeof CATEGORY_CONFIG.social][])
    .map(([key, config]) => ({
      key,
      ...config,
      platforms: filteredPlatforms.filter((p) => p.category === key),
    }))
    .filter((g) => g.platforms.length > 0);

  const connectedCount = ALL_PLATFORMS.filter((p) => p.connected).length;

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
          <h1 className="text-[20px] font-medium">Integrations</h1>
          <span className="text-[12px] bg-[#C1CD7D]/15 text-[#C1CD7D] px-3 py-1 rounded-full font-semibold">
            {connectedCount} connected
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9A9A9C] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="w-full bg-[#2C2D2E] border border-transparent rounded-2xl py-3.5 pl-11 pr-4 text-[#EAEAEA] text-[14px] outline-none focus:border-[#4A4B4D] font-medium placeholder-[#525355]"
          />
        </div>

        {/* Groups */}
        {groups.map((group) => (
          <section key={group.key}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[20px]">{group.icon}</span>
              <h2 className="text-[17px] font-semibold text-[#EAEAEA]">{group.label}</h2>
            </div>
            <p className="text-[13px] text-[#9A9A9C] mb-4 font-medium">
              {group.description}
            </p>
            <div className="flex flex-col gap-3">
              {group.platforms.map((platform) => (
                <IntegrationCard key={platform.id} platform={platform} />
              ))}
            </div>
          </section>
        ))}

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-[#C1CD7D]/10 to-[#8fa37a]/10 border border-[#C1CD7D]/20 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C1CD7D]/20 flex items-center justify-center text-[#C1CD7D] shrink-0">
            <ExternalLink className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-[14px] font-semibold text-[#EAEAEA]">
              Missing a platform?
            </h4>
            <p className="text-[13px] text-[#9A9A9C]">
              Connect Zapier to integrate with 5,000+ apps, or let us know what you need.
            </p>
          </div>
          <button className="text-[#C1CD7D] text-[13px] font-semibold hover:underline shrink-0">
            Request →
          </button>
        </div>
      </div>
    </div>
  );
}
