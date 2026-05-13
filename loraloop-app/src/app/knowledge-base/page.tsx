'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StartBrandKnowledgePage() {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isPending, setIsPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim()) return;
    setIsPending(true);
    // Use the MVP's existing loading flow instead of the NestJS backend job
    router.push(`/loading?url=${encodeURIComponent(websiteUrl.trim())}`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 bg-[#FAFBFC]">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-white text-2xl mb-4">
            ✨
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">
            Build your brand knowledge base
          </h1>
          <p className="mt-3 text-[#71717A]">
            Drop a website URL and we&apos;ll research your brand — voice, audience,
            competitors, visual identity, and more. You&apos;ll review everything
            before it&apos;s saved.
          </p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <label className="block text-sm font-medium text-[#111111] mb-2">
            Your website
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourbrand.com"
              className="flex-1 rounded-xl border border-[#E5E7EB] px-4 py-3 text-[15px] focus:border-[#3B82F6] focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#A1A1AA] text-[#111111]"
              disabled={isPending}
              autoFocus
            />
            <button
              type="submit"
              disabled={isPending || !websiteUrl.trim()}
              className="rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#6366F1] px-6 py-3 font-medium text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            >
              {isPending ? 'Starting…' : 'Generate'}
            </button>
          </div>

          <p className="mt-4 text-xs text-[#A1A1AA]">
            This usually takes a few minutes. You can leave this page — your
            knowledge base will be ready when you come back.
          </p>
        </form>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-[#71717A]">
          <Bullet icon="🌐" title="Crawl" body="Multi-page scrape of your site, blog, and key pages." />
          <Bullet icon="🧠" title="Analyze" body="Gemini extracts brand DNA, voice, and audience." />
          <Bullet icon="✅" title="Review" body="You edit and approve before anything is saved." />
        </div>
      </div>
    </div>
  );
}

function Bullet({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-medium text-[#111111]">{title}</div>
      <div className="mt-1 text-[13px] leading-relaxed">{body}</div>
    </div>
  );
}
