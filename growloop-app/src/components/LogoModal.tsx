"use client";

import { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";

interface LogoModalProps {
  initialLogoUrl?: string;
  onApply: (newUrl: string) => void;
  onClose: () => void;
}

const STYLES = ["Minimal", "3D illustration", "Watercolor", "Pop art", "Abstract"];

export default function LogoModal({ initialLogoUrl, onApply, onClose }: LogoModalProps) {
  const [activeTab, setActiveTab] = useState<"images"|"generate">("generate");
  const [isVisible, setIsVisible] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Minimal");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white border border-[#E5E7EB] rounded-[32px] p-8 w-full max-w-[560px] shadow-2xl relative transition-all duration-200 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleClose} 
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-transparent text-[#71717A] hover:bg-gray-100 hover:text-[#111111] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-[22px] font-bold text-[#111111] mb-6">Logo</h3>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-[#E5E7EB] mb-8">
          <button 
            onClick={() => setActiveTab("images")}
            className={`pb-3 text-[14px] font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === "images" 
                ? "border-[#111111] text-[#111111]" 
                : "border-transparent text-[#71717A] hover:text-[#111111]"
            }`}
          >
            Your images
          </button>
          <button 
            onClick={() => setActiveTab("generate")}
            className={`pb-3 text-[14px] font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === "generate" 
                ? "border-[#111111] text-[#111111]" 
                : "border-transparent text-[#71717A] hover:text-[#111111]"
            }`}
          >
            Generate
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "images" ? (
          <div className="min-h-[200px] flex flex-col items-center justify-center gap-4">
             {initialLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={initialLogoUrl} alt="Current Logo" className="h-32 object-contain" />
             ) : null}
             <button className="flex items-center gap-2 bg-gray-50 border border-[#E5E7EB] text-[#111111] px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors text-[14px] font-medium shadow-sm mt-4">
               <Upload className="w-4 h-4 text-[#71717A]" />
               Upload Images
             </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-[#71717A] font-medium">Give our AI a subject*</label>
              <input 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex. A futuristic shoe"
                className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-3.5 text-[#111111] text-[14px] outline-none focus:border-[#A1A1AA] focus:ring-1 focus:ring-[#E5E7EB] transition-colors shadow-sm placeholder-[#A1A1AA]"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[13px] text-[#71717A] font-medium">Choose a style*</label>
              <div className="flex flex-wrap gap-2 text-[#111111]">
                {STYLES.map(style => (
                  <button 
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`px-4 py-2 rounded-full border text-[13px] font-semibold transition-colors shadow-sm ${
                      selectedStyle === style 
                        ? "border-[#2563EB] text-[#2563EB] bg-blue-50" 
                        : "border-[#E5E7EB] text-[#3F3F46] hover:bg-gray-50 bg-white"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button 
                onClick={() => prompt.trim() && onApply("generated_logo_url_here")}
                disabled={!prompt.trim()}
                className={`px-8 py-2.5 rounded-xl font-semibold text-[14px] transition-colors shadow-sm ${
                  prompt.trim() 
                    ? "bg-[#111111] text-white hover:bg-[#27272A]" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Generate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
