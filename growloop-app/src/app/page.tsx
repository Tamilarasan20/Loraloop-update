"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    router.push(`/loading?url=${encodeURIComponent(url)}`);
  };

  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[#FAFBFC]">
      {/* Background radial gradient equivalent to mockup */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-white via-white to-blue-50/30 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-[560px] px-6">
        <div className="bg-white rounded-[32px] p-10 md:p-14 flex flex-col items-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F4F4F5]">
          <h1 className="text-[32px] font-bold text-[#111111] tracking-tight mb-3">
            Enter your website
          </h1>
          <p className="text-[15px] text-[#71717A] leading-relaxed max-w-[320px] mb-10 font-medium h-12">
            We'll analyse your business details<br/>and generate knowledge profile
          </p>

          <form onSubmit={handleSubmit} className="w-full relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourwebsite.com"
              className="w-full h-14 pl-6 pr-14 rounded-full border border-[#E5E7EB] bg-white text-[15px] text-[#111111] outline-none hover:border-[#D4D4D8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#A1A1AA]"
            />
            <button
              type="submit"
              disabled={!url.trim()}
              className="absolute right-2 top-2 bottom-2 w-10 bg-[#F4F4F5] rounded-full flex items-center justify-center text-[#71717A] hover:bg-[#E5E7EB] hover:text-[#111111] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
