"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import PostComposer, { type ComposerData } from "../../../components/social/PostComposer";
import PlatformPreview from "../../../components/social/PlatformPreview";

export default function CreateCampaignPage() {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["x-1", "linkedin-1"]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "success" | "error">("idle");
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePublish = async (data: ComposerData) => {
    setPublishStatus("publishing");
    try {
      // In production, this would call the Postiz API via our proxy
      // const response = await createPost({ type: "now", ... });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPublishStatus("success");
      
      setTimeout(() => setPublishStatus("idle"), 3000);
    } catch {
      setPublishStatus("error");
      setTimeout(() => setPublishStatus("idle"), 3000);
    }
  };

  const handleSchedule = async (data: ComposerData, date: string) => {
    setPublishStatus("publishing");
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPublishStatus("success");
      setTimeout(() => setPublishStatus("idle"), 3000);
    } catch {
      setPublishStatus("error");
      setTimeout(() => setPublishStatus("idle"), 3000);
    }
  };

  const handleSaveDraft = async (data: ComposerData) => {
    // Save to local storage or API
    const drafts = JSON.parse(localStorage.getItem("postDrafts") || "[]");
    drafts.push({
      id: Date.now().toString(),
      ...data,
      images: [], // Can't serialize File objects
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("postDrafts", JSON.stringify(drafts));
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      // 1. Generate text copy based on brand DNA
      const contentRes = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Hardcoded generic prompt for the demo, should use actual business ID from URL or context in production
        body: JSON.stringify({
          businessId: "betternaturetempeh", // using a demo id or pass dynamic id
          prompt: "Write a high-converting, punchy social media post launching our newest flavor. Make it highly engaging.",
        }),
      });
      
      const contentData = await contentRes.json();
      if (contentData.content) {
        setContent(contentData.content);
        
        // 2. Generate accompanying image using Imagen 3
        const imageRes = await fetch("/api/generate-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `A highly professional, aesthetically pleasing, brand-aligned product lifestyle photo. Concept: ${contentData.content.slice(0, 100)}`,
            type: "image"
          })
        });

        const imageData = await imageRes.json();
        if (imageData.mediaUrl) {
          // In a real scenario, we'd convert base64 to File object for uploading, but previews work fine with data URL
          setImagePreviews(prev => [...prev, imageData.mediaUrl]);
        }
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B1B1B] text-[#EAEAEA]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link
            href="/campaigns"
            className="flex items-center gap-2 text-[#9A9A9C] hover:text-[#EAEAEA] transition-colors text-[14px] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <h1 className="text-[20px] font-medium">Create Post</h1>
        </div>

        {/* Status Indicator */}
        {publishStatus !== "idle" && (
          <div
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold animate-in fade-in duration-300 ${
              publishStatus === "publishing"
                ? "bg-[#C1CD7D]/20 text-[#C1CD7D]"
                : publishStatus === "success"
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {publishStatus === "publishing" && (
              <>
                <div className="w-4 h-4 border-2 border-[#C1CD7D] border-t-transparent rounded-full animate-spin" />
                Publishing...
              </>
            )}
            {publishStatus === "success" && "✓ Published successfully!"}
            {publishStatus === "error" && "✗ Failed to publish"}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-10">
        {/* Left Column: Composer */}
        <div className="flex-1 min-w-0">
          <PostComposer
            content={content}
            setContent={setContent}
            selectedPlatforms={selectedPlatforms}
            setSelectedPlatforms={setSelectedPlatforms}
            images={images}
            setImages={setImages}
            imagePreviews={imagePreviews}
            setImagePreviews={setImagePreviews}
            onPublish={handlePublish}
            onSchedule={handleSchedule}
            onSaveDraft={handleSaveDraft}
          />
        </div>

        {/* Right Column: Preview */}
        <div className="w-[420px] shrink-0 hidden lg:block">
          <div className="sticky top-8">
            <div className="bg-[#2C2D2E] border border-white/5 rounded-[24px] p-6">
              <PlatformPreview
                content={content}
                platforms={selectedPlatforms}
                images={imagePreviews}
              />

              {/* AI Content Suggestion */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <button 
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#C1CD7D]/20 to-[#8fa37a]/20 text-[#C1CD7D] px-5 py-3.5 rounded-2xl font-semibold text-[14px] hover:from-[#C1CD7D]/30 hover:to-[#8fa37a]/30 transition-all border border-[#C1CD7D]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#C1CD7D] border-t-transparent rounded-full animate-spin" />
                      Generating Magic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate with AI
                    </>
                  )}
                </button>
                <p className="text-[11px] text-[#9A9A9C] text-center mt-3">
                  Uses your Brand DNA to generate on-brand content
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
