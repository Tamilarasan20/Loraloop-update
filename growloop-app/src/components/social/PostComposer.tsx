"use client";

import { useState, useRef, useEffect } from "react";
import { Image as ImageIcon, Video, X, Smile, Hash, AtSign } from "lucide-react";
import PlatformSelector, { ALL_PLATFORMS, type Platform } from "./PlatformSelector";
import { getChannels } from "@/lib/postiz-client";

interface PostComposerProps {
  onPublish?: (data: ComposerData) => void;
  onSchedule?: (data: ComposerData, date: string) => void;
  onSaveDraft?: (data: ComposerData) => void;
}

export interface ComposerData {
  content: string;
  platforms: string[];
  images: File[];
  tags: string[];
}

export default function PostComposer({
  onPublish,
  onSchedule,
  onSaveDraft,
}: PostComposerProps) {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "x-1",
    "linkedin-1",
  ]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [platforms, setPlatforms] = useState<Platform[]>(ALL_PLATFORMS);

  useEffect(() => {
    async function fetchPlatforms() {
      try {
        const channels = await getChannels();
        const mappedPlatforms = ALL_PLATFORMS.map((basePlatform) => {
          const channel = channels.find((c) => c.type === basePlatform.type);
          if (channel) {
            return {
              ...basePlatform,
              id: channel.id,
              name: channel.name,
              connected: !channel.disabled,
              username: channel.profile || channel.name,
            };
          }
          return basePlatform;
        });

         channels.forEach(channel => {
            if (!mappedPlatforms.some(p => p.id === channel.id)) {
                 const base = ALL_PLATFORMS.find(p => p.type === channel.type);
                 if (base) {
                     mappedPlatforms.push({
                         ...base,
                         id: channel.id,
                         name: channel.name,
                         connected: !channel.disabled,
                         username: channel.profile || channel.name
                     });
                 }
            }
        });

        setPlatforms(mappedPlatforms);
      } catch (error) {
        console.error("Failed to fetch channels in Composer:", error);
      }
    }
    fetchPlatforms();
  }, []);

  // Character limit for the most restrictive selected platform
  const getCharLimit = () => {
    const selected = platforms.filter((p) =>
      selectedPlatforms.includes(p.id)
    );
    if (selected.length === 0) return 280;
    return Math.min(...selected.map((p) => p.maxChars));
  };

  const charLimit = getCharLimit();
  const charCount = content.length;
  const isOverLimit = charCount > charLimit;
  const charPercent = Math.min((charCount / charLimit) * 100, 100);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 4) return; // Max 4 images

    setImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const composerData: ComposerData = {
    content,
    platforms: selectedPlatforms,
    images,
    tags: [],
  };

  const canPublish = content.trim().length > 0 && selectedPlatforms.length > 0 && !isOverLimit;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[740px]">
      {/* Platform Selector */}
      <PlatformSelector
        selectedPlatforms={selectedPlatforms}
        onChange={setSelectedPlatforms}
      />

      {/* Composer Card */}
      <div className="bg-white border border-gray-200 rounded-[24px] overflow-hidden shadow-sm">
        {/* Text Area */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Write your post here..."
            className="w-full bg-transparent text-gray-900 text-[15px] leading-relaxed p-6 min-h-[200px] resize-none outline-none placeholder-gray-400 font-bold"
            rows={6}
          />

          {/* Character Counter Ring */}
          <div className="absolute bottom-4 right-4 flex items-center gap-3">
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke={isOverLimit ? "#ef4444" : charPercent > 80 ? "#f59e0b" : "#84cc16"}
                  strokeWidth="3"
                  strokeDasharray={`${charPercent} ${100 - charPercent}`}
                  strokeLinecap="round"
                />
              </svg>
              {charCount > 0 && (
                <span
                  className={`absolute inset-0 flex items-center justify-center text-[8px] font-bold ${
                    isOverLimit ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {isOverLimit ? `-${charCount - charLimit}` : charLimit - charCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="px-6 pb-4 flex gap-3 flex-wrap">
            {imagePreviews.map((preview, i) => (
              <div
                key={i}
                className="relative w-24 h-24 rounded-xl overflow-hidden group bg-gray-50 border border-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt={`Upload ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              title="Add image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />

            <button
              className="p-2.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              title="Add video"
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              className="p-2.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={() => setContent((prev) => prev + " #")}
              className="p-2.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              title="Add hashtag"
            >
              <Hash className="w-5 h-5" />
            </button>
            <button
              onClick={() => setContent((prev) => prev + " @")}
              className="p-2.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              title="Mention"
            >
              <AtSign className="w-5 h-5" />
            </button>
          </div>

          {/* Platform char limit indicator */}
          <div className="flex items-center gap-2">
            {selectedPlatforms.length > 0 && (
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scheduling Bar */}
      {showScheduler && (
        <div className="bg-white border border-gray-200 rounded-[24px] p-6 flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 shadow-sm">
          <label className="text-[13px] text-gray-500 font-bold uppercase tracking-wider whitespace-nowrap">
            Schedule for:
          </label>
          <input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 text-[14px] outline-none focus:border-lime-500 font-bold shadow-inner"
          />
          <button
            onClick={() => {
              if (scheduleDate && canPublish) {
                onSchedule?.(composerData, new Date(scheduleDate).toISOString());
              }
            }}
            disabled={!scheduleDate || !canPublish}
            className={`px-8 py-3 rounded-full font-bold text-[14px] transition-all whitespace-nowrap shadow-md active:scale-95 ${
              scheduleDate && canPublish
                ? "bg-lime-400 text-white hover:bg-lime-500"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            Schedule Post
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onSaveDraft?.(composerData)}
          className="text-gray-400 hover:text-gray-900 font-bold text-[14px] transition-colors px-4 py-2 uppercase tracking-widest"
        >
          Save as Draft
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScheduler(!showScheduler)}
            className={`px-8 py-3 rounded-full font-bold text-[14px] border-2 transition-all active:scale-95 ${
              showScheduler
                ? "border-lime-400 text-lime-700 bg-lime-50 shadow-sm"
                : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
            }`}
          >
            {showScheduler ? "Cancel Schedule" : "Schedule Later"}
          </button>

          <button
            onClick={() => canPublish && onPublish?.(composerData)}
            disabled={!canPublish}
            className={`px-10 py-3 rounded-full font-bold text-[14px] transition-all shadow-md active:scale-95 ${
              canPublish
                ? "bg-lime-400 text-white hover:bg-lime-500 hover:shadow-lg"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            Publish Now
          </button>
        </div>
      </div>
    </div>
  );
}
