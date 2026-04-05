"use client";

import { useState } from "react";
import { Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Fashion (Recommended)", "Beauty", "General"];

const TEMPLATES = Array.from({ length: 15 }).map((_, i) => ({
  id: `temp-${i}`,
  category: CATEGORIES[i % 3],
  // Using generic placeholder images for product scenes
  imageUrl: `https://picsum.photos/seed/${i + 500}/400/500`, 
}));

export default function TemplatesSelection() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [selected, setSelected] = useState<string[]>([]);

  const filteredTemplates = TEMPLATES.filter(t => t.category === activeCategory);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(t => t !== id);
      }
      if (prev.length >= 4) {
        return prev; // Max 4
      }
      return [...prev, id];
    });
  };

  const remaining = 4 - selected.length;

  return (
    <div className="min-h-screen bg-[#1A1B1A] text-zinc-100 p-6 md:p-12 pb-32">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/photoshoot" className="w-10 h-10 rounded-full bg-[#2B2B2D] hover:bg-[#3A3C32] flex items-center justify-center transition-colors border border-white/5">
              <ChevronLeft className="w-5 h-5 text-zinc-300" />
            </Link>
            <h1 className="text-2xl font-serif italic tracking-tight">Choose product shots</h1>
          </div>
          <div className="text-sm font-medium text-[#9A9A9C] bg-[#242426] px-4 py-2 rounded-full border border-white/5 shadow-inner">
            <span className="text-[#EAEAEA]">{selected.length}</span>/4 Selected
          </div>
        </div>

        {/* Categories Navbar */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === cat 
                ? "bg-[#C4CE83] text-[#1A1B1A] shadow-lg shadow-[#C4CE83]/10" 
                : "bg-[#242426] text-[#9A9A9C] hover:bg-[#2B2B2D] border border-transparent hover:border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 animate-in fade-in duration-500">
          {filteredTemplates.map(template => {
            const isSelected = selected.includes(template.id);
            return (
              <div 
                key={template.id} 
                onClick={() => toggleSelect(template.id)}
                className={`relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                  isSelected ? "ring-4 ring-[#C4CE83] ring-offset-4 ring-offset-[#1A1B1A] scale-[0.98]" : "hover:ring-2 hover:ring-white/20 hover:ring-offset-2 hover:ring-offset-[#1A1B1A]"
                }`}
              >
                <img 
                  src={template.imageUrl} 
                  alt="Template" 
                  className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? "scale-105" : "group-hover:scale-105"}`} 
                />
                
                {/* Selection Overlay */}
                <div className={`absolute inset-0 transition-colors duration-300 ${isSelected ? "bg-black/20" : "bg-black/0 group-hover:bg-black/10"}`} />
                
                {/* Checkmark Indicator */}
                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-md ${
                  isSelected ? "bg-[#C4CE83] scale-100 opacity-100" : "bg-black/20 backdrop-blur-md border border-white/30 scale-90 opacity-0 group-hover:opacity-100"
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-[#1A1B1A] stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Floating Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 p-6 flex justify-center transition-transform duration-500 ${
        selected.length > 0 ? "translate-y-0" : "translate-y-[150%]"
      }`}>
        <div className="bg-[#2B2B2D]/95 backdrop-blur-xl border border-white/10 p-3 pl-8 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-12">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#EAEAEA]">{selected.length} templates selected</span>
            {remaining > 0 ? (
              <span className="text-xs text-[#9A9A9C]">You can select up to {remaining} more</span>
            ) : (
              <span className="text-xs text-[#C4CE83]">Maximum selection reached</span>
            )}
          </div>
          <button 
            onClick={() => {
              console.log("Selected templates:", selected);
              alert(`Proceeding with ${selected.length} templates!`);
              // router.push("/photoshoot/generate")
            }}
            className="bg-[#C4CE83] text-[#1A1B1A] hover:bg-[#D5DF93] px-8 py-3 rounded-full font-semibold transition-colors shadow-lg active:scale-95"
          >
            Looks good
          </button>
        </div>
      </div>
      
    </div>
  );
}
