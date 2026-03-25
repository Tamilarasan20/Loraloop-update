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
      
      <div className="bg-white border border-gray-200 rounded-[24px] w-full max-w-[500px] shadow-xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 mb-6 text-[13px] text-gray-500 font-semibold">
          {subtitle}
        </div>

        {/* Input Area */}
        <div className="px-6 mb-8">
           <div className="relative pt-3">
             <div className="absolute top-0 left-4 -mt-2.5 bg-white px-1 text-[11px] font-bold text-gray-400 z-10 whitespace-nowrap">
               {placeholder}
             </div>
             <div className="border border-gray-200 rounded-xl min-h-[140px] p-3 flex flex-wrap gap-2 items-start focus-within:border-lime-500 transition-all bg-gray-50 shadow-inner">
               
               {tags.map((tag, index) => (
                 <div key={index} className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-[13px] font-bold shadow-sm">
                   <span>{tag}</span>
                   <button 
                     onClick={() => removeTag(index)}
                     className="text-gray-400 hover:text-red-500 flex items-center justify-center bg-gray-50 hover:bg-red-50 rounded-full w-[18px] h-[18px] transition-colors"
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
                 className="flex-1 min-w-[120px] bg-transparent outline-none text-gray-900 text-[13px] py-1.5 font-semibold"
               />
             </div>
           </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end p-6 border-t border-gray-100">
          <button 
            onClick={() => onApply(tags)}
            className="bg-lime-400 text-white hover:bg-lime-500 px-8 py-2.5 rounded-full font-bold transition-all text-[13px] shadow-md active:scale-95"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
