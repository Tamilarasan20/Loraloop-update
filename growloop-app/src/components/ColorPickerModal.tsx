"use client";

import { useState } from "react";
import { X, Pipette, Edit2 } from "lucide-react";

interface ColorPickerModalProps {
  initialColors: string[];
  onApply: (colors: string[]) => void;
  onClose: () => void;
}

export default function ColorPickerModal({ initialColors, onApply, onClose }: ColorPickerModalProps) {
  const [colors, setColors] = useState<string[]>(initialColors.length > 0 ? initialColors : ["#C1CD7D", "#1B1B1B", "#EAEAEA"]);
  const [activeSwatchIndex, setActiveSwatchIndex] = useState<number | null>(null);

  const handleApply = () => {
    onApply(colors);
  };

  const updateActiveColor = (newColor: string) => {
    if (activeSwatchIndex !== null) {
      const newColors = [...colors];
      newColors[activeSwatchIndex] = newColor;
      setColors(newColors);
    }
  };

  const removeColor = (index: number) => {
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
      if (activeSwatchIndex === index) setActiveSwatchIndex(null);
    }
  };

  const addColor = () => {
    if (colors.length < 6) {
      setColors([...colors, "#FFFFFF"]);
      setActiveSwatchIndex(colors.length);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      
      {/* Main Color Palette Modal */}
      <div className="bg-[#2C2D2E] border border-white/5 rounded-[32px] w-[460px] shadow-2xl relative shadow-black/40">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-[20px] font-medium text-[#EAEAEA]">Color palette</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 mb-8 text-[14px] text-[#9A9A9C] font-medium">
          Click on a color to change it.
        </div>

        {/* Swatches block */}
        <div className="px-6 flex gap-4 items-center flex-wrap">
          {colors.map((c, i) => (
            <div key={i} className="relative group/swatch">
              <button
                onClick={() => setActiveSwatchIndex(i)}
                className={`w-[72px] h-[72px] rounded-full shadow-lg border-2 hover:scale-105 transition-transform cursor-pointer ${activeSwatchIndex === i ? 'ring-2 ring-white/20 border-[#2C2D2E]' : 'border-[#2C2D2E]'}`}
                style={{ backgroundColor: c }}
              />
              {/* Delete Button (visible on hover) */}
              {colors.length > 1 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeColor(i); }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-[#363738] rounded-full flex items-center justify-center text-[#EAEAEA] opacity-0 group-hover/swatch:opacity-100 transition-opacity border border-white/10 hover:bg-[#4A4B4D] shadow-sm z-10"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-6 mt-4">
          <button 
            onClick={addColor}
            disabled={colors.length >= 6}
            className={`font-semibold text-[14px] transition-colors ${colors.length >= 6 ? 'text-zinc-600 cursor-not-allowed' : 'text-[#C1CD7D] hover:text-[#D4E08F]'}`}
          >
            Add color
          </button>
          <button 
            onClick={handleApply}
            className="bg-[#C1CD7D] text-[#1B1B1B] hover:bg-[#D4E08F] px-8 py-3 rounded-full font-semibold transition-colors text-[14px] shadow-lg"
          >
            Apply
          </button>
        </div>

      </div>

      {/* Child Pick a Color Modal */}
      {activeSwatchIndex !== null && (
        <div className="absolute z-[110] -translate-x-1/2 -translate-y-[calc(50%+20px)] left-1/2 top-1/2 ml-[120px]">
          <div className="bg-[#2C2D2E] border border-white/5 rounded-[24px] w-[320px] shadow-2xl relative shadow-black/50 p-5">
            
            {/* Child Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#EAEAEA]">
                <Edit2 className="w-4 h-4" />
                <h4 className="text-[14px] font-medium">Pick a color</h4>
              </div>
              <button onClick={() => setActiveSwatchIndex(null)} className="text-zinc-400 hover:text-white p-1 rounded-full transition-colors bg-white/5 hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Gradient Area Mockup */}
            <div className="w-full h-[140px] rounded-xl mb-4 relative" style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${colors[activeSwatchIndex] || '#ff0000'})` }}>
               {/* Mock selector handle */}
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white rounded-full shadow-sm" style={{ backgroundColor: colors[activeSwatchIndex] }} />
            </div>

            {/* Rainbow slider mockup */}
            <div className="w-full h-4 rounded-full mb-6 border border-white/10" style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} />

            {/* Input fields */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="w-11 h-11 rounded-xl bg-black border border-white/10 shadow-inner" style={{ backgroundColor: colors[activeSwatchIndex] }} />
                <div className="flex-1 bg-[#1B1B1B] border border-transparent rounded-[12px] flex items-center px-4 gap-2 text-[#EAEAEA] text-[14px] font-medium cursor-pointer">
                   <span>HEX</span>
                   <div className="flex-1" />
                   <div className="w-px h-5 bg-white/10" />
                </div>
              </div>

              <div className="flex bg-[#1B1B1B] border border-transparent rounded-[12px] overflow-hidden focus-within:border-[#4A4B4D] transition-colors">
                <div className="px-3 flex items-center justify-center text-[#9A9A9C]">
                  <Pipette className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={colors[activeSwatchIndex]}
                  onChange={(e) => updateActiveColor(e.target.value)}
                  className="bg-transparent border-none outline-none text-[#EAEAEA] font-medium text-[14px] px-2 py-3 w-full uppercase"
                />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
