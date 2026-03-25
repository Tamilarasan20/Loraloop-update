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
        className={`bg-white border border-gray-200 rounded-[32px] p-8 w-full max-w-[560px] shadow-xl relative transition-all duration-200 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleClose} 
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-2xl font-bold text-gray-900 mb-6">Logo</h3>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-100 mb-8">
          <button 
            onClick={() => setActiveTab("images")}
            className={`pb-3 text-[14px] font-bold transition-colors border-b-2 ${
              activeTab === "images" 
                ? "border-lime-500 text-gray-900" 
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Your images
          </button>
          <button 
            onClick={() => setActiveTab("generate")}
            className={`pb-3 text-[14px] font-bold transition-colors border-b-2 ${
              activeTab === "generate" 
                ? "border-lime-500 text-gray-900" 
                : "border-transparent text-gray-400 hover:text-gray-600"
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
             <button className="flex items-center gap-2 bg-gray-50 text-lime-700 border border-gray-100 px-6 py-3 rounded-xl hover:bg-gray-100 transition-all text-[13px] font-bold shadow-sm">
               <Upload className="w-4 h-4" />
               Upload Images
             </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-gray-500 font-bold">Give our AI a subject*</label>
              <input 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex. A futuristic shoe"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-[14px] outline-none focus:border-lime-500 transition-colors font-semibold shadow-inner"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[13px] text-gray-500 font-bold">Choose a style*</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(style => (
                  <button 
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`px-4 py-2 rounded-full border text-[13px] font-bold transition-all ${
                      selectedStyle === style 
                        ? "border-lime-500 text-lime-700 bg-lime-50 shadow-sm" 
                        : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
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
                className={`px-8 py-2.5 rounded-full font-bold text-[13px] transition-all shadow-md active:scale-95 ${
                  prompt.trim() 
                    ? "bg-lime-400 text-white hover:bg-lime-500" 
                    : "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none"
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
