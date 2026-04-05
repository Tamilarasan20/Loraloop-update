"use client";

import React from "react";
import { Shield, PenTool, Layout, Loader2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "thinking" | "working" | "success" | "error";
  icon: React.ElementType;
  description: string;
}

const AGENTS: Agent[] = [
  {
    id: "aura",
    name: "Aura",
    role: "Brand Strategist",
    status: "idle",
    icon: Shield,
    description: "Monitors Brand DNA and enforces visual/tonal consistency."
  },
  {
    id: "echo",
    name: "Echo",
    role: "Content Creator",
    status: "idle",
    icon: PenTool,
    description: "Generates high-engagement copy and creative social assets."
  },
  {
    id: "nexus",
    name: "Nexus",
    role: "Ops Manager",
    status: "idle",
    icon: Layout,
    description: "Handles cross-platform distribution and scheduling logic."
  }
];

export default function AgentSquad({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {AGENTS.map((agent) => (
        <div 
          key={agent.id}
          className={`group p-4 rounded-2xl border transition-all duration-500 shadow-sm ${
            isActive 
              ? "bg-white border-[#C1CD7D]/40" 
              : "bg-gray-50 border-gray-200 opacity-60"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl transition-all ${
              isActive ? "bg-[#C1CD7D] text-white" : "bg-gray-100 text-gray-400"
            }`}>
              <agent.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-bold tracking-tight">{agent.name}</h3>
                {isActive && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse"></div>
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Active</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] font-bold text-[#C1CD7D] uppercase tracking-widest mb-2">{agent.role}</p>
              <p className="text-xs text-gray-500 leading-relaxed font-normal">{agent.description}</p>
            </div>
          </div>
          
          {isActive && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-[#C1CD7D] animate-spin" />
                <span className="text-[10px] text-gray-500 font-mono italic">
                  {agent.id === "aura" ? "Verifying brand alignment..." : agent.id === "echo" ? "Drafting post content..." : "Syncing queue headers..."}
                </span>
              </div>
              <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#C1CD7D] w-2/3 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
