"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, ChevronLeft, Globe, Sparkles, FileText } from "lucide-react";

// ── Stage definitions ──────────────────────────────────────────────────────────
const STAGES = [
  {
    id: "scraping",
    number: 1,
    label: "Website Scraping",
    description: "Extracting your brand's digital footprint",
    icon: Globe,
    color: "#2563EB",
    bgColor: "#EEF2FF",
    items: [
      "Business name & identity",
      "Brand images & photos",
      "Logos & icons",
      "Color palette",
      "Typography & fonts",
    ],
  },
  {
    id: "enriching",
    number: 2,
    label: "LLM Enrichment",
    description: "AI analysis of your brand DNA",
    icon: Sparkles,
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    items: [
      "Business overview",
      "Brand values",
      "Brand aesthetic",
      "Tone of voice",
      "Tagline",
    ],
  },
  {
    id: "generating",
    number: 3,
    label: "Document Generation",
    description: "Building your knowledge files",
    icon: FileText,
    color: "#059669",
    bgColor: "#ECFDF5",
    items: [
      "Business Profile",
      "Market Research",
      "Social Strategy",
    ],
  },
];

// Maps API status → stage index
function statusToStageIndex(status: string): number {
  if (status === "completed") return 3; // all done
  if (status === "generating") return 2;
  if (status === "enriching") return 1;
  return 0; // scraping / unknown
}

function LoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlParam = searchParams.get("url") || "https://example.com";
  const targetUrl = urlParam.startsWith("http") ? urlParam : `https://${urlParam}`;
  const domain = (() => { try { return new URL(targetUrl).hostname.replace("www.", ""); } catch { return targetUrl; } })();

  const [activeStage, setActiveStage] = useState(0); // 0 = scraping, 1 = enriching, 2 = generating, 3 = done
  const [activeItemIndex, setActiveItemIndex] = useState(0); // animated item within current stage
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    localStorage.removeItem("brandDna");
    localStorage.removeItem("brandDocuments");

    // Animate items within a stage every 600ms
    const itemTimer = setInterval(() => {
      setActiveItemIndex((i) => i + 1);
    }, 600);

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    const timeoutId = setTimeout(() => {
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(itemTimer);
      setErrorMsg("Processing timed out. The website may be too slow or blocked.");
    }, 300_000);

    const extractData = async () => {
      try {
        const response = await fetch("/api/process-business", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || `Server error ${response.status}`);
        }

        const data = await response.json();
        if (!data.businessId) throw new Error("No business ID returned from server");

        const businessId = data.businessId;

        pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/check-status?id=${businessId}`);
            if (!statusRes.ok) return;
            const statusData = await statusRes.json();

            const stageIdx = statusToStageIndex(statusData.status);
            setActiveStage(stageIdx);

            if (statusData.status === "completed") {
              if (pollInterval) clearInterval(pollInterval);
              clearInterval(itemTimer);
              clearTimeout(timeoutId);
              router.push(`/board?id=${businessId}`);
            } else if (statusData.status === "failed") {
              if (pollInterval) clearInterval(pollInterval);
              clearInterval(itemTimer);
              clearTimeout(timeoutId);
              router.push(`/board?id=${businessId}`);
            }
          } catch {
            // ignore transient poll errors
          }
        }, 3000);
      } catch (err: any) {
        console.error("Extraction error:", err);
        clearInterval(itemTimer);
        clearTimeout(timeoutId);
        setErrorMsg(err.message || "Failed to start analysis. Please try again.");
      }
    };

    extractData();

    return () => {
      clearInterval(itemTimer);
      if (pollInterval) clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [router, targetUrl]);

  // Error state
  if (errorMsg) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#FAFBFC] font-sans">
        <div className="bg-white rounded-[32px] p-10 w-full max-w-[480px] flex flex-col items-center text-center shadow-sm border border-[#F4F4F5]">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#111111] mb-3">Something went wrong</h1>
          <p className="text-[14px] text-[#71717A] mb-8 leading-relaxed">{errorMsg}</p>
          <div className="flex gap-3">
            <button onClick={() => router.push("/")} className="px-6 py-2.5 rounded-full border border-[#E5E7EB] text-[14px] font-semibold text-[#111111] hover:bg-gray-50 transition-colors">
              ← Back
            </button>
            <button onClick={() => { setErrorMsg(null); window.location.reload(); }} className="px-6 py-2.5 rounded-full bg-[#111111] text-white text-[14px] font-semibold hover:bg-[#27272A] transition-colors">
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#FAFBFC] font-sans px-6 py-12 relative overflow-hidden">
      {/* Soft background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-to-tr from-blue-50/40 via-white to-purple-50/30 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[660px] relative z-10 flex flex-col gap-6">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-[28px] font-black text-[#111111] tracking-tight">Building your knowledge</h1>
          <p className="text-[14px] text-[#A1A1AA] mt-1.5 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse inline-block" />
            Analysing <span className="text-[#2563EB] font-semibold">{domain}</span>
          </p>
        </div>

        {/* Stage cards */}
        <div className="flex flex-col gap-3">
          {STAGES.map((stage, si) => {
            const isCompleted = activeStage > si;
            const isActive = activeStage === si;
            const isPending = activeStage < si;
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                className={`bg-white rounded-2xl border transition-all duration-500 overflow-hidden ${
                  isActive
                    ? "border-[#E0E7FF] shadow-md shadow-blue-500/5"
                    : isCompleted
                    ? "border-[#D1FAE5] shadow-sm"
                    : "border-[#F4F4F5] opacity-50"
                }`}
              >
                {/* Stage header */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Icon / Status indicator */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isCompleted
                        ? "bg-[#ECFDF5]"
                        : isActive
                        ? ""
                        : "bg-[#F4F4F5]"
                    }`}
                    style={isActive ? { backgroundColor: stage.bgColor } : {}}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                    ) : isActive ? (
                      <Icon className="w-5 h-5" style={{ color: stage.color }} />
                    ) : (
                      <span className="text-[13px] font-bold text-[#A1A1AA]">{stage.number}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[15px] font-bold transition-colors ${
                          isCompleted ? "text-[#059669]" : isActive ? "text-[#111111]" : "text-[#A1A1AA]"
                        }`}
                      >
                        {stage.label}
                      </span>
                      {isActive && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse"
                          style={{ backgroundColor: stage.bgColor, color: stage.color }}
                        >
                          Live
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669]">
                          Done
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#A1A1AA] mt-0.5">{stage.description}</p>
                  </div>

                  {isActive && (
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" style={{ color: stage.color }} />
                  )}
                </div>

                {/* Animated items — only show when active or completed */}
                {(isActive || isCompleted) && (
                  <div className="px-5 pb-4 pt-0">
                    <div
                      className="rounded-xl p-3 flex flex-wrap gap-2"
                      style={{ backgroundColor: stage.bgColor + "66" }}
                    >
                      {stage.items.map((item, ii) => {
                        const globalIdx = si * 5 + ii;
                        const shown = isCompleted || activeItemIndex > globalIdx;
                        return (
                          <div
                            key={item}
                            className={`flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full transition-all duration-300 ${
                              shown
                                ? isCompleted
                                  ? "bg-white text-[#059669] shadow-sm"
                                  : "bg-white shadow-sm"
                                : "opacity-0 scale-95"
                            }`}
                            style={shown && !isCompleted ? { color: stage.color } : {}}
                          >
                            {shown ? (
                              isCompleted ? (
                                <CheckCircle2 className="w-3 h-3 text-[#10B981] shrink-0" />
                              ) : (
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                                  style={{ backgroundColor: stage.color }}
                                />
                              )
                            ) : null}
                            {item}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live site preview */}
        <div className="bg-white rounded-2xl border border-[#F4F4F5] overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F4F4F5]">
            <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">Live Preview</span>
            <span className="text-[11px] text-[#A1A1AA] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Scanning...
            </span>
          </div>
          <div className="h-[160px] relative">
            <SiteScreenshot url={targetUrl} domain={domain} />
          </div>
        </div>

        {/* Back button */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#A1A1AA] hover:text-[#111111] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Cancel and go back
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Screenshot Component ───────────────────────────────────────────────────────
function SiteScreenshot({ url, domain }: { url: string; domain: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const googleThumb = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=128`;

  return (
    <div className="relative w-full h-full">
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white shadow-sm border border-[#E5E7EB] flex items-center justify-center">
              <img src={googleThumb} alt={domain} className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#374151]">{domain}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <Loader2 className="w-3 h-3 animate-spin text-[#3B82F6]" />
                <span className="text-[11px] text-[#9CA3AF]">Loading preview…</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {status !== "error" && (
        <iframe
          src={url}
          className="w-full h-full border-none"
          style={{ pointerEvents: "none", transform: "scale(0.6)", transformOrigin: "top left", width: "166%", height: "166%" }}
          sandbox="allow-scripts allow-same-origin"
          loading="eager"
          tabIndex={-1}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F0F9FF] to-[#EFF6FF]">
          <div className="text-center">
            <img src={googleThumb} alt={domain} className="w-10 h-10 object-contain rounded-lg shadow-sm border border-white mx-auto mb-2" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="text-[13px] font-bold text-[#111827]">{domain}</div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">Lora is analysing this website…</div>
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
