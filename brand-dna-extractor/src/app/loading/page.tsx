"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Link as LinkIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";

const LOADING_STATUSES = [
  "Studying your brand values",
  "Analyzing your typography",
  "Extracting primary colors",
  "Identifying tone of voice",
  "Finding your logo",
  "Retrieving brand creatives"
];

function LoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlParam = searchParams.get("url") || "https://example.com";

  const targetUrl = urlParam.startsWith("http") ? urlParam : `https://${urlParam}`;

  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      router.push(`/board?url=${encodeURIComponent(targetUrl)}`);
    }, 8000);
    return () => clearTimeout(delay);
  }, [router, targetUrl]);

  return (
    <div className="min-h-screen bg-[#1B1B1B] flex flex-col items-center justify-center relative overflow-hidden text-center pt-20 pb-16 px-4">
      <div className="absolute top-6 left-6 z-20">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-[#EAEAEA] bg-[#2C2D2E] hover:bg-[#363738] rounded-full px-5 py-2.5 font-medium text-[13px] border border-white/5 shadow-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[800px] bg-gradient-to-tr from-[#98c5b3] via-[#8fa37a] to-[#253f36] opacity-30 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center flex-1">
        <div className="mb-10 max-w-[420px]">
          <h1 className="text-[44px] leading-tight font-serif italic text-[#EAEAEA] mb-6">
            Generating your Business DNA
          </h1>
          <p className="text-[14px] text-[#9A9A9C] font-medium leading-relaxed">
            We&apos;re researching and analyzing your business. It will take several minutes. Feel free to come back later.
          </p>
        </div>

        <div className="mb-10 h-10 flex justify-center overflow-hidden w-full relative">
            <div 
              key={statusIndex}
              className="absolute inline-flex items-center gap-2 bg-[#C1CD7D] text-[#1B1B1B] text-[15px] font-semibold px-6 py-3 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <Sparkles className="w-4 h-4 text-[#1B1B1B]" />
              {LOADING_STATUSES[statusIndex]}
            </div>
        </div>

        <div className="bg-[#2C2D2E] border border-white/5 rounded-[40px] p-6 w-full max-w-[500px] shadow-2xl flex flex-col items-center">
           <div className="w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-white relative mb-6">
             <div className="absolute inset-0 bg-transparent z-10" />
             <iframe 
               src={targetUrl}
               className="w-[1280px] h-[960px] border-none transform origin-top-left"
               style={{ transform: "scale(0.35)", width: "285.7%" }}
               sandbox="allow-scripts allow-same-origin"
               loading="lazy"
               title="Target Website Preview"
             />
           </div>

           <div className="inline-flex items-center gap-2 bg-[#1B1B1B] text-[#9A9A9C] text-[14px] font-medium px-6 py-3 rounded-full border border-white/5 shadow-inner">
             <LinkIcon className="w-4 h-4 text-[#C1CD7D]" />
             <span className="truncate max-w-[300px]">{urlParam}</span>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1B1B1B] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C1CD7D] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoadingContent />
    </Suspense>
  );
}
