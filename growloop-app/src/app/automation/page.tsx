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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors text-[14px] font-bold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-gray-200" />
          <h1 className="text-[20px] font-bold flex items-center gap-2 tracking-tight">
            <Zap className="w-5 h-5 text-lime-500" />
            Automation
          </h1>
        </div>
        <button className="flex items-center gap-2 bg-lime-400 text-white px-6 py-2.5 rounded-full font-bold text-[13px] hover:bg-lime-500 transition-all shadow-md active:scale-95">
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-[32px] font-bold text-lime-600">{rules.filter(r => r.enabled).length}</div>
            <div className="text-[13px] text-gray-400 font-bold uppercase tracking-wider">Active Rules</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-[32px] font-bold text-gray-900">1,247</div>
            <div className="text-[13px] text-gray-400 font-bold uppercase tracking-wider">Actions This Month</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-[32px] font-bold text-gray-900">~4.2 hrs</div>
            <div className="text-[13px] text-gray-400 font-bold uppercase tracking-wider">Time Saved</div>
          </div>
        </div>

        {/* Rules List */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-2">Configure Rules</h2>
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-white border rounded-[24px] p-8 flex items-start gap-6 transition-all shadow-sm group hover:shadow-md hover:border-lime-300 ${
                rule.enabled ? "border-gray-200" : "border-gray-100 opacity-60 grayscale-[0.5]"
              }`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border ${
                rule.enabled ? "bg-lime-50 text-lime-600 border-lime-100" : "bg-gray-50 text-gray-400 border-gray-100"
              }`}>
                <rule.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-[18px] font-bold text-gray-900">
                    {rule.name}
                  </h3>
                  {!rule.enabled && (
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-[14px] text-gray-500 mb-5 font-bold leading-relaxed">
                  {rule.description}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] bg-gray-50 border border-gray-100 text-gray-500 px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider">
                    ⚡ {rule.trigger}
                  </span>
                  <span className="text-gray-300 font-bold">→</span>
                  <span className="text-[11px] bg-lime-50 border border-lime-100 text-lime-600 px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider">
                    🎯 {rule.action}
                  </span>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggleRule(rule.id)}
                className={`relative w-14 h-8 rounded-full transition-all shrink-0 shadow-inner border ${
                  rule.enabled ? "bg-lime-400 border-lime-500" : "bg-gray-100 border-gray-200"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all ${
                    rule.enabled ? "left-7" : "left-1"
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
