"use client";

import React, { useState, useEffect } from "react";
import AgentSquad from "@/components/agent/AgentSquad";
import MissionFeed from "@/components/agent/MissionFeed";
import TaskBoard from "@/components/agent/TaskBoard";
import { Brain, Rocket, Activity, ShieldCheck, Zap } from "lucide-react";

export default function MissionControlPage() {
  const [isMissionActive, setIsMissionActive] = useState(false);
  const [activeDna, setActiveDna] = useState<{ name: string; industry: string } | null>(null);

  useEffect(() => {
    // Simulate fetching active DNA context
    const stored = localStorage.getItem("brand-dna");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setActiveDna({ name: data.businessName || "Unknown Brand", industry: data.industry || "General" });
      } catch (e) {
        setActiveDna({ name: "ScaleSoci Mock", industry: "Design" });
      }
    } else {
      setActiveDna({ name: "ScaleSoci Demo", industry: "SaaS" });
    }
  }, []);

  return (
    <div className="flex bg-gray-50 min-h-screen text-gray-900 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8 flex flex-col gap-8 overflow-hidden">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#C1CD7D]/20 rounded-lg">
                <Rocket className="w-5 h-5 text-[#C1CD7D]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Active Mission: Growth Sprint</h1>
                <p className="text-sm text-gray-500">Autonomous social operations in progress</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsMissionActive(!isMissionActive)}
              className={`px-6 py-2.5 rounded-full font-medium transition-all shadow-sm border border-transparent flex items-center gap-2 ${
                isMissionActive 
                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                  : "bg-[#C1CD7D] text-white hover:scale-102 active:scale-98"
              }`}
            >
              {isMissionActive ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  Abort Mission
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  Launch Squad
                </>
              )}
            </button>
          </div>

          {/* Main Grid */}
          <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
            {/* Left: Agent Squad */}
            <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Squad Status</div>
              <AgentSquad isActive={isMissionActive} />
            </div>

            {/* Center: Live Action Feed */}
            <div className="col-span-6 flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-600">Live Agent Stream</span>
                </div>
                <div className="text-[10px] text-gray-400 font-mono tracking-tighter">
                  SESSION_ID: GL_{Math.random().toString(36).substring(7).toUpperCase()}
                </div>
              </div>
              <MissionFeed isActive={isMissionActive} />
            </div>

            {/* Right: Mission Queue */}
            <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Task Queue</div>
              <TaskBoard isActive={isMissionActive} />
            </div>
          </div>

          {/* Bottom Dock: Brand DNA Context Persistence */}
          <div className="h-16 bg-white border border-gray-200 shadow-sm rounded-2xl flex items-center px-6 justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#C1CD7D]" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Context:</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full">
                <div className="w-2 h-2 rounded-full bg-[#C1CD7D]"></div>
                <span className="text-xs font-medium text-gray-700">{activeDna?.name}</span>
                <span className="text-[10px] text-gray-300">•</span>
                <span className="text-[10px] text-gray-500">{activeDna?.industry}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="w-4 h-4 text-green-600/60" />
                <span>On-Brand Enforcement: 100%</span>
              </div>
              <div className="h-4 w-[1px] bg-gray-200"></div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Zap className="w-4 h-4 text-[#C1CD7D]" />
                <span>Next Post: 2h 15m</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
