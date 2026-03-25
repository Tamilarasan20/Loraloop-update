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
      <div className="bg-white border border-gray-200 rounded-[32px] w-[460px] shadow-xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-[20px] font-bold text-gray-900">Color palette</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 mb-8 text-[14px] text-gray-500 font-semibold">
          Click on a color to change it.
        </div>

        {/* Swatches block */}
        <div className="px-6 flex gap-4 items-center flex-wrap">
          {colors.map((c, i) => (
            <div key={i} className="relative group/swatch">
              <button
                onClick={() => setActiveSwatchIndex(i)}
                className={`w-[72px] h-[72px] rounded-full shadow-md border-2 hover:scale-105 transition-transform cursor-pointer ${activeSwatchIndex === i ? 'ring-2 ring-lime-400 border-white' : 'border-white'}`}
                style={{ backgroundColor: c }}
              />
              {/* Delete Button (visible on hover) */}
              {colors.length > 1 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeColor(i); }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-gray-500 opacity-0 group-hover/swatch:opacity-100 transition-opacity border border-gray-200 hover:text-red-500 shadow-sm z-10"
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
            className={`font-bold text-[14px] transition-colors ${colors.length >= 6 ? 'text-gray-300 cursor-not-allowed' : 'text-lime-600 hover:text-lime-700'}`}
          >
            Add color
          </button>
          <button 
            onClick={handleApply}
            className="bg-lime-400 text-white hover:bg-lime-500 px-8 py-3 rounded-full font-bold transition-all text-[14px] shadow-md active:scale-95"
          >
            Apply
          </button>
        </div>

      </div>

      {/* Child Pick a Color Modal */}
      {activeSwatchIndex !== null && (
        <div className="absolute z-[110] -translate-x-1/2 -translate-y-[calc(50%+20px)] left-1/2 top-1/2 ml-[120px]">
          <div className="bg-white border border-gray-200 rounded-[24px] w-[320px] shadow-xl p-5">
            
            {/* Child Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-900">
                <Edit2 className="w-4 h-4 text-lime-600" />
                <h4 className="text-[14px] font-bold">Pick a color</h4>
              </div>
              <button onClick={() => setActiveSwatchIndex(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors bg-gray-50 hover:bg-gray-100">
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
                <div className="w-11 h-11 rounded-xl border border-gray-100 shadow-sm" style={{ backgroundColor: colors[activeSwatchIndex] }} />
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-[12px] flex items-center px-4 gap-2 text-gray-700 text-[14px] font-bold cursor-pointer">
                   <span>HEX</span>
                   <div className="flex-1" />
                   <div className="w-px h-5 bg-gray-200" />
                </div>
              </div>

              <div className="flex bg-gray-50 border border-gray-100 rounded-[12px] overflow-hidden focus-within:border-lime-500 transition-colors shadow-inner">
                <div className="px-3 flex items-center justify-center text-gray-400">
                  <Pipette className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={colors[activeSwatchIndex]}
                  onChange={(e) => updateActiveColor(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-900 font-bold text-[14px] px-2 py-3 w-full uppercase"
                />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
