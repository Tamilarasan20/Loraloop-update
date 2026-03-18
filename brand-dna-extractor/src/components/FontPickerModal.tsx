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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      
      <div className="bg-[#2B2B2D] border border-white/5 rounded-3xl w-[460px] max-h-[90vh] flex flex-col shadow-2xl relative shadow-black/40">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-xl font-medium text-[#EAEAEA]">Fonts</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 mb-6 text-sm text-[#9A9A9C]">
          Choose up to two fonts for your business
        </div>

        <div className="px-6 flex flex-col gap-6 overflow-hidden flex-1">
          
          {/* Active Font Selection Box */}
          <div className="flex items-center justify-between text-[#EAEAEA]">
             <div className="flex gap-4">
               {/* Heading Font Active */}
               <div 
                 className="flex flex-col items-center cursor-pointer opacity-100 transition-opacity"
                 onClick={() => {}}
               >
                  <span className="text-[44px] text-[#C1CD7D] font-serif leading-none tracking-tight group-hover:scale-105 transition-transform" style={{ fontFamily: headingFont }}>Aa</span>
                  <span className="text-[11px] text-[#9A9A9C] mt-1 font-medium truncate max-w-[80px]">{headingFont}</span>
               </div>
               
               {/* Body Font Active */}
               <div 
                 className="flex flex-col items-center cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                 onClick={() => {}}
               >
                  <span className="text-[44px] text-[#C1CD7D] font-serif leading-none tracking-tight group-hover:scale-105 transition-transform" style={{ fontFamily: bodyFont }}>Aa</span>
                  <span className="text-[11px] text-[#9A9A9C] mt-1 font-medium truncate max-w-[80px]">{bodyFont}</span>
               </div>
             </div>
             
             <button className="bg-[#444547] text-[#C1CD7D] hover:bg-[#4A4B4D] px-4 py-2 rounded-full font-medium transition-colors text-[13px] flex items-center gap-1.5 shadow-sm">
               <span className="font-light text-lg leading-none mt-[-2px]">+</span> Add font
             </button>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-[#9A9A9C] absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search fonts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1B1B1B] border border-transparent rounded-[16px] py-4 pl-12 pr-4 text-[#EAEAEA] text-[15px] outline-none focus:border-[#4A4B4D] transition-colors font-medium placeholder-[#525355]"
            />
          </div>

          <div className="flex flex-col overflow-y-auto pr-2 pb-6 scrollbar-none flex-1 gap-6">
            
            {/* From Business */}
            <div className="flex flex-col gap-2">
               <div className="text-[13px] font-semibold text-[#9A9A9C] mb-1 px-2">From your business</div>
               <div className="flex flex-col gap-1">
                 {BUSINESS_FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase())).map(font => (
                   <button 
                     key={font} 
                     onClick={() => setHeadingFont(font)}
                     className={`flex items-center px-4 py-3 rounded-2xl text-[15px] text-left transition-colors group ${headingFont === font ? "bg-[#363738] text-[#EAEAEA]" : "text-[#9A9A9C] hover:bg-[#323334] hover:text-[#EAEAEA]"}`}
                   >
                     {headingFont === font ? <Check className="w-4 h-4 mr-3 text-[#C1CD7D]" /> : <div className="w-7 group-hover:bg-white/5 mx-1.5 mr-3 rounded-md" />}
                     <span style={{ fontFamily: font }} className="truncate">{font}</span>
                   </button>
                 ))}
               </div>
            </div>

            {/* From Google Fonts */}
            <div className="flex flex-col gap-2">
               <div className="text-[13px] font-semibold text-[#9A9A9C] mb-1 px-2">From Google Fonts</div>
               <div className="flex flex-col gap-1">
                 {GOOGLE_FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase())).map(font => (
                   <button 
                     key={font} 
                     onClick={() => setHeadingFont(font)}
                     className={`flex items-center px-4 py-3 rounded-2xl text-[15px] text-left transition-colors group ${headingFont === font ? "bg-[#363738] text-[#EAEAEA]" : "text-[#9A9A9C] hover:bg-[#323334] hover:text-[#EAEAEA]"}`}
                   >
                     {headingFont === font ? <Check className="w-4 h-4 mr-3 text-[#C1CD7D]" /> : <div className="w-7 group-hover:bg-white/5 mx-1.5 mr-3 rounded-md" />}
                     <span style={{ fontFamily: font }} className="truncate">{font}</span>
                   </button>
                 ))}
               </div>
            </div>

          </div>

        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-6">
          <p className="text-[13px] text-[#9A9A9C] font-medium">
            Browse font details at <a href="https://fonts.google.com" target="_blank" rel="noreferrer" className="underline hover:text-[#EAEAEA] transition-colors decoration-[#4A4B4D] underline-offset-4">Google Fonts</a>
          </p>
          <button 
            onClick={handleApply}
            className="bg-[#C1CD7D] text-[#1B1B1B] hover:bg-[#D4E08F] px-8 py-3 rounded-full font-semibold transition-colors text-[14px] shadow-lg"
          >
            Apply
          </button>
        </div>

      </div>

    </div>
  );
}
