"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Circle, ChevronLeft } from "lucide-react";

const STEPS = [
  "Website Analyse",
  "Business Identification",
  "Analysing Competitor",
  "Analysing Brand Assets",
  "Building your knowledge"
];

function LoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlParam = searchParams.get("url") || "https://example.com";

  const targetUrl = urlParam.startsWith("http") ? urlParam : `https://${urlParam}`;

  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Start extraction API call and manage steps
  useEffect(() => {
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < STEPS.length) {
        setActiveStepIndex(currentStep);
      }
    }, 2000); // Simulate progress visually while we wait for the slower API

    const extractData = async () => {
      try {
        const response = await fetch('/api/extract-dna', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl }),
        });

        if (!response.ok) {
           console.error("Failed to extract data, using fallback routing");
           throw new Error("HTTP " + response.status);
        }
        
        const data = await response.json();
        
        if (data && data.dna) {
          localStorage.setItem("brandDna", JSON.stringify(data.dna));
        }
        if (data && data.documents) {
          localStorage.setItem("brandDocuments", JSON.stringify(data.documents));
        }
        
        // Wait at least a moment so the animation doesn't feel jarring if it was too fast
        setTimeout(() => {
           clearInterval(interval);
           setActiveStepIndex(STEPS.length); // complete all
           router.push(`/board?url=${encodeURIComponent(targetUrl)}`);
        }, 1500);

      } catch (err) {
        console.error("Extraction error:", err);
        // Fallback: Proceed to board anyway and let board handle missing data or use its defaults
        setTimeout(() => {
           clearInterval(interval);
           setActiveStepIndex(STEPS.length);
           router.push(`/board?url=${encodeURIComponent(targetUrl)}`);
        }, 1500);
      }
    };

    extractData();

    return () => clearInterval(interval);
  }, [router, targetUrl]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#FAFBFC] font-sans relative">
      <div className="bg-white rounded-[32px] p-10 w-full max-w-[600px] flex flex-col items-center z-10 relative">
        <h1 className="text-[28px] font-bold tracking-tight text-[#111111] mb-8">
          Building your knowledge
        </h1>

        <div className="flex flex-col w-full gap-4">
          {STEPS.map((step, index) => {
            const isActive = index === activeStepIndex;
            const isCompleted = index < activeStepIndex;

            let badgeStyle = "text-[#71717A]";
            if (isCompleted) badgeStyle = "bg-[#ECFDF5] text-[#10B981]";
            else if (isActive) badgeStyle = "bg-[#EFF6FF] text-[#3B82F6]";

            return (
              <div key={index} className="flex flex-col items-start w-full">
                <div className={`flex items-center gap-3 py-2.5 px-5 rounded-full transition-all duration-300 ${badgeStyle}`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 fill-[#10B981] text-white" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#3B82F6]" />
                  ) : (
                    <Circle className="w-5 h-5 opacity-40" />
                  )}
                  
                  <span className={`text-[18px] transition-colors duration-300`}>
                    {step}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Site Preview persists below the steps */}
        <div className="w-full mt-8">
          <div className="flex items-center justify-between mb-3 px-1">
             <span className="text-[13px] font-semibold text-[#71717A] uppercase tracking-wider">Live Preview</span>
             <span className="text-[12px] text-[#A1A1AA] flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
               Scanning...
             </span>
          </div>
          <div className="w-full h-[240px] rounded-2xl bg-[#F4F4F5] overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border border-[#E5E7EB]">
            {/* Overlay to prevent interaction */}
            <div className="absolute inset-0 z-10 pointer-events-none" />
            {/* Google cache proxy — works around X-Frame-Options on most sites */}
            <iframe 
              src={targetUrl}
              className="w-[1280px] h-[960px] border-none transform origin-top-left"
              style={{ transform: "scale(0.46)", width: "217%" }}
              sandbox="allow-scripts allow-same-origin allow-popups"
              referrerPolicy="no-referrer"
              loading="eager"
              tabIndex={-1}
              onError={() => {}}
            />
            {/* Decorative fallback gradient that shows through if iframe doesn't load */}
            <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]">
              <div className="flex items-center gap-2 text-[#94A3B8]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[13px] font-medium">Loading preview...</span>
              </div>
              <span className="text-[11px] text-[#CBD5E1] mt-2">{targetUrl}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <Link 
          href="/" 
          className="flex items-center gap-2 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#111111] font-semibold text-[14px] px-6 py-2.5 rounded-full shadow-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* Abstract background blur like the board page to add some depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-white via-white to-blue-50/20 blur-[120px] rounded-full pointer-events-none z-0" />
    </div>
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-[#FAFBFC]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    }>
      <LoadingContent />
    </Suspense>
  );
}
