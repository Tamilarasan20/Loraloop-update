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
    // Note: If we had unsaved changes, we'd spawn a Confirm modal here as per exact Pomelli flow.
    // For now, simple close transition.
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-[#2C2D2E] border border-white/5 rounded-[32px] p-8 w-full max-w-[560px] shadow-2xl relative transition-all duration-200 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleClose} 
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-[#414244] text-[#EAEAEA] hover:bg-[#4A4B4D] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-2xl font-medium text-[#EAEAEA] mb-6">Logo</h3>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-white/10 mb-8">
          <button 
            onClick={() => setActiveTab("images")}
            className={`pb-3 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "images" 
                ? "border-[#C1CD7D] text-[#EAEAEA]" 
                : "border-transparent text-[#9A9A9C] hover:text-[#EAEAEA]"
            }`}
          >
            Your images
          </button>
          <button 
            onClick={() => setActiveTab("generate")}
            className={`pb-3 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "generate" 
                ? "border-[#C1CD7D] text-[#EAEAEA]" 
                : "border-transparent text-[#9A9A9C] hover:text-[#EAEAEA]"
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
                <img src={initialLogoUrl} alt="Current Logo" className="h-32 object-contain mix-blend-screen" />
             ) : null}
             <button className="flex items-center gap-2 bg-[#444547] text-[#C1CD7D] px-6 py-3 rounded-xl hover:bg-[#4A4B4D] transition-colors text-[13px] font-medium">
               <Upload className="w-4 h-4" />
               Upload Images
             </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-[#EAEAEA] font-medium">Give our AI a subject*</label>
              <input 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex. A futuristic shoe"
                className="bg-transparent border border-[#525355] rounded-xl px-4 py-3 text-[#EAEAEA] text-[14px] outline-none focus:border-[#C1CD7D] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[13px] text-[#EAEAEA] font-medium">Choose a style*</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(style => (
                  <button 
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`px-4 py-2 rounded-full border text-[13px] font-medium transition-colors ${
                      selectedStyle === style 
                        ? "border-[#C1CD7D] text-[#C1CD7D] bg-[#C1CD7D]/10" 
                        : "border-[#525355] text-[#EAEAEA] hover:border-[#9A9A9C] bg-transparent"
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
                className={`px-6 py-2.5 rounded-full font-medium text-[13px] transition-colors ${
                  prompt.trim() 
                    ? "bg-[#C1CD7D] text-[#1B1B1B] hover:opacity-90" 
                    : "bg-[#444547] text-[#9A9A9C] cursor-not-allowed"
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
