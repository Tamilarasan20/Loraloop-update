"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface TagsModalProps {
  title: string;
  subtitle: string;
  placeholder: string;
  initialTags: string[];
  onApply: (tags: string[]) => void;
  onClose: () => void;
}

export default function TagsModal({ title, subtitle, placeholder, initialTags, onApply, onClose }: TagsModalProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue("");
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      <div className="bg-white border border-[#F4F4F5] rounded-[24px] w-full max-w-[500px] shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-[17px] font-bold text-[#111111]">{title}</h3>
          <button onClick={onClose} className="text-[#71717A] hover:text-[#111111] hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 mb-6 text-[14px] text-[#71717A]">
          {subtitle}
        </div>

        {/* Input Area */}
        <div className="px-6 mb-8">
           <div className="relative pt-3">
             <div className="absolute top-0 left-4 -mt-2.5 bg-white px-1 text-[12px] font-medium text-[#71717A] z-10 whitespace-nowrap">
               {placeholder}
             </div>
             <div className="border border-[#E5E7EB] rounded-xl min-h-[140px] p-3 flex flex-wrap gap-2 items-start focus-within:border-[#A1A1AA] focus-within:ring-1 focus-within:ring-[#E5E7EB] transition-colors bg-white shadow-sm">
               
               {tags.map((tag, index) => (
                 <div key={index} className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] shadow-sm text-[#111111] px-3 py-1.5 rounded-[10px] text-[13px] font-semibold">
                   <span>{tag}</span>
                   <button 
                     onClick={() => removeTag(index)}
                     className="text-[#A1A1AA] hover:text-[#111111] flex items-center justify-center bg-transparent hover:bg-gray-100 rounded-full w-[18px] h-[18px] transition-colors"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 </div>
               ))}
               
               <input 
                 type="text"
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={handleKeyDown}
                 className="flex-1 min-w-[120px] bg-transparent outline-none text-[#111111] text-[14px] py-1.5"
                 placeholder={tags.length === 0 ? placeholder : ""}
               />
             </div>
           </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end p-6 border-t border-[#F4F4F5] bg-gray-50/50 rounded-b-[24px]">
          <button 
            onClick={() => onApply(tags)}
            className="bg-[#111111] text-white hover:bg-[#27272A] px-8 py-2.5 rounded-xl font-semibold transition-colors text-[14px] shadow-sm"
          >
            Apply
          </button>
        </div>

      </div>
    </div>
  );
}
