"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Link as LinkIcon, ArrowLeft, AlertTriangle, Dna } from "lucide-react";
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
  const urlParam = searchParams.get("url") || "";

  const targetUrl = urlParam.startsWith("http") ? urlParam : `https://${urlParam}`;

  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // Cycle through status messages
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const hasFetched = useRef(false);

  // Actually call the extract-dna API
  useEffect(() => {
    if (!urlParam) {
      router.push("/");
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const extractDna = async () => {
      try {
        const response = await fetch("/api/extract-dna", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlParam }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || `Server error (${response.status})`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Store screenshot for preview
        if (data.screenshot) {
          setScreenshotUrl(data.screenshot);
          localStorage.setItem("brandScreenshot", data.screenshot);
        }

        // Store the extracted DNA in localStorage
        localStorage.setItem("brandDna", JSON.stringify(data.dna));

        // Short delay so user sees the preview before navigating
        await new Promise(r => setTimeout(r, 1500));

        // Navigate to the board
        router.push("/board");
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        console.error("[loading] Extraction failed:", message);
        setError(message);
        hasFetched.current = false; // Allow retry
      }
    };

    extractDna();
  }, [urlParam, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-8">
        <div className="bg-white border border-red-100 p-12 rounded-[32px] max-w-lg shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-400" />
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-red-600 mb-4">Extraction Failed</h2>
          <p className="text-gray-500 mb-8 text-[15px] leading-relaxed font-medium">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => { setError(null); window.location.reload(); }}
              className="bg-lime-400 text-white hover:bg-lime-500 px-8 py-3 rounded-full font-bold transition-all shadow-md active:scale-95"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/")}
              className="bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 px-8 py-3 rounded-full font-bold transition-all border border-gray-100"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden text-center pt-20 pb-16 px-4 font-sans">

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-lime-200/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center flex-1">
        <div className="mb-12 max-w-[500px]">
          <h1 className="text-[44px] leading-tight font-bold text-gray-900 mb-6 tracking-tighter">
            Generating your <br /> Business DNA
          </h1>
          <p className="text-[15px] text-gray-500 font-bold leading-relaxed px-4 text-center">
            We&apos;re currently researching and analyzing every aspect of your business online. This process will take a few more seconds.
          </p>
        </div>

        <div className="mb-12 h-12 flex justify-center overflow-hidden w-full relative">
          <div
            key={statusIndex}
            className="absolute inline-flex items-center gap-2.5 bg-lime-400 text-white text-[14px] font-extrabold px-8 py-3.5 rounded-full shadow-lg shadow-lime-100 animate-in fade-in slide-in-from-bottom-4 duration-500 uppercase tracking-widest"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            {LOADING_STATUSES[statusIndex]}...
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[3rem] p-8 w-full max-w-[550px] shadow-2xl shadow-lime-900/5 flex flex-col items-center">
          <div className="w-full aspect-[4/3] rounded-[24px] bg-gray-50 relative mb-8 border border-gray-100 shadow-inner overflow-hidden">

            {/* State 1: Rich branding animation — shown while extracting DNA */}
            {!screenshotUrl && (
              <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
                {/* Sweeping scan line */}
                <div
                  className="absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-lime-400 to-transparent z-20 pointer-events-none"
                  style={{ animation: "scanSweep 2s ease-in-out infinite", top: 0 }}
                />

                {/* Mock browser nav bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                  </div>
                  <div className="flex-1 h-5 bg-gray-200 rounded-full mx-2 animate-pulse" />
                </div>

                {/* Mock hero section */}
                <div className="px-5 pt-4 pb-2 flex gap-4 shrink-0">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-4 bg-gray-200 rounded-full w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded-full w-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                    <div className="h-3 bg-gray-100 rounded-full w-5/6 animate-pulse" style={{ animationDelay: "0.3s" }} />
                    <div className="mt-2 h-6 w-24 bg-lime-200 rounded-full animate-pulse" style={{ animationDelay: "0.45s" }} />
                  </div>
                  <div className="w-24 h-20 bg-gray-100 rounded-2xl animate-pulse shrink-0" style={{ animationDelay: "0.2s" }} />
                </div>

                {/* Color palette strip */}
                <div className="flex gap-2 px-5 py-2 shrink-0">
                  {["#84cc16","#22d3ee","#f59e0b","#6366f1","#e11d48"].map((c, i) => (
                    <div
                      key={c}
                      className="w-6 h-6 rounded-full shadow-sm"
                      style={{ backgroundColor: c, opacity: 0.8, animation: `pulse 1.5s ease-in-out ${i * 0.12}s infinite` }}
                    />
                  ))}
                  <div className="ml-1 h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                </div>

                {/* Mock content grid */}
                <div className="flex-1 px-5 pb-4 grid grid-cols-3 gap-2 overflow-hidden">
                  {[0.1, 0.25, 0, 0.35, 0.2, 0.1].map((delay, i) => (
                    <div
                      key={i}
                      className="bg-gray-100 rounded-xl animate-pulse"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>

                {/* Scanning label overlay */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
                  <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-lime-200 text-lime-600 text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                    Building your brand identity...
                  </div>
                </div>

                <style>{`
                  @keyframes scanSweep {
                    0% { top: 0%; opacity: 1; }
                    90% { top: 100%; opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                  }
                `}</style>
              </div>
            )}

            {/* State 3: Playwright screenshot — overlays whenever available */}
            {screenshotUrl && (
              <div className="absolute inset-0 z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotUrl}
                  alt="Website Preview"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute top-3 right-3 bg-lime-400 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md z-30">
                  ✓ Captured
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent z-20 pointer-events-none" />
          </div>

          <div className="inline-flex items-center gap-3 bg-gray-50 text-gray-400 text-[13px] font-bold px-8 py-3.5 rounded-full border border-gray-100 shadow-inner w-full justify-center">
            <LinkIcon className="w-4 h-4 text-lime-500" />
            <span className="truncate max-w-[320px] font-mono">{urlParam}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-lime-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoadingContent />
    </Suspense>
  );
}
