"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sparkles, Link as LinkIcon } from "lucide-react";
import { Suspense } from "react";

const LOADING_STATUSES = [
  "Summarizing your business",
  "Finding your logo",
  "Analyzing typography",
  "Extracting brand voice",
  "Structuring Business DNA"
];

function GenerateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      router.push("/");
      return;
    }

    // Cycle through loading statuses to mimic progress
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev < LOADING_STATUSES.length - 1 ? prev + 1 : prev));
    }, 4500);

    const generateDNA = async () => {
      try {
        const response = await fetch("/api/extract-dna", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || `Server error (${response.status}). Please try again.`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        // Store the result temporarily
        localStorage.setItem("brandDna", JSON.stringify(data.dna));
        
        // Push user to the board once done
        router.push("/board");
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || "An unexpected error occurred.");
        } else {
          setError("An unexpected error occurred.");
        }
      }
    };

    generateDNA();

    return () => clearInterval(interval);
  }, [url, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-gray-50">
        <div className="bg-white border border-red-100 p-12 rounded-[32px] max-w-lg shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-400" />
          <h2 className="text-2xl font-bold text-red-600 mb-4">DNA Extraction Failed</h2>
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
              className="bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 px-8 py-3 rounded-full font-bold transition-all border border-gray-100 active:scale-95"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background glow behind modal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[80%] w-[600px] h-[400px] bg-lime-200/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Loading Card */}
      <div className="bg-white border border-gray-100 rounded-[3rem] p-16 flex flex-col items-center w-[550px] relative z-10 shadow-2xl shadow-lime-900/5">
        
        <div className="w-20 h-20 bg-lime-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-lime-100">
          <Sparkles className="w-10 h-10 text-lime-600 animate-pulse" />
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 leading-tight mb-4 tracking-tight">
          Generating your <br /> Business DNA
        </h1>
        
        <p className="text-[14px] text-gray-500 text-center mb-10 px-6 leading-relaxed font-bold">
          We&apos;re researching and analyzing your business online.<br />
          This process takes a few minutes.
        </p>

        {/* Dynamic Status Pill */}
        <div className="bg-lime-400 text-white px-6 py-3 rounded-full flex items-center gap-3 mb-10 shadow-lg shadow-lime-100 animate-in fade-in duration-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[13px] font-extrabold uppercase tracking-widest">{LOADING_STATUSES[statusIndex]}...</span>
        </div>

        {/* Website Preview iframe */}
        <div className="w-full aspect-video bg-gray-50 rounded-[24px] overflow-hidden border border-gray-100 shadow-inner mb-10 relative">
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <Loader2 className="w-6 h-6 text-gray-200 animate-spin" />
          </div>
          <iframe 
            src={url || ""} 
            className="absolute inset-0 w-full h-full object-cover z-10 bg-white opacity-40grayscale shadow-2xl"
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            title="Website Preview"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-20" />
        </div>

        {/* URL Pill */}
        <div className="bg-gray-50 border border-gray-100 text-gray-400 px-6 py-3 rounded-full flex items-center gap-2.5 shadow-inner w-full justify-center">
          <LinkIcon className="w-4 h-4 text-lime-500" />
          <span className="text-[12px] font-bold font-mono truncate max-w-[300px]">{url}</span>
        </div>

      </div>

    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <GenerateContent />
    </Suspense>
  );
}
