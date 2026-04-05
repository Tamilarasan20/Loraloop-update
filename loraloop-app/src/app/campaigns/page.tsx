import Link from "next/link";
import { Megaphone, Sparkles, TrendingUp, BarChart3 } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="min-h-screen bg-[#1A1B1A] text-zinc-100 flex flex-col items-center pt-20 px-6 md:px-12 pl-[200px] transition-all">
      <div className="max-w-4xl w-full text-center mb-12">
        <div className="mx-auto flex justify-center mb-4">
          <Megaphone className="w-7 h-7 text-[#C4CE83]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif italic mb-4 tracking-tight">Campaign Ideas</h1>
        <p className="text-[#9A9A9C] text-base max-w-xl mx-auto leading-relaxed">
          Generate tailored marketing campaign ideas powered by your Business DNA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {[
          {
            icon: <Sparkles className="w-8 h-8 text-[#C4CE83]" />,
            title: "Social Media",
            description: "Instagram, TikTok, and Facebook campaign ideas tailored to your brand voice.",
            bg: "bg-[#A7D7C5]"
          },
          {
            icon: <TrendingUp className="w-8 h-8 text-[#C4CE83]" />,
            title: "Growth Campaigns",
            description: "Data-driven campaign strategies to expand your reach and audience.",
            bg: "bg-[#C4CE83]"
          },
          {
            icon: <BarChart3 className="w-8 h-8 text-[#C4CE83]" />,
            title: "Performance Ads",
            description: "Conversion-focused ad copy and creative directions for paid media.",
            bg: "bg-[#E6DBAD]"
          }
        ].map((card, i) => (
          <div
            key={i}
            className="bg-[#242426] border border-white/5 hover:border-[#C4CE83]/30 rounded-[2rem] p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 group cursor-pointer"
          >
            <div className={`w-16 h-16 rounded-2xl ${card.bg} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
              <div className="text-[#1A1B1A]">{card.icon}</div>
            </div>
            <h3 className="text-lg font-medium text-[#EAEAEA] mb-2">{card.title}</h3>
            <p className="text-[#9A9A9C] text-sm leading-relaxed">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-[#9A9A9C] text-sm mb-4">Generate your Business DNA first to unlock campaign ideas.</p>
        <Link 
          href="/board" 
          className="inline-flex items-center gap-2 bg-[#C4CE83] text-[#1A1B1A] px-8 py-3 rounded-full font-semibold text-sm hover:bg-[#D5DF93] transition-colors shadow-md active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          View Business DNA
        </Link>
      </div>
    </div>
  );
}
