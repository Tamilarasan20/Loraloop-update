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
    <div className="bg-white border border-gray-200 rounded-[20px] p-6 flex items-center gap-5 hover:border-lime-300 transition-all group shadow-sm hover:shadow-md">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-[20px] shrink-0 shadow-md border border-transparent shadow-inner"
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
          <span className="text-[16px] font-bold text-gray-900">{platform.name}</span>
          {platform.connected && (
            <div className="bg-green-50 rounded-full p-0.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          )}
        </div>
        <span className="text-[13px] text-gray-400 font-bold block mt-0.5">
          {platform.connected ? platform.username || "Connected Account" : "Available Extension"}
        </span>
      </div>
      <button
        className={`px-6 py-2.5 rounded-xl font-bold text-[13px] transition-all shadow-sm active:scale-95 border ${
          platform.connected
            ? "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 border-gray-100"
            : "bg-lime-400 text-white hover:bg-lime-500 border-lime-500 shadow-lime-100"
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors text-[14px] font-bold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-gray-200" />
          <h1 className="text-[20px] font-bold tracking-tight">Integrations</h1>
          <span className="text-[11px] bg-lime-50 text-lime-600 border border-lime-100 px-3 py-1 rounded-full font-extrabold uppercase tracking-widest">
            {connectedCount} connected
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-10">
        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations..."
            className="w-full bg-white border border-gray-100 rounded-[20px] py-4.5 pl-12 pr-4 text-gray-900 text-[15px] outline-none focus:border-lime-500 font-bold placeholder-gray-300 shadow-sm transition-all shadow-inner"
          />
        </div>

        {/* Groups */}
        {groups.map((group, index) => (
          <section key={group.key} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[24px] filter drop-shadow-sm">{group.icon}</span>
              <h2 className="text-[18px] font-extrabold text-gray-900 tracking-tight">{group.label}</h2>
            </div>
            <p className="text-[14px] text-gray-400 mb-6 font-bold leading-relaxed">
              {group.description}
            </p>
            <div className="flex flex-col gap-4">
              {group.platforms.map((platform) => (
                <IntegrationCard key={platform.id} platform={platform} />
              ))}
            </div>
            {group.key !== groups[groups.length - 1].key && (
              <div className="border-t border-gray-200 my-8" />
            )}
          </section>
        ))}

        {/* Bottom CTA */}
        <div className="bg-white border-2 border-lime-100 rounded-[32px] p-8 flex items-center gap-6 shadow-xl shadow-lime-600/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-lime-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="w-14 h-14 rounded-2xl bg-lime-400 flex items-center justify-center text-white shrink-0 shadow-lg relative z-10">
            <ExternalLink className="w-7 h-7" />
          </div>
          <div className="flex-1 relative z-10">
            <h4 className="text-[16px] font-extrabold text-gray-900 mb-1">
              Missing a platform?
            </h4>
            <p className="text-[14px] text-gray-500 font-bold leading-tight">
              Connect Zapier to integrate with 5,000+ apps, or request a custom integration from our team.
            </p>
          </div>
          <button className="bg-gray-900 text-white px-6 py-3 rounded-xl text-[14px] font-bold hover:bg-black transition-all shadow-lg active:scale-95 relative z-10">
            Request →
          </button>
        </div>
      </div>
    </div>
  );
}
