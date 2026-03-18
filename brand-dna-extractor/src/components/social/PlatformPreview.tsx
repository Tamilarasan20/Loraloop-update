"use client";

import { DEFAULT_PLATFORMS, type Platform } from "./PlatformSelector";

interface PlatformPreviewProps {
  content: string;
  platforms: string[];
  images: string[];
}

function TwitterPreview({ content, images }: { content: string; images: string[] }) {
  const truncated = content.length > 280 ? content.slice(0, 277) + "..." : content;
  return (
    <div className="bg-white rounded-2xl p-4 text-black max-w-[380px] shadow-lg border border-gray-100">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C1CD7D] to-[#8fa37a] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[14px]">Growloop</span>
            <span className="text-gray-400 text-[13px]">@growloop · 1m</span>
          </div>
          <p className="text-[14px] leading-[1.4] mt-1 whitespace-pre-wrap break-words">
            {truncated}
          </p>
          {images.length > 0 && (
            <div className={`grid gap-1 mt-3 rounded-2xl overflow-hidden ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {images.slice(0, 4).map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt="" className="w-full h-32 object-cover" />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-3 text-gray-400">
            <span className="text-[12px]">💬 0</span>
            <span className="text-[12px]">🔁 0</span>
            <span className="text-[12px]">❤️ 0</span>
            <span className="text-[12px]">📊 0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInPreview({ content, images }: { content: string; images: string[] }) {
  const truncated = content.length > 300 ? content.slice(0, 297) + "...see more" : content;
  return (
    <div className="bg-white rounded-xl p-4 text-black max-w-[380px] shadow-lg border border-gray-200">
      <div className="flex gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] shrink-0" />
        <div>
          <span className="font-semibold text-[14px] block">Growloop AI</span>
          <span className="text-gray-500 text-[12px] block">AI-Powered Growth · 1m</span>
          <span className="text-gray-400 text-[11px]">🌍</span>
        </div>
      </div>
      <p className="text-[14px] leading-[1.5] whitespace-pre-wrap break-words">
        {truncated}
      </p>
      {images.length > 0 && (
        <div className="mt-3 rounded-lg overflow-hidden -mx-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0]} alt="" className="w-full h-48 object-cover" />
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-gray-500 text-[12px]">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>🔁 Repost</span>
        <span>📤 Send</span>
      </div>
    </div>
  );
}

function InstagramPreview({ content, images }: { content: string; images: string[] }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden text-black max-w-[380px] shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] shrink-0" />
        <span className="font-semibold text-[13px]">growloop.ai</span>
      </div>
      {/* Image */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-300 text-4xl">📷</div>
        )}
      </div>
      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center gap-4 mb-2 text-[18px]">
          <span>❤️</span>
          <span>💬</span>
          <span>📤</span>
        </div>
        <p className="text-[13px] leading-[1.4]">
          <span className="font-semibold">growloop.ai </span>
          {content.length > 125 ? content.slice(0, 125) + "...more" : content}
        </p>
      </div>
    </div>
  );
}

function TikTokPreview({ content }: { content: string }) {
  return (
    <div className="bg-black rounded-2xl p-4 text-white max-w-[280px] min-h-[400px] shadow-lg flex flex-col justify-end relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#69C9D0] to-[#EE1D52] shrink-0" />
          <span className="font-bold text-[13px]">@growloop</span>
        </div>
        <p className="text-[13px] leading-[1.4]">
          {content.length > 150 ? content.slice(0, 147) + "..." : content}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] text-white/60">🎵 Original Sound</span>
        </div>
      </div>
      {/* Side Actions */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 text-white/80">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[18px]">❤️</span>
          <span className="text-[10px]">0</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[18px]">💬</span>
          <span className="text-[10px]">0</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[18px]">📤</span>
          <span className="text-[10px]">0</span>
        </div>
      </div>
    </div>
  );
}

const PREVIEW_MAP: Record<string, React.FC<{ content: string; images: string[] }>> = {
  x: TwitterPreview,
  linkedin: LinkedInPreview,
  instagram: InstagramPreview,
  tiktok: TikTokPreview,
};

export default function PlatformPreview({ content, platforms, images }: PlatformPreviewProps) {
  const selectedPlatformData = DEFAULT_PLATFORMS.filter((p) =>
    platforms.includes(p.id)
  );

  if (selectedPlatformData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <p className="text-[#9A9A9C] text-[14px]">
          Select platforms above to see how your post will look
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-[13px] font-semibold text-[#9A9A9C] uppercase tracking-wider">
        Preview
      </h3>
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none">
        {selectedPlatformData.map((platform) => {
          const PreviewComponent = PREVIEW_MAP[platform.type];
          if (!PreviewComponent) return null;

          return (
            <div key={platform.id} className="flex flex-col gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.icon}
                </div>
                <span className="text-[13px] text-[#EAEAEA] font-medium">
                  {platform.name}
                </span>
              </div>
              <PreviewComponent content={content} images={images} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
