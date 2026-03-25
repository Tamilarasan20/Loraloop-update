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
        className={`bg-white border border-gray-200 rounded-[32px] p-8 w-full max-w-[480px] shadow-xl relative transition-all duration-200 ${
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

        <h3 className="text-xl font-bold text-gray-900 mb-1">Business Name</h3>
        <p className="text-[14px] text-gray-500 mb-8 font-medium">Edit your business name</p>

        <div className="relative mb-8">
          <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-bold text-gray-400 z-10">
            Business Name*
          </label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-[15px] outline-none focus:border-lime-500 transition-colors font-semibold"
            autoFocus
          />
        </div>

        <div className="flex justify-end">
          <button 
            onClick={() => hasChanges && name.trim() && onApply(name)}
            disabled={!hasChanges || !name.trim()}
            className={`px-8 py-2.5 rounded-full font-bold text-[13px] transition-all shadow-sm active:scale-95 ${
              hasChanges && name.trim()
                ? "bg-lime-400 text-white hover:bg-lime-500"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
