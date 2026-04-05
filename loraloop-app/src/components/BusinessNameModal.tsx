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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white border border-[#E5E7EB] rounded-3xl p-6 w-full max-w-[480px] shadow-2xl relative transition-all duration-200 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleClose} 
          className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-full bg-transparent text-[#71717A] hover:bg-gray-100 hover:text-[#111111] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-[#111111] mb-1">Business Name</h3>
        <p className="text-[14px] text-[#71717A] mb-8">Edit your business name</p>

        <div className="relative mb-8 mt-2">
          <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-[#71717A] z-10">
            Business Name*
          </label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3.5 text-[#111111] text-[15px] outline-none focus:border-[#A1A1AA] focus:ring-1 focus:ring-[#E5E7EB] transition-colors shadow-sm"
            autoFocus
          />
        </div>

        <div className="flex justify-end pt-2">
          <button 
            onClick={() => hasChanges && name.trim() && onApply(name)}
            disabled={!hasChanges || !name.trim()}
            className={`px-8 py-2.5 rounded-xl font-semibold text-[14px] transition-colors shadow-sm ${
              hasChanges && name.trim()
                ? "bg-[#111111] text-white hover:bg-[#27272A]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
