"use client";

import { useState, useCallback } from "react";
import { Download, Copy, Check, X, Palette, Image as ImageIcon, ZoomIn } from "lucide-react";

interface ColorSwatch {
  name: string;
  hex: string;
  usage: string;
}

interface VisualAssetGalleryProps {
  images: string[];
  colors: ColorSwatch[];
  brandName?: string;
}

// ── Color Palette ──────────────────────────────────────────────────────────────
function ColorPalette({ colors }: { colors: ColorSwatch[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyHex = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(hex);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  const validColors = colors.filter(
    (c) => c.hex && /^#[0-9A-Fa-f]{3,8}$/.test(c.hex)
  );

  if (validColors.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-4 h-4 text-[#7C3AED]" />
        <h3 className="text-[15px] font-bold text-[#111111]">Colour Palette</h3>
        <span className="text-[11px] text-[#A1A1AA] bg-[#F4F4F5] px-2 py-0.5 rounded-full">
          Click to copy hex
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {validColors.map((color) => (
          <button
            key={color.hex}
            onClick={() => copyHex(color.hex)}
            title={`Copy ${color.hex}`}
            className="group flex flex-col items-center gap-2 cursor-pointer"
          >
            <div
              className="w-16 h-16 rounded-2xl shadow-sm border border-black/5 transition-transform group-hover:scale-105 group-hover:shadow-md relative overflow-hidden"
              style={{ backgroundColor: color.hex }}
            >
              {copied === color.hex && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold text-[#111111] uppercase">{color.hex}</div>
              <div className="text-[10px] text-[#A1A1AA] capitalize">{color.usage}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Image Lightbox ─────────────────────────────────────────────────────────────
function Lightbox({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(src).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = src.split("/").pop() || "image";
    a.target = "_blank";
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-2">
            <button
              onClick={copyUrl}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy URL"}
            </button>
            <button
              onClick={download}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-1.5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <img
          src={src}
          alt=""
          className="max-w-full max-h-[90vh] object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f4f4f5'/%3E%3C/svg%3E";
          }}
        />
      </div>
    </div>
  );
}

// ── Single masonry card ────────────────────────────────────────────────────────
function ImageCard({ src, index }: { src: string; index: number }) {
  const [lightbox, setLightbox] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);

  const copyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(src).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const download = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = src;
    a.download = `asset-${index + 1}`;
    a.target = "_blank";
    a.click();
  };

  if (imgError) return null;

  return (
    <>
      <div
        className="group relative rounded-xl overflow-hidden cursor-zoom-in bg-[#F4F4F5] break-inside-avoid mb-3"
        onClick={() => setLightbox(true)}
      >
        <img
          src={src}
          alt={`Brand asset ${index + 1}`}
          className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]"
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
          }}
          onError={() => setImgError(true)}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex flex-col items-end justify-end p-2 gap-1.5 opacity-0 group-hover:opacity-100">
          {dimensions && (
            <div className="absolute top-2 left-2 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
              {dimensions.w} × {dimensions.h}
            </div>
          )}
          <div className="absolute top-2 right-2">
            <ZoomIn className="w-4 h-4 text-white drop-shadow" />
          </div>
          <div className="flex gap-1.5 w-full">
            <button
              onClick={copyUrl}
              className="flex-1 flex items-center justify-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[11px] font-semibold py-1.5 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={download}
              className="flex-1 flex items-center justify-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[11px] font-semibold py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3 h-3" />
              Save
            </button>
          </div>
        </div>
      </div>

      {lightbox && <Lightbox src={src} onClose={() => setLightbox(false)} />}
    </>
  );
}

// ── Main Gallery ───────────────────────────────────────────────────────────────
export default function VisualAssetGallery({
  images,
  colors,
  brandName,
}: VisualAssetGalleryProps) {
  const validImages = images.filter(
    (u) => typeof u === "string" && u.startsWith("http") && !u.includes(" ")
  );

  return (
    <div>
      {/* Color Palette */}
      <ColorPalette colors={colors} />

      {/* Image Gallery */}
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-4 h-4 text-[#2563EB]" />
        <h3 className="text-[15px] font-bold text-[#111111]">Brand Assets</h3>
        <span className="text-[11px] text-[#A1A1AA] bg-[#F4F4F5] px-2 py-0.5 rounded-full">
          {validImages.length} images · hover to inspect · click to expand
        </span>
      </div>

      {validImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#F9FAFB] rounded-2xl border border-dashed border-[#E5E7EB]">
          <ImageIcon className="w-10 h-10 text-[#D4D4D8] mb-3" />
          <p className="text-[14px] font-semibold text-[#71717A]">No images extracted</p>
          <p className="text-[12px] text-[#A1A1AA] mt-1">
            Re-run the scraper to capture brand assets
          </p>
        </div>
      ) : (
        /* Masonry grid — 2 cols on mobile, 3 on md, 4 on lg */
        <div
          style={{
            columnCount: undefined,
          }}
          className="columns-2 md:columns-3 lg:columns-4 gap-3"
        >
          {validImages.map((src, i) => (
            <ImageCard key={`${src}-${i}`} src={src} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
