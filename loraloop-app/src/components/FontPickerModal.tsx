"use client";

import { useState } from "react";
import { X, Search, Check } from "lucide-react";

interface FontPickerModalProps {
  initialHeadingFont: string;
  initialBodyFont: string;
  onApply: (heading: string, body: string) => void;
  onClose: () => void;
}

const BUSINESS_FONTS = ["Gt Walsheim Pro", "Roboto", "Gtwalsheim"];
const GOOGLE_FONTS = ["ABeeZee", "ADLaM Display", "AR One Sans", "Abel", "Inter", "Outfit"];

export default function FontPickerModal({ initialHeadingFont, initialBodyFont, onApply, onClose }: FontPickerModalProps) {
  const [headingFont, setHeadingFont] = useState(initialHeadingFont);
  const [bodyFont] = useState(initialBodyFont);
  const [search, setSearch] = useState("");

  const handleApply = () => {
    onApply(headingFont, bodyFont);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      <div className="bg-white border border-[#F4F4F5] rounded-3xl w-[460px] max-h-[90vh] flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-[18px] font-bold text-[#111111]">Fonts</h3>
          <button onClick={onClose} className="text-[#71717A] hover:text-[#111111] hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 mb-6 text-[14px] text-[#71717A]">
          Choose up to two fonts for your business
        </div>

        <div className="px-6 flex flex-col gap-6 overflow-hidden flex-1">
          
          {/* Active Font Selection Box */}
          <div className="flex items-center justify-between text-[#111111]">
             <div className="flex gap-4">
               {/* Heading Font Active */}
               <div 
                 className="flex flex-col items-center cursor-pointer opacity-100 transition-opacity"
                 onClick={() => {}}
               >
                  <span className="text-[44px] text-[#2563EB] font-serif leading-none tracking-tight group-hover:scale-105 transition-transform" style={{ fontFamily: headingFont }}>Aa</span>
                  <span className="text-[12px] text-[#71717A] mt-1 font-medium truncate max-w-[80px]">{headingFont}</span>
               </div>
               
               {/* Body Font Active */}
               <div 
                 className="flex flex-col items-center cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                 onClick={() => {}}
               >
                  <span className="text-[44px] text-[#2563EB] font-serif leading-none tracking-tight group-hover:scale-105 transition-transform" style={{ fontFamily: bodyFont }}>Aa</span>
                  <span className="text-[12px] text-[#71717A] mt-1 font-medium truncate max-w-[80px]">{bodyFont}</span>
               </div>
             </div>
             
             <button className="bg-gray-50 text-[#111111] border border-[#E5E7EB] hover:bg-gray-100 px-4 py-2 rounded-full font-medium transition-colors text-[13px] flex items-center gap-1.5 shadow-sm">
               <span className="font-light text-lg leading-none mt-[-2px]">+</span> Add font
             </button>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-[#A1A1AA] absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search fonts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-[16px] py-4 pl-12 pr-4 text-[#111111] text-[15px] outline-none focus:border-[#A1A1AA] focus:ring-1 focus:ring-[#A1A1AA] shadow-sm transition-colors font-medium placeholder-[#A1A1AA]"
            />
          </div>

          <div className="flex flex-col overflow-y-auto pr-2 pb-6 scrollbar-none flex-1 gap-6">
            
            {/* From Business */}
            <div className="flex flex-col gap-2">
               <div className="text-[13px] font-semibold text-[#71717A] mb-1 px-2">From your business</div>
               <div className="flex flex-col gap-1">
                 {BUSINESS_FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase())).map(font => (
                   <button 
                     key={font} 
                     onClick={() => setHeadingFont(font)}
                     className={`flex items-center px-4 py-3 rounded-2xl text-[15px] text-left transition-colors group ${headingFont === font ? "bg-blue-50 text-[#2563EB]" : "text-[#3F3F46] hover:bg-gray-50 hover:text-[#111111]"}`}
                   >
                     {headingFont === font ? <Check className="w-4 h-4 mr-3 text-[#2563EB]" /> : <div className="w-7 bg-transparent mx-1.5 mr-3 rounded-md" />}
                     <span style={{ fontFamily: font }} className="truncate font-medium">{font}</span>
                   </button>
                 ))}
               </div>
            </div>

            {/* From Google Fonts */}
            <div className="flex flex-col gap-2">
               <div className="text-[13px] font-semibold text-[#71717A] mb-1 px-2">From Google Fonts</div>
               <div className="flex flex-col gap-1">
                 {GOOGLE_FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase())).map(font => (
                   <button 
                     key={font} 
                     onClick={() => setHeadingFont(font)}
                     className={`flex items-center px-4 py-3 rounded-2xl text-[15px] text-left transition-colors group ${headingFont === font ? "bg-blue-50 text-[#2563EB]" : "text-[#3F3F46] hover:bg-gray-50 hover:text-[#111111]"}`}
                   >
                     {headingFont === font ? <Check className="w-4 h-4 mr-3 text-[#2563EB]" /> : <div className="w-7 bg-transparent mx-1.5 mr-3 rounded-md" />}
                     <span style={{ fontFamily: font }} className="truncate font-medium">{font}</span>
                   </button>
                 ))}
               </div>
            </div>

          </div>

        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-6 border-t border-[#F4F4F5] bg-gray-50/50 rounded-b-[24px]">
          <p className="text-[13px] text-[#71717A] font-medium">
            Browse font details at <a href="https://fonts.google.com" target="_blank" rel="noreferrer" className="underline hover:text-[#111111] transition-colors decoration-gray-300 underline-offset-4">Google Fonts</a>
          </p>
          <button 
            onClick={handleApply}
            className="bg-[#111111] text-white hover:bg-[#27272A] px-8 py-2.5 rounded-xl font-semibold transition-colors text-[14px] shadow-sm"
          >
            Apply
          </button>
        </div>

      </div>

    </div>
  );
}
