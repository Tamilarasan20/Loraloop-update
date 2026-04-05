"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Shield, PenTool, Layout, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";

type EventType = "THOUGHT" | "ACTION" | "RESULT" | "ERROR" | "SUCCESS";

interface MissionEvent {
  id: string;
  agent: "AURA" | "ECHO" | "NEXUS" | "SYSTEM";
  type: EventType;
  message: string;
  timestamp: string;
}

const INITIAL_EVENTS: MissionEvent[] = [
  {
    id: "1",
    agent: "SYSTEM",
    type: "ACTION",
    message: "Initializing ScaleSoci Squad v2.4.0...",
    timestamp: new Date().toLocaleTimeString()
  },
  {
    id: "2",
    agent: "AURA",
    type: "THOUGHT",
    message: "Analyzing active Brand DNA: GrowthLoop Demo (SaaS)",
    timestamp: new Date().toLocaleTimeString()
  }
];

const AGENT_MOCK_MESSAGES = [
  { agent: "AURA", type: "THOUGHT", message: "Evaluating content alignment with 'Innovation' core value." },
  { agent: "ECHO", type: "ACTION", message: "Generating LinkedIn post draft for 'AI Social Automation'." },
  { agent: "NEXUS", type: "ACTION", message: "Polling Postiz API for best engagement window." },
  { agent: "AURA", type: "RESULT", message: "Brand safety check passed. Tone: Professional & Technical." },
  { agent: "ECHO", type: "RESULT", message: "Draft content ready: 'How AI Agents are changing the game...'" },
  { agent: "NEXUS", type: "ACTION", message: "Mapping content to Instagram and X adapters." },
  { agent: "SYSTEM", type: "SUCCESS", message: "Social sequence generated and added to Mission Queue." }
];

export default function MissionFeed({ isActive }: { isActive: boolean }) {
  const [events, setEvents] = useState<MissionEvent[]>(INITIAL_EVENTS);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        const nextMsg = AGENT_MOCK_MESSAGES[Math.floor(Math.random() * AGENT_MOCK_MESSAGES.length)];
        const newEvent: MissionEvent = {
          id: Date.now().toString(),
          agent: nextMsg.agent as any,
          type: nextMsg.type as EventType,
          message: nextMsg.message,
          timestamp: new Date().toLocaleTimeString()
        };
        setEvents(prev => [...prev.slice(-40), newEvent]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getIcon = (agent: string) => {
    switch (agent) {
      case "AURA": return <Shield className="w-3 h-3" />;
      case "ECHO": return <PenTool className="w-3 h-3" />;
      case "NEXUS": return <Layout className="w-3 h-3" />;
      case "SYSTEM": return <Terminal className="w-3 h-3" />;
      default: return <Zap className="w-3 h-3" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "THOUGHT": return "text-purple-600 bg-purple-50 border-purple-100";
      case "ACTION": return "text-blue-600 bg-blue-50 border-blue-100";
      case "RESULT": return "text-lime-700 bg-lime-50 border-lime-200";
      case "ERROR": return "text-red-600 bg-red-50 border-red-100";
      case "SUCCESS": return "text-green-600 bg-green-50 border-green-100";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 p-4 font-mono text-[11px] overflow-y-auto custom-scrollbar bg-gray-50/50"
    >
      <div className="flex flex-col gap-2.5">
        {events.map((event) => (
          <div key={event.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-1 duration-300">
            <span className="text-gray-400 w-16 shrink-0 tracking-tighter">[{event.timestamp}]</span>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border shadow-sm ${getBadgeColor(event.type)}`}>
              {getIcon(event.agent)}
              <span className="font-bold uppercase tracking-tighter">{event.agent}</span>
            </div>
            <span className={`flex-1 leading-relaxed ${event.type === 'THOUGHT' ? 'text-gray-400 italic' : 'text-gray-700 font-medium'}`}>
              {event.message}
            </span>
          </div>
        ))}
        {!isActive && (
          <div className="mt-4 p-8 flex flex-col items-center justify-center gap-3 border border-dashed border-gray-300 rounded-2xl">
            <Shield className="w-8 h-8 text-[#C1CD7D]" />
            <p className="text-gray-500 text-center font-sans tracking-tight">Mission Control is Standby.<br/>Launch the Squad to begin autonomous social operations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
