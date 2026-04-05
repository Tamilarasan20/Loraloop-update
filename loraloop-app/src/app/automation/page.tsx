"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Zap, Clock, Heart, MessageCircle, RefreshCw, Power } from "lucide-react";
import Link from "next/link";

interface Rule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  platforms: string[];
  description: string;
  icon: React.ElementType;
}

const RULES: Rule[] = [
  {
    id: "1",
    name: "Auto-Post from Queue",
    trigger: "Every day at 9:00 AM",
    action: "Publish next post from queue",
    enabled: true,
    platforms: ["x", "linkedin"],
    description: "Automatically publishes the next queued post at your optimal time",
    icon: Clock,
  },
  {
    id: "2",
    name: "Engagement Auto-Like",
    trigger: "When someone comments",
    action: "Auto-like their comment",
    enabled: true,
    platforms: ["instagram", "x"],
    description: "Automatically likes comments on your posts to boost engagement",
    icon: Heart,
  },
  {
    id: "3",
    name: "Auto Thank You Reply",
    trigger: "New follower",
    action: "Send welcome DM",
    enabled: false,
    platforms: ["x"],
    description: "Sends a personalized welcome message to new followers",
    icon: MessageCircle,
  },
  {
    id: "4",
    name: "Cross-Post to LinkedIn",
    trigger: "Post published on X",
    action: "Repost to LinkedIn (adapted)",
    enabled: true,
    platforms: ["x", "linkedin"],
    description: "Automatically adapts and reposts your X posts to LinkedIn",
    icon: RefreshCw,
  },
];

export default function AutomationPage() {
  const [rules, setRules] = useState(RULES);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

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
          <h1 className="text-[20px] font-medium flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#C1CD7D]" />
            Automation
          </h1>
        </div>
        <button className="flex items-center gap-2 bg-[#C1CD7D] text-[#1B1B1B] px-5 py-2.5 rounded-full font-semibold text-[13px] hover:bg-[#D4E08F] transition-colors shadow-lg">
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#2C2D2E] border border-white/5 rounded-2xl p-5 text-center">
            <div className="text-[28px] font-bold text-[#C1CD7D]">{rules.filter(r => r.enabled).length}</div>
            <div className="text-[13px] text-[#9A9A9C] font-medium">Active Rules</div>
          </div>
          <div className="bg-[#2C2D2E] border border-white/5 rounded-2xl p-5 text-center">
            <div className="text-[28px] font-bold text-[#EAEAEA]">1,247</div>
            <div className="text-[13px] text-[#9A9A9C] font-medium">Actions This Month</div>
          </div>
          <div className="bg-[#2C2D2E] border border-white/5 rounded-2xl p-5 text-center">
            <div className="text-[28px] font-bold text-[#EAEAEA]">~4.2 hrs</div>
            <div className="text-[13px] text-[#9A9A9C] font-medium">Time Saved</div>
          </div>
        </div>

        {/* Rules List */}
        <div className="flex flex-col gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-[#2C2D2E] border rounded-[20px] p-6 flex items-start gap-5 transition-all ${
                rule.enabled ? "border-white/5" : "border-white/5 opacity-60"
              }`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                rule.enabled ? "bg-[#C1CD7D]/15 text-[#C1CD7D]" : "bg-white/5 text-[#9A9A9C]"
              }`}>
                <rule.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-[#EAEAEA] mb-1">
                  {rule.name}
                </h3>
                <p className="text-[13px] text-[#9A9A9C] mb-3 font-medium">
                  {rule.description}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] bg-[#363738] text-[#9A9A9C] px-3 py-1 rounded-full font-medium">
                    ⚡ {rule.trigger}
                  </span>
                  <span className="text-[#525355]">→</span>
                  <span className="text-[11px] bg-[#363738] text-[#9A9A9C] px-3 py-1 rounded-full font-medium">
                    🎯 {rule.action}
                  </span>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggleRule(rule.id)}
                className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                  rule.enabled ? "bg-[#C1CD7D]" : "bg-[#414244]"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    rule.enabled ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
