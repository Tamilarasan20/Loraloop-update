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
    
    // In a real app we'd validate URL format extensively here.
    // Transition to loading visualizer
    router.push(`/loading?url=${encodeURIComponent(url)}`);
  };

  const isValidUrl = url.trim().length > 3 && url.includes(".");

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-[#2C2D2E] border border-white/5 rounded-[32px] p-8 w-full max-w-[500px] shadow-2xl relative transition-all duration-300 flex flex-col items-center text-center ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-serif text-[#EAEAEA] italic mb-3">Enter your website</h2>
        <p className="text-[14px] text-[#9A9A9C] mb-8 font-medium">
          We&apos;ll analyze your business and generate your Business DNA
        </p>

        <div className="w-full relative mb-8">
           <input 
             type="text"
             value={url}
             onChange={(e) => setUrl(e.target.value)}
             placeholder="www.example.com"
             className="w-full bg-[#1B1B1B] border border-transparent rounded-[16px] px-6 py-4 text-[#EAEAEA] text-[15px] outline-none focus:border-[#4A4B4D] transition-colors text-center font-medium placeholder-[#525355]"
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
          className={`w-full py-4 rounded-[16px] font-semibold text-[15px] transition-all duration-300 ${
            isValidUrl 
              ? "bg-[#C1CD7D] text-[#1B1B1B] hover:bg-[#D4E08F] shadow-lg" 
              : "bg-[#414244] text-[#9A9A9C] cursor-not-allowed opacity-70"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
