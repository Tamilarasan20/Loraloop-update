import Link from "next/link";
import { Megaphone, Sparkles, TrendingUp, BarChart3 } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center pt-20 px-6 md:px-12 transition-all">
      <div className="max-w-4xl w-full text-center mb-12">
        <div className="mx-auto flex justify-center mb-4">
          <Megaphone className="w-8 h-8 text-lime-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Campaign Ideas</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed font-medium">
          Generate tailored marketing campaign ideas powered by your Business DNA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {[
          {
            icon: <Sparkles className="w-8 h-8 text-lime-600" />,
            title: "Social Media",
            description: "Instagram, TikTok, and Facebook campaign ideas tailored to your brand voice.",
            bg: "bg-teal-50"
          },
          {
            icon: <TrendingUp className="w-8 h-8 text-lime-600" />,
            title: "Growth Campaigns",
            description: "Data-driven campaign strategies to expand your reach and audience.",
            bg: "bg-lime-50"
          },
          {
            icon: <BarChart3 className="w-8 h-8 text-lime-600" />,
            title: "Performance Ads",
            description: "Conversion-focused ad copy and creative directions for paid media.",
            bg: "bg-yellow-50"
          }
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 hover:border-lime-400 rounded-[2.5rem] p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group cursor-pointer"
          >
            <div className={`w-16 h-16 rounded-[1.5rem] ${card.bg} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-sm`}>
              <div className="text-lime-600">{card.icon}</div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-400 text-sm mb-6 font-medium uppercase tracking-wider">Generate your Business DNA first to unlock campaign ideas.</p>
        <Link 
          href="/board" 
          className="inline-flex items-center gap-2 bg-lime-400 text-white px-8 py-3.5 rounded-full font-bold text-[14px] hover:bg-lime-500 transition-all shadow-md active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          View Business DNA
        </Link>
      </div>
    </div>
  );
}
