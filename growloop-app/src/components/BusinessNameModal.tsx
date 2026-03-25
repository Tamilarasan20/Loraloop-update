"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface BusinessNameModalProps {
  initialName: string;
  onApply: (newName: string) => void;
  onClose: () => void;
}

export default function BusinessNameModal({ initialName, onApply, onClose }: BusinessNameModalProps) {
  const [name, setName] = useState(initialName);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200); // Wait for transition
  };

  const hasChanges = name.trim() !== initialName.trim();

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-[#363738] border border-white/5 rounded-3xl p-6 w-full max-w-[480px] shadow-2xl relative transition-all duration-200 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleClose} 
          className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-full bg-[#414244] text-[#EAEAEA] hover:bg-[#4A4B4D] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-medium text-[#EAEAEA] mb-1">Business Name</h3>
        <p className="text-[14px] text-[#9A9A9C] mb-8">Edit your business name</p>

        <div className="relative mb-8">
          <label className="absolute -top-2 left-3 bg-[#363738] px-1 text-[11px] font-medium text-[#9A9A9C] z-10">
            Business Name*
          </label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border border-[#525355] rounded-xl px-4 py-3.5 text-[#EAEAEA] text-[15px] outline-none focus:border-[#C1CD7D] transition-colors"
            autoFocus
          />
        </div>

        <div className="flex justify-end">
          <button 
            onClick={() => hasChanges && name.trim() && onApply(name)}
            disabled={!hasChanges || !name.trim()}
            className={`px-6 py-2.5 rounded-full font-medium text-[13px] transition-colors ${
              hasChanges && name.trim()
                ? "bg-[#414244] text-[#EAEAEA] hover:bg-[#4A4B4D]" // In hover state it was actually a dark button in the screenshot
                : "bg-[#414244] text-[#9A9A9C] opacity-60 cursor-not-allowed"
            }`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
