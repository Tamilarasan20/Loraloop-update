"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandBoard from "@/components/BrandBoard";
import { Loader2, FileText, MoreVertical, X } from "lucide-react";

// Let's create a very simple markdown renderer function for this context to avoid new deps

function SimpleMarkdown({ content }: { content: string }) {
  const parseLine = (line: string): string => {
    // Bold
    let html = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#111111]">$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-[#3F3F46]">$1</em>');
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code class="bg-[#F4F4F5] text-[#18181B] text-[13px] px-1.5 py-0.5 rounded font-mono">$1</code>');
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-[#2563EB] underline decoration-[#2563EB]/30 hover:decoration-[#2563EB] underline-offset-2 transition-colors">$1</a>');
    return html;
  };

  const parseMarkdown = (md: string) => {
    const blocks = md.split('\n\n');
    return blocks.map((block, i) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // H1
      if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
        return <h1 key={i} className="text-[22px] font-bold text-[#111111] mb-5 mt-2 tracking-tight leading-snug">{trimmed.replace(/^# /, '')}</h1>;
      }
      // H3
      if (trimmed.startsWith('### ')) {
        return <h3 key={i} className="text-[15px] font-semibold text-[#27272A] mb-3 mt-5">{trimmed.replace(/^### /, '')}</h3>;
      }
      // H2
      if (trimmed.startsWith('## ')) {
        const text = trimmed.replace(/^## /, '');
        return <h2 key={i} className="text-[17px] font-bold text-[#111111] mb-4 mt-8 first:mt-0 tracking-tight">{text}</h2>;
      }
      // Horizontal rule
      if (trimmed === '---' || trimmed === '***') {
        return <hr key={i} className="border-t border-[#E5E7EB] my-6" />;
      }

      // Ordered list (starts with 1.)
      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split('\n');
        return (
          <ol key={i} className="list-decimal pl-5 mb-5 space-y-3 text-[#3F3F46]">
            {items.map((item, j) => {
              const text = item.replace(/^\d+\.\s/, '');
              if (!text.trim()) return null;
              return (
                <li key={j} className="text-[15px] leading-[1.7] pl-1">
                  <span dangerouslySetInnerHTML={{ __html: parseLine(text) }} />
                </li>
              );
            })}
          </ol>
        );
      }

      // Unordered list
      if (trimmed.startsWith('- ')) {
        const items = trimmed.split('\n');
        return (
          <ul key={i} className="mb-5 space-y-3 text-[#3F3F46]">
            {items.map((item, j) => {
              const text = item.replace(/^-\s/, '');
              if (!text.trim()) return null;
              return (
                <li key={j} className="text-[15px] leading-[1.7] pl-5 relative before:content-[''] before:absolute before:left-[6px] before:top-[10px] before:w-[5px] before:h-[5px] before:rounded-full before:bg-[#A1A1AA]">
                  <span dangerouslySetInnerHTML={{ __html: parseLine(text) }} />
                </li>
              );
            })}
          </ul>
        );
      }

      // Paragraph
      return (
        <p key={i} className="text-[15px] text-[#3F3F46] mb-5 leading-[1.75] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: parseLine(trimmed) }} />
      );
    });
  };

  return <div className="markdown-prose font-[system-ui,-apple-system,sans-serif]">{parseMarkdown(content)}</div>;
}

// No longer needed — documents come from LLM now
function enrichMarkdown(md: string) {
  return md;
}

const STRATEGY_MD = `## Priority Platforms (Ranked)
- **TikTok** – Highest growth potential; food content thrives; recipe + founder videos can go viral
- **Instagram** – Essential for brand presence; Reels over static; UGC reposts, recipes, stories
- **LinkedIn** – B2B angle; Ando/Elin founder content; retailer relationships; investor visibility

## Content Pillars (use across all platforms)
1. **Protein Proof**
- "40g of protein from a plant. Here's how."
- Head-to-head protein comparisons vs chicken, steak, eggs
- Post-workout meal ideas
2. **Gut Health Education**
- Why fermented food is different from probiotic supplements
- "What fermentation does to soy" — short explainer videos
- Elin as the gut health voice; Ando as the science voice
3. **Recipe Demos**
- 60-second "tempeh in 5 minutes" videos
- Familiar dishes with a tempeh twist (chilli, stir fry, tacos, wraps)
- Family meal versions — kid-friendly content performs well
- Seasonal / trending dishes (e.g. summer BBQ with Smoky Tempeh)
4. **Founder Story**
- Ando's Indonesian childhood — authentic, emotional, differentiating
- "Why we started Better Nature" — short, punchy video
- Behind-the-scenes at production, farmers, sourcing
5. **Customer Love / UGC**
- Screenshot and repost customer reviews (Tesco, Ocado, Asda)
- "Send us your tempeh" — encourage fan content
- Response videos to comments / questions

## Posting Cadence (Recommended)
- **TikTok**: 4-5x per week (Short video, trending audio)
- **Instagram**: 4x per week (Reels > Carousels > Stories)
- **LinkedIn**: 2x per week (Founder posts, milestone news)

## Messaging Hierarchy
1. "It's got more protein than chicken" — lead hook
2. "It's fermented — good for your gut" — secondary hook
3. "It tastes incredible" — proof via reviews and recipe demos
4. "Made by someone who grew up eating this" — trust + authenticity

## Quick Wins
- Pin a "What is tempeh?" video to all profiles
- Repurpose the glowing customer reviews as quote graphics (low effort, high trust)
- Get Ando on camera — his story is a cheat code for engagement
- TikTok trend participation with tempeh (e.g. "protein check" trend)
- Micro-influencer gifting to UK food/fitness/gut health creators (10k–100k followers)`;

const MARKET_RESEARCH_MD = `## Market Opportunity
- UK plant proteins (tofu, tempeh, seitan) grew 12% at Tesco in the past year
- Vegan food is returning to growth in the UK after years of decline
- UPF (ultra-processed food) backlash is actively driving shoppers toward whole foods
- Tempeh = whole food, fermented, minimal ingredients — perfectly positioned vs fake meats
- Global tempeh market growing steadily through 2032

## Trend Tailwinds
- Anti-UPF movement – Tesco confirmed "whole cuts" are winning as shoppers ditch fake meats
- Protein obsession – UK consumers actively tracking protein intake; 40-44g is a standout claim
- Gut health mainstream – No longer niche; gut health is a mass-market interest in the UK
- Family nutrition – Parents looking for clean, kid-approved proteins; Better Nature reviews confirm kids like it

## Competitive Landscape
- **The Tofoo Co** – Biggest UK competitor in the natural plant protein space; strong brand, good social presence
- **Generic supermarket tempeh** – Growing but no brand story
- **Meat brands** – Still dominant but losing ground in the "reducetarian" segment
- **Better Nature's edge** – Authentic founder story (Indonesian heritage + PhD), flavoured range, strong retail distribution, genuine customer love

## Key Risk
- Tempeh is still unfamiliar to many UK shoppers; education is a constant job
- Instagram organic reach down ~40% in 2025 — can't rely on it alone

## Social Platform Data (2025)
- TikTok brand follower growth: +200% in 2025
- Instagram organic reach: -40%
- LinkedIn: steady, consistent B2B/professional growth
- Best-performing food content: recipe demos, "what I eat in a day", UGC reposts, founder stories

## Target Audiences on Social
- **Flexitarians** – reducing meat, not eliminating it; respond to "chicken alternative" framing
- **Gym/fitness crowd** – protein-first shoppers; respond to macros and performance angles
- **Gut health seekers** – follow health/wellness creators; respond to science and gut microbiome content
- **Busy parents** – family meal solutions; respond to quick, kid-friendly recipes
- **Food curious/foodies** – love discovering new ingredients; respond to origin story and cooking inspiration`;

const BUSINESS_PROFILE_MD = `## Overview
Better Nature is a UK plant-based food brand specialising in tempeh — a fermented soy product originally from Indonesia. Founded by Ando (PhD food scientist, Indonesian roots) and Elin (gut health foodie). The brand bridges authentic Indonesian heritage with modern health trends.

## Products
- Original Tempeh – versatile everyday protein
- Smoky Tempeh – BBQ/flavour-forward
- Mediterranean Tempeh – herb-seasoned
- Peri Peri Tempeh – spiced, bold

## Key Selling Points
- 40–44g protein per pack
- 100% natural ingredients
- Gut-friendly (fermented)
- Whole food, minimally processed
- Versatile cooking uses (stir fry, chilli, mince replacement, family meals)

## Retail Presence
Stocked in Tesco, Asda, Ocado (major UK grocery chains)

## Target Audience
- Health-conscious UK consumers
- Flexitarians and plant-based eaters
- Gut health enthusiasts
- Families looking for nutritious, easy meals
- Active people / fitness-focused individuals

## Founder Story
Ando grew up eating tempeh in Indonesia and went on to get a PhD on its impact on human health. Elin is a gut health obsessive and foodie. Together they built Better Nature to bring real tempeh to UK kitchens.

## Marketing Goals
- Social media growth and engagement
- Website: betternaturetempeh.co`;


// Provide a safe generic mock if nothing is found
const DEFAULT_DNA = {
    brandName: "Better Nature",
    logoUrl: "https://betternaturetempeh.co/cdn/shop/files/BetterNature_Logo_Green_f4ad294a-810a-471d-a320-c268deef5d3b_900x.png?v=1614294025",
    colors: { primary: "#C4CE83", secondary: "#FAFAFA", background: "#FFFFFF", textHighContrast: "#111111", accent: "#99EB00" },
    typography: { headingFont: "Londrina Solid", bodyFont: "sans-serif" },
    tagline: "Give chicken the night off",
    brandValue: "Nutritional Powerhouse, Authentic Heritage, Sustainable Living",
    brandAesthetic: "Vibrant, Clean, Natural",
    toneOfVoice: "Friendly, Empowering, Bold",
    businessOverview: "Better Nature is a UK plant-based food brand specialising in tempeh — a fermented soy product originally from Indonesia. The brand bridges authentic Indonesian heritage with modern health trends.",
    images: [
        "https://betternaturetempeh.co/cdn/shop/files/BN06_580x.jpg",
        "https://betternaturetempeh.co/cdn/shop/files/BN03_580x.jpg",
        "https://betternaturetempeh.co/cdn/shop/files/BN05_3484f2de-5ce8-490b-ba62-ec7c8b0a99fb_580x.jpg",
        "https://betternaturetempeh.co/cdn/shop/files/BN08_be2c63b1-ef17-4d97-885e-b2d28fbb77db_580x.jpg",
        "https://betternaturetempeh.co/cdn/shop/files/BN04_02aabade-e215-4fa0-bda4-4fa4e6e22e51_580x.jpg",
        "https://betternaturetempeh.co/cdn/shop/files/BN09_efd2edcd-eeaa-4852-beab-df3c5095e7c8_580x.jpg",
        "https://betternaturetempeh.co/cdn/shop/files/BN02_580x.jpg"
    ]
};

interface BrandDocuments {
  strategy: string;
  marketResearch: string;
  businessProfile: string;
}

export default function BoardPage() {
  const [dna, setDna] = useState<Record<string, any> | null>(null);
  const [docs, setDocs] = useState<BrandDocuments | null>(null);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("All");
  
  // Modal state
  const [activeDoc, setActiveDoc] = useState<{title: string, content: string} | null>(null);

  useEffect(() => {
    // Load DNA
    const stored = localStorage.getItem("brandDna");
    if (stored) {
      try {
        setDna(JSON.parse(stored));
      } catch {
        setDna(DEFAULT_DNA);
      }
    } else {
      setDna(DEFAULT_DNA);
    }

    // Load Documents
    const storedDocs = localStorage.getItem("brandDocuments");
    if (storedDocs) {
      try {
        setDocs(JSON.parse(storedDocs));
      } catch {
        setDocs(null);
      }
    }
  }, []);

  // Get document content — use LLM-generated if available, fall back to static
  const getStrategy = () => docs?.strategy || STRATEGY_MD;
  const getMarketResearch = () => docs?.marketResearch || MARKET_RESEARCH_MD;
  const getBusinessProfile = () => docs?.businessProfile || BUSINESS_PROFILE_MD;

  if (!dna) {
    return (
      <div className="flex-1 min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  const openDoc = (title: string, content: string) => {
      setActiveDoc({ title, content });
  };

  return (
    <div className="flex-1 bg-[#FAFBFC] text-[#111111] font-sans overflow-x-hidden selection:bg-[#EFF6FF] relative w-full pt-10 px-8 pb-32">
        <div className="max-w-[960px] w-full mx-auto flex flex-col items-center">
          
          {/* Header section */}
          <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E5E7EB] shadow-sm">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src="https://ui-avatars.com/api/?name=L+K&background=FDBA74&color=fff" alt="Lora" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-[22px] font-bold text-[#111111]">Lora knowledge</h1>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 bg-white border border-[#E5E7EB] rounded-full p-1 shadow-sm">
             {["All", "Documents", "Brand Guidelines"].map((tab) => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-6 py-2 rounded-full text-[14px] font-semibold transition-colors ${activeTab === tab ? 'bg-[#EEF2FF] text-[#2563EB]' : 'text-[#71717A] hover:bg-gray-50 hover:text-[#111111]'}`}
                 >
                     {tab}
                 </button>
             ))}
          </div>

          {/* Main Content Areas - Row Stacked */}
          <div className="w-full flex flex-col gap-8 pb-10">
              
              {/* Documents Block (Top) */}
              {(activeTab === "All" || activeTab === "Documents") && (
                <div className="bg-white rounded-[24px] p-6 lg:p-8 w-full shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F4F4F5] animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[17px] font-bold text-[#111111]">Documents</h2>
                        <button className="text-[13px] font-semibold text-[#111111] border border-[#E5E7EB] bg-white px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm">
                            Upload
                        </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                        {/* Document Pill 1 */}
                        <div 
                           onClick={() => openDoc("social strategy", getStrategy())}
                           className="flex items-center gap-3 bg-[#FAFBFC] border border-[#F4F4F5] hover:border-[#E5E7EB] hover:shadow-sm transition-all rounded-full px-5 py-3 cursor-pointer min-w-[200px] group"
                        >
                            <div className="w-8 h-8 bg-[#EEF2FF] rounded-full flex items-center justify-center text-[#3B82F6] shrink-0">
                                 <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-[14px] font-semibold text-[#111111] flex-1 group-hover:text-[#2563EB] transition-colors">Strategy</span>
                        </div>

                        {/* Document Pill 2 */}
                        <div 
                           onClick={() => openDoc("market research", getMarketResearch())}
                           className="flex items-center gap-3 bg-[#FAFBFC] border border-[#F4F4F5] hover:border-[#E5E7EB] hover:shadow-sm transition-all rounded-full px-5 py-3 cursor-pointer min-w-[200px] group"
                        >
                            <div className="w-8 h-8 bg-[#EEF2FF] rounded-full flex items-center justify-center text-[#3B82F6] shrink-0">
                                 <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-[14px] font-semibold text-[#111111] flex-1 group-hover:text-[#2563EB] transition-colors">Market research</span>
                        </div>

                        {/* Document Pill 3 */}
                        <div 
                           onClick={() => openDoc("business profile", getBusinessProfile())}
                           className="flex items-center gap-3 bg-[#FAFBFC] border border-[#F4F4F5] hover:border-[#E5E7EB] hover:shadow-sm transition-all rounded-full px-5 py-3 cursor-pointer min-w-[200px] group"
                        >
                            <div className="w-8 h-8 bg-[#EEF2FF] rounded-full flex items-center justify-center text-[#3B82F6] shrink-0">
                                 <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-[14px] font-semibold text-[#111111] flex-1 group-hover:text-[#2563EB] transition-colors">Business profile</span>
                        </div>
                    </div>
                </div>
              )}

              {/* Brand Guidelines Block (Bottom) */}
              {(activeTab === "All" || activeTab === "Brand Guidelines") && (
                <div className="bg-white rounded-[24px] p-6 lg:p-8 w-full shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F4F4F5] animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[17px] font-bold text-[#111111]">Brand Guidelines</h2>
                        <button className="text-[13px] font-semibold text-[#2563EB] hover:underline transition-colors px-2">
                           View all
                        </button>
                    </div>
                    <BrandBoard initialDna={dna} />
                </div>
              )}
          </div>
          
          {/* Bottom Action Footer */}
          <div className="fixed bottom-0 left-[260px] right-0 bg-white border-t border-[#E5E7EB] py-4 px-10 flex items-center justify-between z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
            <span className="text-[#71717A] text-[14px] font-medium tracking-wide">
              Next we'll use your Business DNA to generate social media campaigns
            </span>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => {
                   if (confirm("Are you sure you want to reset your Brand DNA?")) {
                      localStorage.removeItem("brandDna");
                      localStorage.removeItem("brandDocuments");
                      router.push("/");
                   }
                 }}
                 className="px-6 py-2.5 rounded-xl font-semibold text-[14px] text-[#A1A1AA] hover:text-[#111111] hover:bg-gray-100 transition-colors"
               >
                 Reset
               </button>
               <button 
                 className="bg-[#2563EB] text-white px-8 py-2.5 rounded-xl font-semibold text-[14px] hover:bg-[#1D4ED8] shadow-md transition-colors shadow-blue-500/20"
               >
                 Looks Good
               </button>
            </div>
          </div>

        </div>

        {/* Modal for viewing Documents */}
        {activeDoc && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-[800px] max-h-[85vh] rounded-[24px] shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between px-8 py-5 border-b border-[#F4F4F5]">
                      <h2 className="text-[18px] font-bold text-[#111111] tracking-tight">{activeDoc.title}</h2>
                      <button 
                         onClick={() => setActiveDoc(null)}
                         className="p-1.5 bg-transparent rounded-full hover:bg-gray-100 transition-colors"
                      >
                         <X className="w-5 h-5 text-[#71717A]" />
                      </button>
                  </div>
                  <div className="px-10 py-8 overflow-y-auto w-full flex-1 scrollbar-thin">
                      <SimpleMarkdown content={enrichMarkdown(activeDoc.content)} />
                  </div>
               </div>
            </div>
        )}
    </div>
  );
}

