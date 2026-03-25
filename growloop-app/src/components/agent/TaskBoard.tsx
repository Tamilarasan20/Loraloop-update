"use client";

import React from "react";
import { Clock, Calendar, MoreHorizontal, CheckCircle2, RefreshCw } from "lucide-react";

interface Task {
  id: string;
  title: string;
  platform: string;
  status: "pending" | "review" | "done";
  time: string;
}

const TASKS: Task[] = [
  { id: "1", title: "Global Launch Post", platform: "LinkedIn", status: "done", time: "08:15 AM" },
  { id: "2", title: "Product Features Thread", platform: "X", status: "review", time: "11:30 AM" },
  { id: "3", title: "Behind the Scenes Reel", platform: "Instagram", status: "pending", time: "02:45 PM" }
];

export default function TaskBoard({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Pending / In Progress */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#C1CD7D]" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-lime-700">Next Missions</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400 italic">QUEUE: 08</span>
        </div>

        <div className="space-y-3">
          {TASKS.filter(t => t.status !== "done").map(task => (
            <div key={task.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl group hover:border-[#C1CD7D]/50 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                  task.status === "review" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}>
                  {task.status}
                </span>
                <MoreHorizontal className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
              </div>
              <p className="text-xs font-semibold text-gray-800 mb-1">{task.title}</p>
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span className="font-bold text-[#C1CD7D] active:text-[#A8B75F]">{task.platform}</span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-2.5 h-2.5" />
                  {task.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accomplishments */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 opacity-80">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Completed Today</span>
        </div>
        
        <div className="space-y-2">
          {TASKS.filter(t => t.status === "done").map(task => (
            <div key={task.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-[10px] text-gray-600 font-semibold">{task.title}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{task.platform}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 text-center">
        <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#C1CD7D] flex items-center gap-2 justify-center mx-auto transition-colors">
          <RefreshCw className="w-3 h-3" />
          Force Sync Queue
        </button>
      </div>
    </div>
  );
}
