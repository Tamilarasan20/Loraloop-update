"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import {
  Loader2,
  Send,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  Image as ImageIcon,
  RefreshCw,
  Wand2,
} from "lucide-react";

// ─── Platform config ───────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "Instagram", label: "Instagram", emoji: "📸", ratio: 4 / 5 },
  { id: "Facebook", label: "Facebook", emoji: "📘", ratio: 1.91 },
  { id: "TikTok", label: "TikTok", emoji: "🎵", ratio: 9 / 16 },
  { id: "LinkedIn", label: "LinkedIn", emoji: "💼", ratio: 1.91 },
  { id: "X", label: "X / Twitter", emoji: "𝕏", ratio: 16 / 9 },
  { id: "Instagram Story", label: "Story / Reel", emoji: "⚡", ratio: 9 / 16 },
];

const SLIDE_COUNTS = [3, 5, 7, 10];

const QUICK_PROMPTS = [
  { label: "Promote a product launch", emoji: "🚀" },
  { label: "Share a brand story", emoji: "✨" },
  { label: "Educate my audience", emoji: "💡" },
  { label: "Announce a sale or offer", emoji: "🔥" },
  { label: "Showcase customer testimonial", emoji: "⭐" },
  { label: "Behind the scenes content", emoji: "📷" },
];

// ─── Slide renderer ───────────────────────────────────────────────────────────
interface Slide {
  slideNumber: number;
  role: string;
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  visualDirection: string;
  layout: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  overlayOpacity?: number;
  emojiAccent?: string;
  designNotes?: string;
}

interface BrandMeta {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  headingFont: string;
  bodyFont: string;
  logo?: string | null;
  images?: string[];
  platformSpec: { ratio: string; width: number; height: number };
}

interface Design {
  title: string;
  platform: string;
  format: string;
  slides: Slide[];
  brandMeta: BrandMeta;
}

function isLight(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function contrastText(bg: string): string {
  return isLight(bg) ? "#111111" : "#FFFFFF";
}

// Render one slide as a visual card
function SlideCard({
  slide,
  meta,
  ratio,
  width = 340,
}: {
  slide: Slide;
  meta: BrandMeta;
  ratio: number;
  width?: number;
}) {
  const height = Math.round(width / ratio);
  const bg = slide.backgroundColor || meta.primaryColor;
  const fg = slide.textColor || contrastText(bg);
  const accent = slide.accentColor || meta.secondaryColor;
  const centered = slide.layout === "centered" || !slide.layout;
  const split = slide.layout === "split";
  const overlayTop = slide.layout === "top-bottom";

  // Pick a background pattern color
  const patternColor = isLight(bg)
    ? "rgba(0,0,0,0.04)"
    : "rgba(255,255,255,0.05)";

  return (
    <div
      className="relative overflow-hidden rounded-2xl flex-shrink-0 select-none"
      style={{
        width,
        height,
        backgroundColor: bg,
        fontFamily: meta.headingFont + ", Inter, sans-serif",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      }}
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${patternColor} 1.5px, transparent 1.5px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Gradient overlay for visual depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: split
            ? `linear-gradient(135deg, ${bg} 45%, ${accent}33 100%)`
            : overlayTop
            ? `linear-gradient(180deg, ${accent}22 0%, transparent 40%)`
            : `radial-gradient(ellipse at 80% 20%, ${accent}22 0%, transparent 60%)`,
        }}
      />

      {/* Decorative accent shape */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: width * 0.55,
          height: width * 0.55,
          borderRadius: "50%",
          background: accent + "18",
          top: -width * 0.15,
          right: -width * 0.1,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: width * 0.3,
          height: width * 0.3,
          borderRadius: "50%",
          background: accent + "12",
          bottom: -width * 0.08,
          left: -width * 0.05,
        }}
      />

      {/* Content */}
      <div
        className="absolute inset-0 flex flex-col p-5"
        style={{
          justifyContent: centered ? "center" : split ? "flex-end" : "flex-start",
          alignItems: centered ? "center" : "flex-start",
          textAlign: centered ? "center" : "left",
        }}
      >
        {/* Slide role badge */}
        <div
          className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
          style={{
            background: accent + "33",
            color: accent === "#FFFFFF" || isLight(accent) ? fg : accent,
            border: `1px solid ${accent}55`,
          }}
        >
          {slide.emojiAccent && <span>{slide.emojiAccent}</span>}
          {slide.role}
        </div>

        {/* Headline */}
        <div
          className="font-black leading-tight mb-2"
          style={{
            fontSize: Math.max(14, Math.round(width * 0.072)) + "px",
            color: fg,
            letterSpacing: "-0.02em",
            textShadow: isLight(bg) ? "none" : "0 1px 4px rgba(0,0,0,0.3)",
            maxWidth: "90%",
          }}
        >
          {slide.headline}
        </div>

        {/* Subhead */}
        {slide.subhead && (
          <div
            className="font-semibold leading-snug mb-2"
            style={{
              fontSize: Math.max(9, Math.round(width * 0.038)) + "px",
              color: fg + "CC",
              maxWidth: "85%",
            }}
          >
            {slide.subhead}
          </div>
        )}

        {/* Body */}
        {slide.body && (
          <div
            className="leading-snug mb-3"
            style={{
              fontSize: Math.max(8, Math.round(width * 0.032)) + "px",
              color: fg + "99",
              maxWidth: "88%",
              fontFamily: meta.bodyFont + ", Inter, sans-serif",
              whiteSpace: "pre-wrap",
            }}
          >
            {slide.body}
          </div>
        )}

        {/* CTA */}
        {slide.cta && (
          <div
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-bold"
            style={{
              fontSize: Math.max(8, Math.round(width * 0.032)) + "px",
              background: accent,
              color: contrastText(accent),
              boxShadow: `0 4px 14px ${accent}55`,
            }}
          >
            {slide.cta}
          </div>
        )}
      </div>

      {/* Brand footer */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2"
        style={{
          background: isLight(bg)
            ? "rgba(255,255,255,0.7)"
            : "rgba(0,0,0,0.25)",
          backdropFilter: "blur(6px)",
          borderTop: `1px solid ${fg}15`,
        }}
      >
        {meta.logo ? (
          <img src={meta.logo} alt={meta.name} className="h-4 object-contain max-w-[80px] opacity-80" />
        ) : (
          <span
            className="font-black tracking-tight"
            style={{ fontSize: Math.max(7, Math.round(width * 0.028)) + "px", color: fg + "BB" }}
          >
            {meta.name}
          </span>
        )}
        <span
          className="font-medium"
          style={{ fontSize: Math.max(6, Math.round(width * 0.024)) + "px", color: fg + "66" }}
        >
          {slide.slideNumber}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function StevePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const businessId = searchParams.get("id");

  const [platform, setPlatform] = useState("Instagram");
  const [format, setFormat] = useState<"single" | "carousel">("single");
  const [slideCount, setSlideCount] = useState(5);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [design, setDesign] = useState<Design | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!businessId) router.push("/");
  }, [businessId, router]);

  const currentPlatform = PLATFORMS.find((p) => p.id === platform) || PLATFORMS[0];
  const ratio = currentPlatform.ratio;

  const generate = async (customPrompt?: string) => {
    const p = customPrompt || prompt;
    if (!p.trim() || !businessId || loading) return;

    setLoading(true);
    setError("");
    setDesign(null);
    setCurrentSlide(0);

    try {
      const res = await fetch("/api/steve-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          prompt: p,
          platform,
          format,
          slideCount: format === "carousel" ? slideCount : 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setDesign(data.design);
      if (customPrompt) setPrompt(customPrompt);
    } catch (e: any) {
      setError(e.message || "Failed to generate design");
    } finally {
      setLoading(false);
    }
  };

  const totalSlides = design?.slides?.length || 0;

  if (!businessId) {
    return (
      <div className="flex-1 min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0F0F13] min-h-screen text-white">
      {/* ── Header ── */}
      <div className="border-b border-white/10 px-8 py-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#DB2777] flex items-center justify-center shadow-lg">
          <Wand2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-[20px] font-black text-white tracking-tight flex items-center gap-2">
            Steve
            <span className="text-[13px] font-semibold text-white/40 ml-1">· AI Visual Designer</span>
          </h1>
          <p className="text-[12px] text-white/40 mt-0.5">
            Scroll-stopping posts & carousels, built from your brand
          </p>
        </div>

        {design && (
          <button
            onClick={() => { setDesign(null); setPrompt(""); setCurrentSlide(0); }}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[13px] font-semibold text-white/70 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            New Design
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Left panel: Controls ── */}
        <div className="w-[300px] shrink-0 border-r border-white/10 flex flex-col py-6 px-5 gap-6 overflow-y-auto">
          {/* Platform selector */}
          <div>
            <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Platform</div>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                    platform === p.id
                      ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30"
                      : "bg-white/8 text-white/60 hover:bg-white/12 hover:text-white/90"
                  }`}
                >
                  <span className="text-[14px]">{p.emoji}</span>
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Format toggle */}
          <div>
            <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Format</div>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat("single")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                  format === "single"
                    ? "bg-[#DB2777] text-white shadow-lg shadow-[#DB2777]/30"
                    : "bg-white/8 text-white/60 hover:bg-white/12"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Single Post
              </button>
              <button
                onClick={() => setFormat("carousel")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                  format === "carousel"
                    ? "bg-[#DB2777] text-white shadow-lg shadow-[#DB2777]/30"
                    : "bg-white/8 text-white/60 hover:bg-white/12"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Carousel
              </button>
            </div>
          </div>

          {/* Slide count (carousel only) */}
          {format === "carousel" && (
            <div>
              <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">
                Slides
              </div>
              <div className="flex gap-2">
                {SLIDE_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setSlideCount(n)}
                    className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                      slideCount === n
                        ? "bg-white text-[#111] shadow-md"
                        : "bg-white/8 text-white/60 hover:bg-white/12 hover:text-white/90"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick prompts */}
          <div>
            <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">
              Quick Starters
            </div>
            <div className="flex flex-col gap-1.5">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => generate(q.label)}
                  disabled={loading}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/6 hover:bg-white/12 text-[12px] font-medium text-white/70 hover:text-white transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-[15px]">{q.emoji}</span>
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Design notes (if design exists) */}
          {design?.slides[currentSlide]?.designNotes && (
            <div className="rounded-xl bg-white/6 border border-white/10 p-4">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                Designer Notes
              </div>
              <p className="text-[12px] text-white/60 leading-relaxed">
                {design.slides[currentSlide].designNotes}
              </p>
            </div>
          )}

          {/* Visual direction */}
          {design?.slides[currentSlide]?.visualDirection && (
            <div className="rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 p-4">
              <div className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-widest mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Visual Direction
              </div>
              <p className="text-[12px] text-white/60 leading-relaxed">
                {design.slides[currentSlide].visualDirection}
              </p>
            </div>
          )}
        </div>

        {/* ── Center: Preview canvas ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 gap-6 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#DB2777] flex items-center justify-center shadow-2xl">
                  <Wand2 className="w-9 h-9 text-white" />
                </div>
                <div className="absolute -inset-2 rounded-3xl border-2 border-[#7C3AED]/40 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-[18px] font-bold text-white mb-1">Steve is designing…</p>
                <p className="text-[13px] text-white/40">
                  Crafting scroll-stopping visuals for {platform}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="max-w-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-[15px] font-semibold text-white mb-2">Design failed</p>
              <p className="text-[13px] text-white/50 mb-4">{error}</p>
              <button
                onClick={() => generate()}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[13px] font-semibold text-white transition-colors"
              >
                Try again
              </button>
            </div>
          ) : design ? (
            <>
              {/* Campaign title */}
              <div className="text-center">
                <h2 className="text-[16px] font-bold text-white">{design.title}</h2>
                <p className="text-[12px] text-white/40 mt-0.5">
                  {design.platform} · {format === "carousel" ? `${totalSlides} slides` : "Single post"}
                </p>
              </div>

              {/* Slide preview */}
              <div className="relative flex items-center gap-4">
                {totalSlides > 1 && (
                  <button
                    onClick={() => setCurrentSlide((s) => Math.max(0, s - 1))}
                    disabled={currentSlide === 0}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30 transition-colors shrink-0"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                <SlideCard
                  slide={design.slides[currentSlide]}
                  meta={design.brandMeta}
                  ratio={ratio}
                  width={Math.min(360, Math.round((window?.innerHeight || 800) * 0.55 * ratio))}
                />

                {totalSlides > 1 && (
                  <button
                    onClick={() => setCurrentSlide((s) => Math.min(totalSlides - 1, s + 1))}
                    disabled={currentSlide === totalSlides - 1}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30 transition-colors shrink-0"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Slide dots */}
              {totalSlides > 1 && (
                <div className="flex gap-1.5">
                  {design.slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`transition-all rounded-full ${
                        i === currentSlide
                          ? "w-5 h-2 bg-[#7C3AED]"
                          : "w-2 h-2 bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Thumbnail strip for carousel */}
              {totalSlides > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                  {design.slides.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`relative shrink-0 rounded-lg overflow-hidden transition-all ${
                        i === currentSlide
                          ? "ring-2 ring-[#7C3AED] ring-offset-2 ring-offset-[#0F0F13]"
                          : "opacity-50 hover:opacity-80"
                      }`}
                      style={{ width: 52, height: Math.round(52 / ratio) }}
                    >
                      <SlideCard slide={s} meta={design.brandMeta} ratio={ratio} width={52} />
                    </button>
                  ))}
                </div>
              )}

              {/* Color palette used */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/30">Brand palette used:</span>
                <div className="flex gap-1.5">
                  {design.slides.map((s) => s.backgroundColor).filter((v, i, a) => a.indexOf(v) === i).map((c) => (
                    <div
                      key={c}
                      className="w-5 h-5 rounded-full border border-white/20"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center gap-5 max-w-md text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED]/30 to-[#DB2777]/30 border border-white/10 flex items-center justify-center">
                <Wand2 className="w-9 h-9 text-white/40" />
              </div>
              <div>
                <h2 className="text-[20px] font-black text-white mb-2">
                  Hi, I'm Steve 👋
                </h2>
                <p className="text-[14px] text-white/50 leading-relaxed">
                  Tell me what to design and I'll create scroll-stopping visuals using your brand's colors, fonts, and voice.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Instagram carousel", "Product launch post", "Quote graphic"].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setPrompt(ex); inputRef.current?.focus(); }}
                    className="px-3 py-1.5 rounded-full bg-white/8 hover:bg-white/14 text-[12px] font-medium text-white/60 hover:text-white/90 transition-colors border border-white/10"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom input ── */}
      <div className="border-t border-white/10 bg-[#0F0F13] px-8 py-5">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                generate();
              }
            }}
            placeholder={`Describe what you want Steve to design for ${currentPlatform.label}…`}
            disabled={loading}
            className="flex-1 px-5 py-3.5 rounded-2xl bg-white/8 border border-white/15 focus:border-[#7C3AED]/70 focus:ring-2 focus:ring-[#7C3AED]/20 outline-none text-[14px] text-white placeholder:text-white/30 disabled:opacity-50 transition-all"
          />
          <button
            onClick={() => generate()}
            disabled={loading || !prompt.trim()}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#DB2777] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-[#7C3AED]/30 self-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-[11px] text-white/25 mt-2.5 text-center">
          Steve uses your brand knowledge base to create on-brand visuals
        </p>
      </div>
    </div>
  );
}

export default function StevePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 min-h-screen bg-[#0F0F13] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
        </div>
      }
    >
      <StevePageInner />
    </Suspense>
  );
}
