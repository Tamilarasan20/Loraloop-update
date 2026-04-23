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
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-[#1a1c1a]">
        <div className="bg-[#2B2B2D] border border-red-500/30 p-8 rounded-3xl max-w-lg">
          <h2 className="text-xl font-medium text-red-400 mb-4">Error Extracting DNA</h2>
          <p className="text-[#EAEAEA] mb-6 text-sm leading-relaxed">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => { setError(null); window.location.reload(); }}
              className="bg-[#C4CE83] text-[#1A1B1A] hover:bg-[#D5DF93] px-6 py-2.5 rounded-full font-medium transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={() => router.push("/")}
              className="bg-[#242426] text-[#EAEAEA] hover:bg-[#313328] px-6 py-2.5 rounded-full font-medium transition-colors border border-white/5"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1c1a] flex flex-col items-center justify-center relative">
      
      {/* Background glow behind modal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[80%] w-[400px] h-[300px] bg-[#C4CE83]/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Loading Card */}
      <div className="bg-[#2B2B2D] border border-white/5 rounded-[3rem] p-12 flex flex-col items-center w-[500px] relative z-10 shadow-2xl">
        
        <h1 className="text-3xl font-serif italic text-center text-[#EAEAEA] leading-tight mb-4 tracking-tight">
          Generating your Business <br /> DNA
        </h1>
        
        <p className="text-[13px] text-[#9A9A9C] text-center mb-8 px-4 leading-relaxed">
          We&apos;re researching and analyzing your business.<br />
          It will take several minutes. Feel free to come back later.
        </p>

        {/* Dynamic Status Pill */}
        <div className="bg-[#A7D7C5] text-[#1A1B1A] px-5 py-2.5 rounded-full flex items-center gap-2 mb-10 shadow-inner animate-pulse duration-1000">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">{LOADING_STATUSES[statusIndex]}...</span>
        </div>

        {/* Website Preview iframe */}
        <div className="w-full aspect-video bg-[#1A1B1A] rounded-2xl overflow-hidden border border-white/5 shadow-inner mb-8 relative group">
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <Loader2 className="w-6 h-6 text-[#444a44] animate-spin" />
          </div>
          <iframe 
            src={`/api/proxy?url=${encodeURIComponent(url || "")}`} 
            className="absolute inset-0 w-full h-full object-cover z-10 bg-white"
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            title="Website Preview"
          />
        </div>

        {/* URL Pill */}
        <div className="bg-[#1A1B1A] border border-white/5 text-[#C4CE83] px-5 py-2.5 rounded-full flex items-center gap-2 shadow-inner">
          <LinkIcon className="w-4 h-4" />
          <span className="text-sm font-mono truncate max-w-[250px]">{url}</span>
        </div>

      </div>

    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a1c1a]" />}>
      <GenerateContent />
    </Suspense>
  );
}
