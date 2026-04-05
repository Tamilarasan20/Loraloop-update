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
    // Clear old extraction cache to ensure fresh data every time
    localStorage.removeItem("brandDna");
    localStorage.removeItem("brandDocuments");

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

        {/* Live Site Preview — screenshot proxy bypasses X-Frame-Options */}
        <div className="w-full mt-8">
          <div className="flex items-center justify-between mb-3 px-1">
             <span className="text-[13px] font-semibold text-[#71717A] uppercase tracking-wider">Live Preview</span>
             <span className="text-[12px] text-[#A1A1AA] flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
               Scanning...
             </span>
          </div>
          <div className="w-full h-[220px] rounded-2xl overflow-hidden relative border border-[#E5E7EB] shadow-sm bg-[#F8FAFC]">
            {/* Primary: screenshotone API via Google's page thumbnail */}
            <SiteScreenshot url={targetUrl} />
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

      {/* Abstract background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-white via-white to-blue-50/20 blur-[120px] rounded-full pointer-events-none z-0" />
    </div>
  );
}

// ── Screenshot Preview Component ──────────────────────────────────
function SiteScreenshot({ url }: { url: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const domain = (() => { try { return new URL(url).hostname.replace("www.", ""); } catch { return url; } })();

  // Use multiple screenshot services with fallback
  const screenshotSrc = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=720&device_scale_factor=1&format=jpg&block_ads=true&block_cookie_banners=true&cache=true&access_key=public`;
  // Fallback: Google PageSpeed thumbnail (free, no auth)
  const fallbackSrc = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop`;
  // Final fallback: meta image via linkpreview
  const googleThumb = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=128`;

  return (
    <div className="relative w-full h-full">
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-[#E5E7EB] flex items-center justify-center">
              <img 
                src={googleThumb} 
                alt={domain} 
                className="w-7 h-7 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div className="text-center">
              <div className="text-[14px] font-semibold text-[#374151]">{domain}</div>
              <div className="flex items-center gap-1.5 mt-1 justify-center">
                <Loader2 className="w-3 h-3 animate-spin text-[#3B82F6]" />
                <span className="text-[12px] text-[#9CA3AF]">Capturing preview...</span>
              </div>
            </div>
            {/* Animated scanning bars */}
            <div className="w-48 flex flex-col gap-1.5 mt-2">
              {[90, 70, 85, 60].map((w, i) => (
                <div key={i} className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#DBEAFE] to-[#3B82F6] rounded-full animate-pulse"
                    style={{ width: `${w}%`, animationDelay: `${i * 0.2}s` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Try iframe first — works for sites without X-Frame-Options */}
      {status !== "error" && (
        <iframe
          src={url}
          className="w-full h-full border-none"
          style={{ 
            transform: "scale(1)", 
            width: "100%", 
            height: "100%",
            pointerEvents: "none",
          }}
          sandbox="allow-scripts allow-same-origin"
          loading="eager"
          tabIndex={-1}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}
      {status === "error" && (
        /* Fallback: show a styled card with domain info when iframe is blocked */
        <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-[#F0F9FF] via-[#EFF6FF] to-[#E0E7FF]">
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/80 border-b border-[#E5E7EB]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FCA5A5]" />
              <div className="w-3 h-3 rounded-full bg-[#FCD34D]" />
              <div className="w-3 h-3 rounded-full bg-[#6EE7B7]" />
            </div>
            <div className="flex-1 mx-3 bg-[#F3F4F6] rounded-md px-3 py-1 flex items-center gap-2">
              <span className="text-[11px] text-[#6B7280] truncate">🔒 {url}</span>
            </div>
          </div>
          {/* Page content simulation */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
            <img 
              src={googleThumb}
              alt={domain}
              className="w-12 h-12 object-contain rounded-lg shadow-sm border border-white"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="text-center">
              <div className="text-[18px] font-bold text-[#111827]">{domain}</div>
              <div className="text-[12px] text-[#6B7280] mt-1">Lora is analysing this website...</div>
            </div>
            <div className="flex gap-2 mt-1">
              {["Brand DNA", "Colors", "Content"].map((tag) => (
                <span key={tag} className="px-3 py-1 bg-white/70 text-[#374151] text-[11px] font-semibold rounded-full border border-[#E5E7EB]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
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
