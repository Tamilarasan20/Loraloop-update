"use client";

import { useState } from "react";
import { Link as LinkIcon, Upload, Pencil, X, Image as ImageIcon, RotateCcw } from "lucide-react";
import ColorPickerModal from "./ColorPickerModal";
import FontPickerModal from "./FontPickerModal";
import BusinessNameModal from "./BusinessNameModal";
import LogoModal from "./LogoModal";
import ConfirmationModal from "./ConfirmationModal";
import ImageLightboxModal from "./ImageLightboxModal";
import TagsModal from "./TagsModal";

interface BrandDna {
  brandName: string;
  logoUrl: string;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  tagline?: string;
  brandValue?: string;
  brandAesthetic?: string;
  toneOfVoice?: string;
  businessOverview?: string;
  images?: string[];
}

const formatPills = (str?: string) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BrandBoard({ initialDna }: { initialDna: any }) {
  const [dna, setDna] = useState<BrandDna>(initialDna as BrandDna);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLooksGoodConfirmOpen, setIsLooksGoodConfirmOpen] = useState(false);
  const [deleteImageIndex, setDeleteImageIndex] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const [tagsModalConfig, setTagsModalConfig] = useState<{
    isOpen: boolean;
    field: "brandValue" | "brandAesthetic" | "toneOfVoice" | null;
    title: string;
    subtitle: string;
    placeholder: string;
    initialTags: string[];
  }>({ isOpen: false, field: null, title: "", subtitle: "", placeholder: "", initialTags: [] });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleTextChange = (key: keyof BrandDna, value: string) => {
    setDna((prev) => ({ ...prev, [key]: value }));
  };

  const openEditor = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingField) {
      handleTextChange(editingField as keyof BrandDna, editValue);
    }
    setEditingField(null);
  };

  const handleResetDna = () => {
    localStorage.removeItem("brandDna");
    window.location.href = "/";
  };

  const colors = dna.colors || {
    primary: "#6366f1",
    secondary: "#22d3ee",
    tertiary: "#f59e0b",
    quaternary: "#ef4444"
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white overflow-hidden relative font-sans">

      {/* ── Title Section (Compact) ── */}
      <div className="flex flex-col items-center text-center px-6 pt-8 pb-5 w-full shrink-0">
        <div className="w-9 h-9 text-[#84cc16] mb-3 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7 8 12 11 17 8" />
            <polyline points="7 12 12 15 17 12" />
            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
          </svg>
        </div>
        <h1 className="text-[28px] font-bold text-[#1e293b] mb-1.5 tracking-tight">
          Your Brand DNA
        </h1>
        <p className="text-[13px] text-slate-400 leading-relaxed font-medium max-w-[520px]">
          Here is a snapshot of your business that we&apos;ll use to create social media campaigns. Feel free to edit this at anytime.
        </p>
      </div>

      {/* ── Centered Elevated Container ── */}
      <div className="flex-1 w-full flex justify-center overflow-hidden px-[100px] pb-8">
        <div className="w-full max-w-[1200px] bg-white rounded-[36px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col overflow-hidden">

          {/* ── Two-Panel Content (Independent Scroll) ── */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-8 px-10 pt-8">

            {/* ═══════ LEFT: Brand Info (Scrollable) ═══════ */}
            <div className="flex flex-col gap-5 w-full lg:w-[42%] xl:w-[40%] overflow-y-auto pr-0 lg:pr-4 scrollbar-none pb-4">

              {/* Brand Name Card */}
              <div 
                className="w-full bg-[#f8f9fa] rounded-3xl p-7 flex flex-col justify-center min-h-[120px] relative group cursor-pointer border border-transparent hover:border-lime-200 transition-all"
                onClick={() => setIsNameModalOpen(true)}
              >
                <div className="text-[28px] lg:text-[32px] font-bold text-[#1e293b] mb-2 truncate w-full pr-10 tracking-tight">
                  {dna.brandName || "Unknown Brand"}
                </div>
                <div className="flex items-center text-[13px] text-slate-400 gap-2 font-medium">
                  <LinkIcon className="w-4 h-4 text-slate-300" />
                  <span>https://{dna.brandName?.toLowerCase().replace(/\s+/g, '') || "yourbrand"}.com/</span>
                </div>
                <div className="absolute top-5 right-5 bg-white shadow-sm border border-gray-100 rounded-full p-2 text-lime-600 opacity-0 group-hover:opacity-100 transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Logo + Fonts */}
              <div className="grid grid-cols-2 gap-5 min-h-[160px]">
                {/* Logo */}
                <div 
                  className="bg-[#f8f9fa] border border-transparent rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-lime-200 transition-all"
                  onClick={() => setIsLogoModalOpen(true)}
                >
                  {dna.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={dna.logoUrl} alt="Logo" className="w-full h-full object-contain max-h-[80px] drop-shadow-sm transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center justify-center gap-2 h-full">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Logo</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white shadow-sm border border-gray-100 rounded-full p-1.5 text-lime-600 opacity-0 group-hover:opacity-100 transition-all z-10">
                    <Pencil className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Fonts */}
                <div 
                  className="bg-[#f8f9fa] border border-transparent rounded-3xl p-6 flex flex-col relative cursor-pointer hover:border-lime-200 transition-all group items-center justify-center"
                  onClick={() => setIsFontModalOpen(true)}
                >
                  <div className="absolute top-5 left-6 text-[12px] font-bold text-slate-400 uppercase tracking-widest">Fonts</div>
                  <div className="flex flex-col items-center mt-4">
                    <div className="text-[52px] lg:text-[60px] text-[#84cc16] font-bold tracking-tighter mb-1 group-hover:scale-105 transition-transform leading-none" style={{ fontFamily: dna.typography?.headingFont }}>Aa</div>
                    <div className="text-[13px] font-bold text-center text-slate-700 truncate px-2">
                       {dna.typography?.headingFont || "Gt Walsheim Pro"}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white shadow-sm border border-gray-100 rounded-full p-1.5 text-lime-600 opacity-0 group-hover:opacity-100 transition-all z-10">
                    <Pencil className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div 
                className="w-full bg-[#f8f9fa] border border-transparent rounded-3xl p-7 flex flex-col cursor-pointer hover:border-lime-200 transition-all group relative min-h-[120px] justify-center"
                onClick={() => setIsColorModalOpen(true)}
              >
                <div className="text-[12px] font-bold text-slate-400 mb-5 uppercase tracking-widest">Colors</div>
                <div className="flex gap-5 items-center justify-start overflow-x-auto scrollbar-none py-2">
                  {Object.entries(colors).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="flex flex-col items-center group/swatch shrink-0">
                      <div 
                        className="w-[52px] h-[52px] rounded-full shadow-sm border-4 border-white group-hover/swatch:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: value as string }}
                      />
                    </div>
                  ))}
                </div>
                <div className="absolute top-5 right-5 bg-white shadow-sm border border-gray-100 rounded-full p-1.5 text-lime-600 opacity-0 group-hover:opacity-100 transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Tagline & Values */}
              <div className="grid grid-cols-2 gap-5 shrink-0">
                <div 
                  className="bg-[#f8f9fa] border border-transparent rounded-3xl p-6 flex flex-col relative group cursor-pointer hover:border-lime-200 transition-all min-h-[120px]"
                  onClick={() => openEditor("tagline", dna.tagline || "")}
                >
                  <div className="text-[12px] font-bold text-slate-400 mb-3 uppercase tracking-widest">Tagline</div>
                  <div className={`text-lg font-serif italic leading-snug w-full pr-6 ${dna.tagline ? "text-lime-700" : "text-slate-300"}`}>
                    {dna.tagline || "Your brand slogan..."}
                  </div>
                  <div className="absolute top-4 right-4 bg-white shadow-sm border border-gray-100 rounded-full p-1.5 text-lime-600 opacity-0 group-hover:opacity-100 transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div 
                  className="bg-[#f8f9fa] border border-transparent rounded-3xl p-6 flex flex-col relative group cursor-pointer hover:border-lime-200 transition-all min-h-[120px]"
                  onClick={() => setTagsModalConfig({
                    isOpen: true, field: "brandValue", title: "Brand values",
                    subtitle: "Describe your brand's values", placeholder: "Press Enter to add...",
                    initialTags: formatPills(dna.brandValue || "")
                  })}
                >
                  <div className="text-[12px] font-bold text-slate-400 mb-3 uppercase tracking-widest">Values</div>
                  <div className="flex flex-wrap gap-1.5 pr-6">
                    {(!dna.brandValue || dna.brandValue.trim() === "") ? (
                      <span className="px-3 py-1 rounded-full border border-slate-200 text-[11px] font-semibold text-slate-400 bg-white">Add values...</span>
                    ) : (
                      formatPills(dna.brandValue).map((pill, i) => (
                        <span key={i} className="px-3 py-1 rounded-full border border-slate-200 text-[11px] font-bold text-slate-600 bg-white inline-block truncate max-w-[110px] uppercase tracking-tight">{pill}</span>
                      ))
                    )}
                  </div>
                  <div className="absolute top-4 right-4 bg-white shadow-sm border border-gray-100 rounded-full p-1.5 text-lime-600 opacity-0 group-hover:opacity-100 transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Business Overview */}
              <div 
                className="w-full bg-[#f8f9fa] border border-transparent rounded-3xl p-7 flex flex-col relative group cursor-pointer hover:border-lime-200 transition-all shrink-0 min-h-[100px]"
                onClick={() => openEditor("businessOverview", dna.businessOverview || "")} 
              >
                <div className="text-[12px] font-bold text-slate-400 mb-3 uppercase tracking-widest">Business overview</div>
                <p className={`text-[13px] leading-relaxed pr-8 ${dna.businessOverview ? "text-slate-600 font-medium" : "text-slate-300 italic"}`}>
                   {dna.businessOverview || "Describe your business goals and mission..."}
                </p>
                <div className="absolute top-5 right-5 bg-white shadow-sm border border-gray-100 rounded-full p-1.5 text-lime-600 opacity-0 group-hover:opacity-100 transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* ═══════ RIGHT: Images (Scrollable, 4 Columns) ═══════ */}
            <div className="flex flex-col flex-1 min-w-0 overflow-y-auto scrollbar-none pb-4">
              <div className="text-[18px] font-bold text-[#1e293b] mb-5 tracking-tight shrink-0">Images</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 content-start">
                <label className="bg-[#ecfccb] text-lime-700 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-[#e4f8b9] transition-all group/upload active:scale-95 border border-transparent">
                  <Upload className="w-5 h-5 mb-1.5 transition-transform group-hover/upload:-translate-y-0.5" />
                  <span className="text-[10px] font-extrabold text-center leading-tight uppercase tracking-widest opacity-80">Upload</span>
                  <input type="file" accept="image/*" multiple className="hidden" 
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const newUrls = files.map(file => URL.createObjectURL(file));
                      setDna(prev => ({ ...prev, images: [...(prev.images || []), ...newUrls] }));
                    }} 
                  />
                </label>
                {(dna.images || []).map((img, i) => (
                  <div key={i} className="aspect-square bg-white rounded-xl overflow-hidden relative group/img cursor-pointer shadow-sm border border-gray-50 hover:shadow-md transition-all"
                    onClick={() => setLightboxImage(img)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none" />
                    <button className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-700 shadow-lg border border-gray-100 hover:text-red-500 transition-all transform scale-90 opacity-0 group-hover/img:opacity-100 group-hover/img:scale-100 z-10"
                      onClick={(e) => { e.stopPropagation(); setDeleteImageIndex(i); }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══════ FOOTER (Solid, inside container) ═══════ */}
          <div className="shrink-0 border-t border-gray-100 bg-white px-10 py-4 flex justify-end items-center gap-4 rounded-b-[36px]">
            <button 
              onClick={handleResetDna}
              className="text-slate-500 px-5 py-2.5 rounded-full font-bold text-[14px] hover:text-[#1e293b] hover:bg-gray-50 transition-all active:scale-95 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button 
              onClick={() => setIsLooksGoodConfirmOpen(true)}
              className="bg-[#84cc16] text-white px-8 py-3 rounded-full font-extrabold text-[14px] hover:bg-[#65a30d] shadow-md shadow-lime-200/40 transition-all shrink-0 active:scale-95"
            >
              Looks good
            </button>
          </div>

        </div>
      </div>


      {/* ── Modals ── */}
      {tagsModalConfig.isOpen && (
        <TagsModal 
          title={tagsModalConfig.title}
          subtitle={tagsModalConfig.subtitle}
          placeholder={tagsModalConfig.placeholder}
          initialTags={tagsModalConfig.initialTags}
          onApply={(tags) => {
            if (tagsModalConfig.field) {
              setDna(prev => ({ ...prev, [tagsModalConfig.field as string]: tags.join(", ") }));
            }
            setTagsModalConfig({ ...tagsModalConfig, isOpen: false });
          }}
          onClose={() => setTagsModalConfig({ ...tagsModalConfig, isOpen: false })}
        />
      )}

      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 rounded-[32px] p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setEditingField(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shadow-sm">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-1 capitalize">
              {editingField.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            <p className="text-[14px] text-gray-500 mb-6 font-medium">Edit or add comma-separated values.</p>
            <textarea 
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-5 text-gray-900 text-[15px] outline-none focus:border-lime-500 min-h-[160px] resize-none font-semibold transition-colors shadow-inner"
              placeholder="Type here..."
            />
            <div className="flex justify-end mt-8">
               <button 
                 onClick={saveEdit}
                 className="bg-lime-400 text-white hover:bg-lime-500 px-10 py-3 rounded-full font-bold transition-all text-[14px] shadow-md active:scale-95"
               >
                 Apply
               </button>
            </div>
          </div>
        </div>
      )}

      {isColorModalOpen && (
        <ColorPickerModal 
          initialColors={Object.values(colors).slice(0, 4)} 
          onApply={(newColors) => {
            setDna(prev => ({
              ...prev,
              colors: {
                primary: newColors[0] || prev.colors.primary,
                secondary: newColors[1] || prev.colors.secondary,
                tertiary: newColors[2] || prev.colors.tertiary,
                quaternary: newColors[3] || prev.colors.quaternary,
              }
            }));
            setIsColorModalOpen(false);
          }}
          onClose={() => setIsColorModalOpen(false)}
        />
      )}

      {isFontModalOpen && (
        <FontPickerModal 
          initialHeadingFont={dna.typography?.headingFont || "Arial"}
          initialBodyFont={dna.typography?.bodyFont || "Arial"}
          onApply={(heading, body) => {
            setDna(prev => ({
              ...prev,
              typography: {
                headingFont: heading,
                bodyFont: body
              }
            }));
            setIsFontModalOpen(false);
          }}
          onClose={() => setIsFontModalOpen(false)}
        />
      )}

      {isNameModalOpen && (
        <BusinessNameModal 
          initialName={dna.brandName || "Unknown Brand"}
          onApply={(name) => {
            setDna(prev => ({ ...prev, brandName: name }));
            setIsNameModalOpen(false);
          }}
          onClose={() => setIsNameModalOpen(false)}
        />
      )}

      {isLogoModalOpen && (
        <LogoModal 
          initialLogoUrl={dna.logoUrl}
          onApply={(newUrl) => {
            setDna(prev => ({ ...prev, logoUrl: newUrl }));
            setIsLogoModalOpen(false);
          }}
          onClose={() => setIsLogoModalOpen(false)}
        />
      )}

      {isLooksGoodConfirmOpen && (
        <ConfirmationModal
          title="Start creating campaigns?"
          description="Your Brand DNA will be saved and used to generate social media content. You can always come back to edit it later."
          confirmLabel="Let's go →"
          isDestructive={false}
          onConfirm={() => {
            localStorage.setItem("brandDna", JSON.stringify(dna));
            window.location.href = '/campaigns/create';
          }}
          onClose={() => setIsLooksGoodConfirmOpen(false)}
        />
      )}

      {isResetConfirmOpen && (
        <ConfirmationModal
          title="Reset Business DNA?"
          description="Resetting your DNA will permanently delete all campaigns and creatives. You can't retrieve them."
          confirmLabel="Reset"
          isDestructive={true}
          onConfirm={() => {
            handleResetDna();
            setIsResetConfirmOpen(false);
          }}
          onClose={() => setIsResetConfirmOpen(false)}
        />
      )}

      {deleteImageIndex !== null && (
        <ConfirmationModal
          title="Delete image?"
          description="Are you sure you want to delete this image? It will be removed from your DNA."
          confirmLabel="Delete"
          isDestructive={true}
          onConfirm={() => {
            const newImages = [...(dna.images || [])];
            newImages.splice(deleteImageIndex, 1);
            setDna(prev => ({ ...prev, images: newImages }));
          }}
          onClose={() => setDeleteImageIndex(null)}
        />
      )}

      {lightboxImage && (
        <ImageLightboxModal 
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}

    </div>
  );
}
