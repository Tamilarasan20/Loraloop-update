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
      
      <div className="bg-white border border-gray-200 rounded-3xl w-[460px] max-h-[90vh] flex flex-col shadow-xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-xl font-bold text-gray-900">Fonts</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 mb-6 text-sm text-gray-500 font-medium">
          Choose up to two fonts for your business
        </div>

        <div className="px-6 flex flex-col gap-6 overflow-hidden flex-1">
          
          {/* Active Font Selection Box */}
          <div className="flex items-center justify-between text-gray-900">
             <div className="flex gap-4">
               {/* Heading Font Active */}
               <div 
                 className="flex flex-col items-center cursor-pointer opacity-100 transition-opacity"
                 onClick={() => {}}
               >
                  <span className="text-[44px] text-lime-600 font-serif leading-none tracking-tight group-hover:scale-105 transition-transform" style={{ fontFamily: headingFont }}>Aa</span>
                  <span className="text-[11px] text-gray-500 mt-1 font-bold truncate max-w-[80px]">{headingFont}</span>
               </div>
               
               {/* Body Font Active */}
               <div 
                 className="flex flex-col items-center cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                 onClick={() => {}}
               >
                  <span className="text-[44px] text-lime-600 font-serif leading-none tracking-tight group-hover:scale-105 transition-transform" style={{ fontFamily: bodyFont }}>Aa</span>
                  <span className="text-[11px] text-gray-500 mt-1 font-bold truncate max-w-[80px]">{bodyFont}</span>
               </div>
             </div>
             
             <button className="bg-gray-100 text-lime-700 hover:bg-gray-200 px-4 py-2 rounded-full font-bold transition-all text-[13px] flex items-center gap-1.5 shadow-sm">
               <span className="font-light text-xl leading-none mt-[-2px]">+</span> Add font
             </button>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search fonts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-[16px] py-4 pl-12 pr-4 text-gray-900 text-[15px] outline-none focus:border-lime-500 transition-colors font-semibold placeholder-gray-400"
            />
          </div>

          <div className="flex flex-col overflow-y-auto pr-2 pb-6 scrollbar-none flex-1 gap-6">
            
            {/* From Business */}
            <div className="flex flex-col gap-2">
               <div className="text-[13px] font-semibold text-gray-500 mb-1 px-2">From your business</div>
               <div className="flex flex-col gap-1">
                 {BUSINESS_FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase())).map(font => (
                   <button 
                     key={font} 
                     onClick={() => setHeadingFont(font)}
                     className={`flex items-center px-4 py-3 rounded-2xl text-[15px] text-left transition-colors group ${headingFont === font ? "bg-lime-50 text-lime-700 font-bold" : "text-gray-500 font-semibold hover:bg-gray-50 hover:text-gray-900"}`}
                   >
                     {headingFont === font ? <Check className="w-4 h-4 mr-3 text-lime-600" /> : <div className="w-7 group-hover:bg-gray-100 mx-1.5 mr-3 rounded-md" />}
                     <span style={{ fontFamily: font }} className="truncate">{font}</span>
                   </button>
                 ))}
               </div>
            </div>

            {/* From Google Fonts */}
            <div className="flex flex-col gap-2">
               <div className="text-[13px] font-semibold text-gray-500 mb-1 px-2">From Google Fonts</div>
               <div className="flex flex-col gap-1">
                 {GOOGLE_FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase())).map(font => (
                   <button 
                     key={font} 
                     onClick={() => setHeadingFont(font)}
                     className={`flex items-center px-4 py-3 rounded-2xl text-[15px] text-left transition-colors group ${headingFont === font ? "bg-lime-50 text-lime-700 font-bold" : "text-gray-500 font-semibold hover:bg-gray-50 hover:text-gray-900"}`}
                   >
                     {headingFont === font ? <Check className="w-4 h-4 mr-3 text-lime-600" /> : <div className="w-7 group-hover:bg-gray-100 mx-1.5 mr-3 rounded-md" />}
                     <span style={{ fontFamily: font }} className="truncate">{font}</span>
                   </button>
                 ))}
               </div>
            </div>

          </div>

        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-6">
          <p className="text-[13px] text-gray-400 font-bold">
            Browse font details at <a href="https://fonts.google.com" target="_blank" rel="noreferrer" className="underline hover:text-gray-900 transition-colors decoration-gray-200 underline-offset-4">Google Fonts</a>
          </p>
          <button 
            onClick={handleApply}
            className="bg-lime-400 text-white hover:bg-lime-500 px-8 py-3 rounded-full font-bold transition-all text-[14px] shadow-md active:scale-95"
          >
            Apply
          </button>
        </div>

      </div>

    </div>
  );
}
