"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandBoard from "@/components/BrandBoard";
import { Loader2 } from "lucide-react";

export default function BoardPage() {
  const [dna, setDna] = useState<Record<string, unknown> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("brandDna");
    if (stored) {
      try {
        setDna(JSON.parse(stored));
      } catch {
        console.error("Failed to parse stored DNA");
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  if (!dna) {
    return (
      <div className="min-h-screen bg-[#1a1c1a] flex items-center justify-center pl-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#d9ebd0]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1c1a] text-zinc-50 font-sans overflow-x-hidden selection:bg-[#343a34] pl-[200px] transition-all">
      <div className="flex flex-col items-center pt-16 px-6 sm:px-10">
        <div className="mb-8 text-center">
          <div className="mx-auto flex justify-center mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#d9ebd0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#d9ebd0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#d9ebd0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-serif italic mb-2 tracking-tight">Your Business DNA</h1>
          <p className="text-[#a0a8a0] text-sm max-w-lg mx-auto leading-relaxed">
            Here is a snapshot of your business that we&apos;ll use to create social media campaigns. Feel free to edit this at anytime.
          </p>
        </div>
        
        <BrandBoard initialDna={dna} />
      </div>
    </div>
  );
}

