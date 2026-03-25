"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Settings, ExternalLink, RefreshCw, Zap } from "lucide-react";
import Link from "next/link";

interface ChannelConnection {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  gradientFrom?: string;
  gradientTo?: string;
  connected: boolean;
  username?: string;
  category: "social" | "blog" | "email" | "ads" | "other" | "automation";
  switchable?: boolean; // Can switch to a different platform in this slot
  alternates?: { name: string; type: string }[];
}

const CONTENT_PLAN_CHANNELS: ChannelConnection[] = [
  // In your Content Plan — Autopilot channels
  { id: "1", name: "Instagram", type: "instagram", icon: "📷", color: "#E1306C", gradientFrom: "#F58529", gradientTo: "#DD2A7B", connected: true, username: "@growloop.ai", category: "social" },
  { id: "2", name: "Facebook", type: "facebook", icon: "f", color: "#1877F2", connected: false, category: "social" },
  { id: "3", name: "YouTube", type: "youtube", icon: "▶", color: "#FF0000", connected: false, category: "social" },
  { id: "4", name: "WordPress", type: "wordpress", icon: "W", color: "#21759B", connected: false, category: "blog", switchable: true, alternates: [{ name: "Medium", type: "medium" }, { name: "Ghost", type: "ghost" }, { name: "Webflow", type: "webflow" }] },
  { id: "5", name: "Mailchimp", type: "mailchimp", icon: "🐵", color: "#FFE01B", connected: false, category: "email", switchable: true, alternates: [{ name: "SendGrid", type: "sendgrid" }, { name: "Brevo", type: "brevo" }, { name: "ConvertKit", type: "convertkit" }] },
];

const AVAILABLE_CHANNELS: ChannelConnection[] = [
  // Available to add
  { id: "a1", name: "X / Twitter", type: "x", icon: "𝕏", color: "#000000", connected: false, category: "social" },
  { id: "a2", name: "TikTok", type: "tiktok", icon: "♪", color: "#010101", connected: false, category: "social" },
  { id: "a3", name: "LinkedIn", type: "linkedin", icon: "in", color: "#0A66C2", connected: false, category: "social" },
  { id: "a4", name: "Google Business Profile", type: "google_business", icon: "G", color: "#4285F4", connected: false, category: "social" },
  { id: "a5", name: "Meta Ads", type: "meta_ads", icon: "📢", color: "#0668E1", connected: false, category: "ads" },
  { id: "a6", name: "Google Drive", type: "google_drive", icon: "📁", color: "#0F9D58", connected: false, category: "other" },
  { id: "a7", name: "Zapier", type: "zapier", icon: "⚡", color: "#FF4A00", connected: false, category: "automation" },
];

const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  social: { label: "Social Media", description: "Post and schedule across social platforms" },
  blog: { label: "Blog", description: "Publish articles to your blog" },
  email: { label: "Email", description: "Send newsletters and email campaigns" },
  ads: { label: "Ads", description: "Manage advertising campaigns" },
  other: { label: "Other", description: "Additional tools and integrations" },
  automation: { label: "Automation Tools", description: "Connect to automation platforms" },
};

function ChannelCard({ channel, numbered, showSwitch }: { channel: ChannelConnection; numbered?: number; showSwitch?: boolean }) {
  return (
    <div className="flex items-center gap-4 bg-[#2C2D2E] border border-white/5 rounded-2xl px-5 py-4 hover:border-white/10 transition-all group">
      {/* Number */}
      {numbered !== undefined && (
        <span className="text-[14px] font-semibold text-[#525355] w-5 text-center shrink-0">
          {numbered}
        </span>
      )}

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-[16px] shrink-0 shadow-lg"
        style={
          channel.gradientFrom
            ? { background: `linear-gradient(135deg, ${channel.gradientFrom}, ${channel.gradientTo || channel.color})` }
            : { backgroundColor: channel.color }
        }
      >
        {channel.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-[#EAEAEA]">{channel.name}</span>
          {channel.connected && (
            <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-semibold">
              Connected
            </span>
          )}
        </div>
        {channel.username && (
          <span className="text-[12px] text-[#9A9A9C]">{channel.username}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {showSwitch && channel.switchable && (
          <button className="text-[11px] bg-[#363738] text-[#9A9A9C] hover:text-[#EAEAEA] px-3 py-1.5 rounded-xl font-semibold hover:bg-[#414244] transition-colors flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" />
            Switch Platform
          </button>
        )}
        
        <button
          className={`px-5 py-2 rounded-xl font-semibold text-[13px] transition-all ${
            channel.connected
              ? "bg-[#363738] text-[#9A9A9C] hover:bg-[#414244] hover:text-[#EAEAEA]"
              : "bg-[#C1CD7D] text-[#1B1B1B] hover:bg-[#D4E08F] shadow-md"
          }`}
        >
          {channel.connected ? (
            <span className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Manage
            </span>
          ) : (
            "Connect"
          )}
        </button>
      </div>
    </div>
  );
}

export default function ContentPlanPage() {
  const [planChannels] = useState(CONTENT_PLAN_CHANNELS);
  const [availableChannels] = useState(AVAILABLE_CHANNELS);

  // Group available channels by category
  const groupedAvailable = Object.entries(CATEGORY_LABELS)
    .map(([key, config]) => ({
      key,
      ...config,
      channels: availableChannels.filter((c) => c.category === key),
    }))
    .filter((g) => g.channels.length > 0);

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
          <h1 className="text-[20px] font-medium">Content Plan</h1>
        </div>
        <button className="flex items-center gap-2 bg-[#C1CD7D] text-[#1B1B1B] px-5 py-2.5 rounded-full font-semibold text-[13px] hover:bg-[#D4E08F] transition-colors shadow-lg">
          <Zap className="w-4 h-4" />
          Enable Autopilot
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-10">
        {/* ─── In Your Content Plan ─── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[17px] font-semibold text-[#EAEAEA]">
              In your Content Plan
            </h2>
          </div>
          <p className="text-[13px] text-[#9A9A9C] mb-5 font-medium">
            Autopilot will create and autopost content for these channels
          </p>

          {/* Grouped by category */}
          <div className="flex flex-col gap-6">
            {/* Social Media */}
            {(() => {
              const socialChannels = planChannels.filter((c) => c.category === "social");
              if (socialChannels.length === 0) return null;
              return (
                <div>
                  <label className="text-[11px] font-bold text-[#9A9A9C] uppercase tracking-widest mb-3 block">
                    Social Media
                  </label>
                  <div className="flex flex-col gap-3">
                    {socialChannels.map((channel, i) => (
                      <ChannelCard key={channel.id} channel={channel} numbered={i + 1} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Blog */}
            {(() => {
              const blogChannels = planChannels.filter((c) => c.category === "blog");
              if (blogChannels.length === 0) return null;
              return (
                <div>
                  <label className="text-[11px] font-bold text-[#9A9A9C] uppercase tracking-widest mb-3 block">
                    Blog
                  </label>
                  <div className="flex flex-col gap-3">
                    {blogChannels.map((channel, i) => (
                      <ChannelCard key={channel.id} channel={channel} numbered={planChannels.filter(c => c.category === "social").length + i + 1} showSwitch />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Email */}
            {(() => {
              const emailChannels = planChannels.filter((c) => c.category === "email");
              if (emailChannels.length === 0) return null;
              return (
                <div>
                  <label className="text-[11px] font-bold text-[#9A9A9C] uppercase tracking-widest mb-3 block">
                    Email
                  </label>
                  <div className="flex flex-col gap-3">
                    {emailChannels.map((channel, i) => (
                      <ChannelCard key={channel.id} channel={channel} numbered={planChannels.filter(c => c.category !== "email").length + i + 1} showSwitch />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* ─── Available to Add ─── */}
        <section>
          <h2 className="text-[17px] font-semibold text-[#EAEAEA] mb-2">
            Available to add to your Content Plan
          </h2>
          <p className="text-[13px] text-[#9A9A9C] mb-6 font-medium">
            Connect additional platforms and tools to expand your content reach
          </p>

          <div className="flex flex-col gap-8">
            {groupedAvailable.map((group) => (
              <div key={group.key}>
                <label className="text-[11px] font-bold text-[#9A9A9C] uppercase tracking-widest mb-3 block">
                  {group.label}
                </label>
                <div className="flex flex-col gap-3">
                  {group.channels.map((channel) => (
                    <ChannelCard key={channel.id} channel={channel} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Integration Help */}
        <div className="bg-[#2C2D2E] border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C1CD7D]/15 flex items-center justify-center text-[#C1CD7D] shrink-0">
            <ExternalLink className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-[14px] font-semibold text-[#EAEAEA] mb-0.5">
              Need a different integration?
            </h4>
            <p className="text-[13px] text-[#9A9A9C]">
              Use Zapier to connect 5,000+ apps or request a custom integration.
            </p>
          </div>
          <button className="text-[#C1CD7D] text-[13px] font-semibold hover:underline shrink-0">
            Learn More →
          </button>
        </div>
      </div>
    </div>
  );
}
