"use client";

import { useState } from "react";
import { Link, Upload, Pencil, X, Image as ImageIcon, Camera, RotateCcw, Dna } from "lucide-react";
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
    background: string;
    textHighContrast: string;
    accent: string;
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
  const [deleteImageIndex, setDeleteImageIndex] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Tags Modal State
  const [tagsModalConfig, setTagsModalConfig] = useState<{
    isOpen: boolean;
    field: "brandValue" | "brandAesthetic" | "toneOfVoice" | null;
    title: string;
    subtitle: string;
    placeholder: string;
    initialTags: string[];
  }>({ isOpen: false, field: null, title: "", subtitle: "", placeholder: "", initialTags: [] });

  // Fallback for simple text fields
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
    primary: "#ffffff",
    secondary: "#aaaaaa",
    background: "#000000",
    textHighContrast: "#ffffff",
    accent: "#cccccc"
  };

  return (
    <div className="w-full relative pb-12 pt-16 sm:pt-20 text-[#EAEAEA] flex flex-col items-center">

      {/* ── Header ── */}
      <div className="flex flex-col items-center justify-center mb-10 text-center relative z-10 w-full px-4">
        <Dna className="w-6 h-6 text-[#9A9A9C] mb-3" />
        <h1 className="text-4xl md:text-[44px] tracking-tight font-serif italic text-[#EAEAEA] mb-3">Your Business DNA</h1>
        <p className="text-[#9A9A9C] text-[15px] font-medium max-w-[500px] leading-relaxed">
          Here is a snapshot of your business that we'll use to create social media campaigns.<br/>Feel free to edit this at anytime.
        </p>
      </div>

      {/* ── Main Board Container ── */}
      <div className="bg-[#2C2D2E] rounded-[32px] p-6 lg:p-10 w-full max-w-[1040px] shadow-2xl relative mx-4 h-[calc(100vh-200px)] min-h-[600px] flex flex-col">
        
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 min-h-0">

          {/* ═══════ COLUMN 1: Brand Info (Name, Logo, Fonts, Colors, Text Details) ═══════ */}
          <div className="flex flex-col gap-4 lg:gap-5 flex-1 min-w-0 overflow-y-auto scrollbar-none pb-20 lg:pb-0 pr-2">

            {/* Brand Name + URL */}
            <div 
              className="w-full bg-[#363738] rounded-2xl p-6 lg:p-8 flex flex-col justify-center min-h-[120px] relative group cursor-pointer hover:ring-1 hover:ring-[#C1CD7D] transition-all shrink-0"
              onClick={() => setIsNameModalOpen(true)} // Open BusinessNameModal
            >
              <div className="text-4xl lg:text-5xl font-medium text-[#EAEAEA] mb-3 truncate w-full pr-10">
                {dna.brandName || "Unknown Brand"}
              </div>
              <div className="flex items-center text-[13px] text-[#9A9A9C] gap-2 font-medium">
                <Link className="w-4 h-4" />
                <span>{dna.brandName ? `https://www.${dna.brandName.toLowerCase().replace(/\s+/g, '')}.com/` : "https://pomelli.com/"}</span>
              </div>
              <div className="absolute top-5 right-5 bg-[#4A4B4D] rounded-full p-2 text-[#C1CD7D] opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="w-4 h-4" />
              </div>
            </div>

            {/* Logo + Fonts side-by-side */}
            <div className="grid grid-cols-2 gap-4 lg:gap-5 shrink-0">
              {/* Logo */}
              <div 
                className="bg-[#363738] rounded-2xl p-6 flex flex-col items-center justify-center aspect-[4/3] relative overflow-hidden group cursor-pointer hover:ring-1 hover:ring-[#C1CD7D] transition-all"
                onClick={() => setIsLogoModalOpen(true)} // Open LogoModal
              >
                {dna.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dna.logoUrl} alt="Logo" className="w-full h-full object-contain mix-blend-screen drop-shadow-md relative z-0" />
                ) : (
                  <div className="text-zinc-500 flex flex-col items-center justify-center gap-2 h-full">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                    <span className="text-xs font-medium uppercase tracking-widest">No Logo</span>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-[#4A4B4D] rounded-full p-2 text-[#C1CD7D] opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md">
                  <Pencil className="w-4 h-4" />
                </div>
              </div>

              {/* Fonts */}
              <div 
                className="bg-[#363738] rounded-2xl p-6 flex flex-col aspect-[4/3] relative cursor-pointer hover:ring-1 hover:ring-[#C1CD7D] transition-all group"
                onClick={() => setIsFontModalOpen(true)}
              >
                <div className="text-[15px] font-medium text-[#EAEAEA]">Fonts</div>
                <div className="flex-1 flex gap-4 items-center justify-center relative -mt-2 pr-2">
                  <div className="flex flex-col items-center w-1/2">
                    <div className="text-4xl lg:text-5xl text-[#C1CD7D] tracking-tight group-hover:scale-105 transition-transform" style={{ fontFamily: dna.typography?.headingFont }}>Aa</div>
                    <div className="text-[11px] font-medium text-center text-[#9A9A9C] w-full mt-3 truncate">
                       {dna.typography?.headingFont || "Nike Futura Nd"}
                    </div>
                  </div>
                  <div className="flex flex-col items-center w-1/2">
                    <div className="text-4xl lg:text-5xl text-[#C1CD7D] tracking-tight group-hover:scale-105 transition-transform" style={{ fontFamily: dna.typography?.bodyFont }}>Aa</div>
                    <div className="text-[11px] font-medium text-center text-[#9A9A9C] w-full mt-3 truncate">
                       {dna.typography?.bodyFont || "Helvetica Now Medium"}
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-[#4A4B4D] rounded-full p-2 text-[#C1CD7D] opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md">
                  <Pencil className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div 
              className="w-full bg-[#363738] rounded-2xl p-6 lg:p-8 flex flex-col cursor-pointer hover:ring-1 hover:ring-[#C1CD7D] transition-all group relative shrink-0"
              onClick={() => setIsColorModalOpen(true)}
            >
              <div className="text-[15px] font-medium text-[#EAEAEA] mb-6">Colors</div>
              <div className="flex gap-4 sm:gap-6 items-center justify-start overflow-x-auto pb-2 scrollbar-none pr-10">
                {Object.values(colors).map((value, i) => (
                  <div key={i} className="flex flex-col items-center gap-4 relative group/swatch shrink-0">
                    <div 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-lg border-2 border-[#2C2D2E] group-hover/swatch:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: value }}
                    />
                  </div>
                ))}
              </div>
              <div className="absolute top-5 right-5 bg-[#4A4B4D] rounded-full p-2 text-[#C1CD7D] opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                <Pencil className="w-4 h-4" />
              </div>
            </div>

            {/* Tagline & Brand Values */}
            <div className="grid grid-cols-2 gap-4 lg:gap-5 shrink-0">
              {/* Tagline */}
              <div 
                className="bg-[#363738] rounded-2xl p-6 flex flex-col relative group cursor-pointer hover:ring-1 hover:ring-[#C1CD7D] transition-all min-h-[140px]"
                onClick={() => openEditor("tagline", dna.tagline || "")} // Use generic text modal
              >
                <div className="text-[15px] font-medium text-[#EAEAEA] mb-3">Tagline</div>
                <div className="text-xl lg:text-2xl font-serif text-[#C1CD7D] italic leading-tight w-full pr-6 line-clamp-2">
                  {dna.tagline || "Your first digital..."}
                </div>
                <div className="absolute top-4 right-4 bg-[#4A4B4D] rounded-full p-2 text-[#C1CD7D] opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <Pencil className="w-4 h-4" />
                </div>
              </div>

              {/* Brand Values */}
              <div 
                className="bg-[#363738] rounded-2xl p-6 flex flex-col relative group cursor-pointer hover:ring-1 hover:ring-[#C1CD7D] transition-all min-h-[140px]"
                onClick={() => setTagsModalConfig({
                  isOpen: true,
                  field: "brandValue",
                  title: "Brand values",
                  subtitle: "Describe your brand's values",
                  placeholder: "Press Enter to add a new brand value...",
                  initialTags: formatPills(dna.brandValue || "Transparency, Full ownership, Respect & gratitude, Work is play")
                })}
              >
                <div className="text-[15px] font-medium text-[#EAEAEA] mb-4">Brand values</div>
                <div className="flex flex-wrap gap-2 pr-6">
                  {formatPills(dna.brandValue || "Transparency, Full ownership, Respect & gratitude, Work is play").map((pill, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full border border-white/5 text-[12px] font-medium text-[#9A9A9C] bg-[#2C2D2E] shadow-sm">{pill}</span>
                  ))}
                </div>
                <div className="absolute top-4 right-4 bg-[#4A4B4D] rounded-full p-2 text-[#C1CD7D] opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <Pencil className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Brand Aesthetic & Tone of Voice */}
            <div className="grid grid-cols-2 gap-4 lg:gap-5 shrink-0">
              {/* Brand Aesthetic */}
              <div 
                className="bg-[#363738] rounded-2xl p-6 flex flex-col relative group cursor-pointer hover:ring-1 hover:ring-[#C1CD7D] transition-all min-h-[140px]"
                onClick={() => setTagsModalConfig({
                  isOpen: true,
                  field: "brandAesthetic",
                  title: "Brand aesthetic",
                  subtitle: "Describe your brand's aesthetic",
                  placeholder: "Press Enter to add a new aesthetic...",
                  initialTags: formatPills(dna.brandAesthetic || "Whimsical-Futurism, Human-Centric, Polished, Accessible, Vibrant")
                })}
              >
                <div className="text-[15px] font-medium text-[#EAEAEA] mb-4">Brand aesthetic</div>
                <div className="flex flex-wrap gap-2 pr-6">
                  {formatPills(dna.brandAesthetic || "Whimsical-Futurism, Human-Centric, Polished, Accessible, Vibrant").map((pill, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full border border-white/5 text-[12px] font-medium text-[#9A9A9C] bg-[#2C2D2E] shadow-sm">{pill}</span>
                  ))}
                </div>
                <div className="absolute top-4 right-4 bg-[#4A4B4D] rounded-full p-2 text-[#C1CD7D] opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <Pencil className="w-4 h-4" />
                </div>
              </div>

              {/* Tone of Voice */}
              <div 
                className="bg-[#363738] rounded-2xl p-6 flex flex-col relative group cursor-pointer hover:ring-1 hover:ring-[#C1CD7D] transition-all min-h-[140px]"
                onClick={() => setTagsModalConfig({
                  isOpen: true,
                  field: "toneOfVoice",
                  title: "Brand tone of voice",
                  subtitle: "Describe your brand's tone of voice",
                  placeholder: "Press Enter to add a new tone...",
                  initialTags: formatPills(dna.toneOfVoice || "Friendly, Approachable, Simple, Bold")
                })}
              >
                <div className="text-[15px] font-medium text-[#EAEAEA] mb-4">Brand tone of voice</div>
                <div className="flex flex-wrap gap-2 pr-6">
                  {formatPills(dna.toneOfVoice || "Friendly, Approachable, Simple, Bold").map((pill, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full border border-white/5 text-[12px] font-medium text-[#9A9A9C] bg-[#2C2D2E] shadow-sm">{pill}</span>
                  ))}
                </div>
                <div className="absolute top-4 right-4 bg-[#4A4B4D] rounded-full p-2 text-[#C1CD7D] opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <Pencil className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Business Overview */}
            <div 
              className="w-full bg-[#363738] rounded-2xl p-6 lg:p-8 flex flex-col relative group cursor-pointer hover:ring-1 hover:ring-[#C1CD7D] transition-all shrink-0 min-h-[140px]"
              onClick={() => openEditor("businessOverview", dna.businessOverview || "")} // Use generic text modal
            >
              <div className="text-[15px] font-medium text-[#EAEAEA] mb-3">Business overview</div>
              <p className="text-[#9A9A9C] text-[13px] leading-relaxed pr-8">
                 {dna.businessOverview || "Sintra AI provides a specialized team of digital AI employees designed to automate repetitive business tasks across marketing, operations, and support 24/7. The platform enables entrepreneurs and small businesses to scale efficiently by delegating work to AI agents that learn specific brand contexts and integrate with existing tools."}
              </p>
              <div className="absolute top-5 right-5 bg-[#4A4B4D] rounded-full p-2 text-[#C1CD7D] opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                <Pencil className="w-4 h-4" />
              </div>
            </div>

          </div>

          {/* ═══════ COLUMN 2: Images ═══════ */}
          <div className="flex flex-col w-full lg:w-[420px] shrink-0 overflow-y-auto scrollbar-none pb-20 lg:pb-0 pr-2 relative">

            <div className="text-[15px] font-medium text-[#EAEAEA] mb-4">Images</div>
            
            {/* Endless Creatives CTA */}
            <div className="mb-4 bg-[#3d3f38] p-5 rounded-[20px] shadow-sm flex flex-col gap-3 relative overflow-hidden">
                <div className="relative z-10 w-2/3 md:w-full lg:w-3/4">
                  <div className="text-[14px] font-medium text-[#EAEAEA] mb-2">Endless creatives, ready in minutes</div>
                  <p className="text-[13px] text-[#9A9A9C] leading-snug mb-4">
                    Skip the cost and complexity of traditional photoshoots and generate compelling, on-brand images that drive your sales.
                  </p>
                  <a href="/photoshoot" className="inline-flex items-center gap-2 bg-[#C1CD7D] text-[#1B1B1B] text-[13px] font-semibold px-4 py-2.5 rounded-[12px] w-fit hover:bg-[#D4E08F] transition-colors">
                    <Camera className="w-4 h-4 text-[#1B1B1B]" />
                    Try Photoshoot
                  </a>
                </div>
                {/* Simulated background images behind text on the right side based on classic layout patterns */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 md:w-auto opacity-30 lg:opacity-40">
                  <div className="grid grid-cols-2 gap-1 h-full py-2">
                    <div className="w-12 h-12 bg-zinc-800 rounded-md"></div>
                    <div className="w-12 h-12 bg-zinc-700 rounded-md"></div>
                    <div className="w-12 h-12 bg-zinc-600 rounded-md"></div>
                    <div className="w-12 h-12 bg-zinc-800 rounded-md"></div>
                  </div>
                </div>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 content-start">
              {/* Upload Button */}
              <div className="bg-[#363738] text-[#C1CD7D] rounded-[20px] aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-[#4A4B4D] transition-colors group/upload">
                <Upload className="w-5 h-5 mb-2 group-hover/upload:-translate-y-1 transition-transform" />
                <span className="text-[12px] font-medium text-center leading-tight">Upload<br/>Images</span>
              </div>
              
              {/* Thumbnails */}
              {(dna.images || []).slice(0, 11).map((img, i) => (
                <div 
                  key={i} 
                  className="aspect-square bg-[#363738] rounded-[20px] overflow-hidden relative group/img cursor-pointer"
                  onClick={() => setLightboxImage(img)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                  
                  {/* Hover Delete Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity">
                     <button 
                       className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-[#2C2D2E]/90 text-[#EAEAEA] backdrop-blur hover:bg-[#414244] transition-colors"
                       onClick={(e) => { e.stopPropagation(); setDeleteImageIndex(i); }}
                     >
                       <X className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Looks Good Footer & Reset */}
            <div className="mt-4 pt-6 flex items-center justify-between">
              {/* Moved Reset button to bottom left slightly muted */}
              <button 
                onClick={() => setIsResetConfirmOpen(true)}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 font-medium text-[12px] transition-colors group"
              >
                <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" />
                Reset DNA
              </button>
              
              <div className="flex items-center gap-6">
                <span className="text-[#9A9A9C] text-[13px] font-medium tracking-wide">
                  Next we&apos;ll use your Business DNA to generate social media campaigns
                </span>
                <button 
                  className="bg-[#C1CD7D] text-[#1B1B1B] px-8 py-3 rounded-full font-semibold text-[14px] hover:bg-[#D4E08F] shadow-lg transition-colors"
                >
                  Looks good
                </button>
              </div>
            </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#2B2B2D] border border-white/5 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setEditingField(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-medium text-[#EAEAEA] mb-1 capitalize">
              {editingField.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            <p className="text-sm text-[#9A9A9C] mb-4">Edit or add comma-separated values.</p>
            <textarea 
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full bg-transparent border border-[#C4CE83] rounded-lg p-4 text-[#EAEAEA] text-sm outline-none focus:ring-1 focus:ring-[#C4CE83] min-h-[120px] resize-none"
              placeholder="Type here..."
            />
            <div className="flex justify-end mt-4">
               <button 
                 onClick={saveEdit}
                 className="bg-[#414138] text-[#C4CE83] hover:bg-[#4E5042] px-6 py-2 rounded-full font-medium transition-colors text-sm"
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
                background: newColors[2] || prev.colors.background,
                textHighContrast: newColors[3] || prev.colors.textHighContrast,
                accent: prev.colors.accent
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

      {isResetConfirmOpen && (
        <ConfirmationModal
          title="Reset Business DNA?"
          description="Resetting your DNA will permanently delete all campaigns and creatives. You can't retrieve them."
          confirmLabel="Reset"
          isDestructive={true}
          onConfirm={() => {
            // Actual reset logic would clear state and maybe redirect
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
