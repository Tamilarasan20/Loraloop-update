"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Globe, Loader2, Plus, Sparkles } from "lucide-react";

export default function KnowledgeBasePage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/get-all-businesses")
      .then(res => res.json())
      .then(data => {
        setBusinesses(data.businesses || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load knowledge base", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-10 pl-[280px]">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-[#111111] tracking-tight mb-2 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-[#3B82F6]" />
              Lora Knowledge Base
            </h1>
            <p className="text-[#71717A] text-[15px]">
              Access previously analysed brands or extract new brand DNA.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            New Extraction
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-16 text-center shadow-sm">
            <Globe className="w-12 h-12 text-[#D4D4D8] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#111111] mb-2">No Brands Found</h3>
            <p className="text-[#71717A] mb-6">You haven't extracted any website DNA yet.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#111111] hover:bg-[#27272A] text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((b) => (
              <Link key={b.id} href={`/chat?id=${b.id}`} className="group block">
                <div className="bg-white border border-[#E5E7EB] hover:border-[#3B82F6]/50 rounded-2xl p-6 transition-all hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)] hover:-translate-y-1 h-full flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {b.business_name?.charAt(0) || <Globe className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#111111] truncate">{b.business_name || "Unknown Brand"}</h3>
                      <p className="text-[13px] text-[#A1A1AA] truncate">{b.website}</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#F4F4F5]">
                    <span className="text-[12px] font-medium text-[#71717A] bg-[#F4F4F5] px-2.5 py-1 rounded-md">
                      {new Date(b.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center text-[#3B82F6] text-[13px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                      Chat with Lora <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
