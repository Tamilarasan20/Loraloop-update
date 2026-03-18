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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      
      <div className="bg-[#2C2D2E] border border-white/5 rounded-[24px] w-full max-w-[500px] shadow-2xl relative shadow-black/40">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-[15px] font-medium text-[#EAEAEA]">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 mb-6 text-[13px] text-[#9A9A9C]">
          {subtitle}
        </div>

        {/* Input Area */}
        <div className="px-6 mb-8">
           <div className="relative pt-3">
             <div className="absolute top-0 left-4 -mt-2.5 bg-[#2C2D2E] px-1 text-[11px] text-[#9A9A9C] z-10 whitespace-nowrap">
               {placeholder}
             </div>
             <div className="border border-white/20 rounded-xl min-h-[140px] p-3 flex flex-wrap gap-2 items-start focus-within:border-[#C1CD7D] transition-colors bg-[#2C2D2E]">
               
               {tags.map((tag, index) => (
                 <div key={index} className="flex items-center gap-1.5 bg-transparent border border-white/20 text-[#EAEAEA] px-3 py-1.5 rounded-full text-[13px]">
                   <span>{tag}</span>
                   <button 
                     onClick={() => removeTag(index)}
                     className="text-[#9A9A9C] hover:text-[#EAEAEA] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full w-[18px] h-[18px] transition-colors"
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
                 className="flex-1 min-w-[120px] bg-transparent outline-none text-[#EAEAEA] text-[13px] py-1.5"
               />
             </div>
           </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end p-6 border-t border-white/5">
          <button 
            onClick={() => onApply(tags)}
            className="bg-[#414244] text-[#9A9A9C] hover:text-[#EAEAEA] hover:bg-[#4A4B4D] px-8 py-2.5 rounded-full font-medium transition-colors text-[13px]"
          >
            Apply
          </button>
        </div>

      </div>
    </div>
  );
}
