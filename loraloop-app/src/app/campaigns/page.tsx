"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { Loader2, Send, Zap, TrendingUp, FileText, Image as ImageIcon } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  {
    icon: TrendingUp,
    label: "Find top 10 trending topic in your niche",
    prompt: "Based on our brand and market, what are the top 10 trending topics we should be creating content about right now? List them with brief explanations of why each is relevant to our audience.",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: FileText,
    label: "Create next 10 posts idea",
    prompt: "Generate 10 specific, actionable social media post ideas tailored to our brand. For each, provide: the platform (Instagram/TikTok/LinkedIn), the content angle, the format (video/carousel/text), and key message.",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    icon: ImageIcon,
    label: "Create Instagram next post topic",
    prompt: "Suggest 5 high-performing Instagram post ideas for this week. For each, describe the visual concept, caption angle, hashtag strategy, and expected engagement hooks.",
    color: "text-pink-500",
    bgColor: "bg-pink-50",
  },
];

function CampaignsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const businessId = searchParams.get("id");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!businessId) {
      router.push("/");
      return;
    }
  }, [businessId, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateContent = async (prompt: string) => {
    if (!businessId || !prompt.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content: prompt,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      console.error(e);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `⚠️ ${e.message || "Sorry, I couldn't generate that content."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!businessId) {
    return (
      <div className="flex-1 min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFBFC] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-8 py-5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-[22px] font-bold text-[#111111] flex items-center gap-3">
            <Zap className="w-6 h-6 text-[#F59E0B]" />
            Content Generator
          </h1>
          <p className="text-[13px] text-[#A1A1AA] mt-1">
            Generate tailored social media ideas, posts, and campaigns based on your brand
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-[#EEF2FF] flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-[#2563EB]" />
              </div>
              <h2 className="text-[20px] font-bold text-[#111111] mb-2">Hi, I'm your Content Coach</h2>
              <p className="text-[14px] text-[#A1A1AA] mb-8">
                Ask me anything about generating content, ideas, or campaigns tailored to your brand.
              </p>

              {/* Quick Actions */}
              <div className="space-y-3">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => generateContent(action.prompt)}
                      disabled={loading}
                      className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl border border-[#E5E7EB] hover:border-[#D4D4D8] hover:shadow-sm transition-all text-left ${action.bgColor} disabled:opacity-60`}
                    >
                      <Icon className={`w-5 h-5 ${action.color} shrink-0`} />
                      <span className="text-[14px] font-semibold text-[#111111]">{action.label}</span>
                      <span className="text-[20px] ml-auto text-[#D4D4D8]">›</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-lg px-5 py-3 rounded-2xl ${
                      msg.type === "user"
                        ? "bg-[#2563EB] text-white"
                        : "bg-white border border-[#E5E7EB] text-[#111111]"
                    }`}
                  >
                    <p className="text-[14px] leading-[1.6] whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#E5E7EB] text-[#111111] px-5 py-3 rounded-2xl flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#3B82F6]" />
                    <span className="text-[13px] text-[#A1A1AA]">Generating...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-[#E5E7EB] px-8 py-6 sticky bottom-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generateContent(input);
                }
              }}
              placeholder="Ask for content ideas, post topics, campaign strategies..."
              disabled={loading}
              className="flex-1 px-5 py-3 rounded-full border border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 outline-none text-[14px] text-[#111111] disabled:opacity-60 transition-colors"
            />
            <button
              onClick={() => generateContent(input)}
              disabled={loading || !input.trim()}
              className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center hover:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[12px] text-[#A1A1AA] mt-3 text-center">
            Powered by AI — responses based on your brand knowledge
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 min-h-screen bg-[#FAFBFC] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
        </div>
      }
    >
      <CampaignsPageInner />
    </Suspense>
  );
}
