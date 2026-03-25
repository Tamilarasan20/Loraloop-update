"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface EnterWebsiteModalProps {
  onClose: () => void;
}

export default function EnterWebsiteModal({ onClose }: EnterWebsiteModalProps) {
  const [url, setUrl] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200); // Wait for transition
  };

  const handleContinue = () => {
    if (!url.trim()) return;
    
    // Clear any stale brand data from a previous session
    localStorage.removeItem("brandDna");
    localStorage.removeItem("brandScreenshot");

    // Navigate to loading page with the new URL
    router.push(`/loading?url=${encodeURIComponent(url)}`);
  };

  const isValidUrl = url.trim().length > 3 && url.includes(".");

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white border border-gray-100 rounded-[32px] p-10 w-full max-w-[540px] shadow-2xl relative transition-all duration-300 flex flex-col items-center text-center ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[34px] font-bold text-gray-900 mb-3 tracking-tight">Enter your website</h2>
        <p className="text-[14px] text-gray-500 mb-8 font-medium">
          We&apos;ll analyze your business and generate your Business DNA
        </p>

        <div className="w-full relative mb-8">
           <input 
             type="text"
             value={url}
             onChange={(e) => setUrl(e.target.value)}
             placeholder="www.example.com"
             className="w-full bg-gray-50 border border-gray-100 rounded-[12px] px-5 py-3.5 text-gray-900 text-[15px] outline-none focus:border-lime-500 transition-colors text-left font-bold placeholder-gray-400 shadow-inner"
             autoFocus
             onKeyDown={(e) => {
               if (e.key === 'Enter' && isValidUrl) {
                 handleContinue();
               }
             }}
           />
        </div>

        <button 
          onClick={handleContinue}
          disabled={!isValidUrl}
          className={`w-full py-4 rounded-[12px] font-extrabold text-[14px] transition-all duration-300 shadow-md ${
            isValidUrl 
              ? "bg-lime-400 text-white hover:bg-lime-500 active:scale-95" 
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
          }`}
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}
