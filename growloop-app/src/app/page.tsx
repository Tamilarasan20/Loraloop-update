"use client";

import { useState } from "react";
import { Dna, Megaphone, Sparkles } from "lucide-react";
import EnterWebsiteModal from "../components/EnterWebsiteModal";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1B1B1B] flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Glowing Aura equivalent to Pomelli */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-[#98c5b3] via-[#8fa37a] to-[#253f36] opacity-20 blur-[120px] rounded-full point-events-none" />

      <div className="relative z-10 w-full max-w-[1000px] px-6 flex flex-col items-center">
        
        {/* Top Header Logo */}
        <div className="text-[#C1CD7D] font-serif text-2xl tracking-wide mb-10">
          google_labs
        </div>

        {/* Title Block */}
        <div className="text-center mb-16">
          <h1 className="text-5xl lg:text-[-64px] font-serif italic text-[#EAEAEA] mb-4">
            Welcome to Pomelli
          </h1>
          <p className="text-[17px] text-[#EAEAEA] font-medium tracking-wide opacity-90">
            Easily generate on-brand social media campaigns
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full mb-16 px-4 lg:px-0">
          
          {/* Card 1 */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#323334] border border-white/5 rounded-[36px] p-8 flex flex-col items-center text-center cursor-pointer hover:bg-[#363738] hover:ring-1 ring-white/10 transition-all group"
          >
            <div className="w-8 h-8 rounded-full border border-[#4A4B4D] text-[#9A9A9C] text-[12px] font-medium flex items-center justify-center mb-8">1</div>
            <h3 className="text-2xl font-serif text-[#EAEAEA] italic mb-8">Generate Business DNA</h3>
            <div className="w-[120px] h-[120px] bg-[#C2E2D6] rounded-[36px] flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-500 shadow-inner">
              <Dna className="w-12 h-12 text-[#253f36] -rotate-45" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] text-[#9A9A9C] leading-relaxed max-w-[200px] font-medium">
              Enter your website and we&apos;ll analyze your brand and business.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#323334] border border-white/5 rounded-[36px] p-8 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-full border border-[#4A4B4D] text-[#9A9A9C] text-[12px] font-medium flex items-center justify-center mb-8">2</div>
            <h3 className="text-2xl font-serif text-[#EAEAEA] italic mb-8">Get campaign ideas</h3>
            <div className="w-[120px] h-[120px] bg-[#C1CD7D] rounded-[36px] flex items-center justify-center mb-8 shadow-inner">
              <Megaphone className="w-10 h-10 text-[#3f4520]" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] text-[#9A9A9C] leading-relaxed max-w-[200px] font-medium">
              We&apos;ll use your Business DNA to create tailored marketing ideas.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#323334] border border-white/5 rounded-[36px] p-8 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-full border border-[#4A4B4D] text-[#9A9A9C] text-[12px] font-medium flex items-center justify-center mb-8">3</div>
            <h3 className="text-2xl font-serif text-[#EAEAEA] italic mb-8">Generate creatives</h3>
            <div className="w-[120px] h-[120px] bg-[#E5E2C5] rounded-[36px] flex items-center justify-center mb-8 shadow-inner">
              <Sparkles className="w-10 h-10 text-[#54523e]" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] text-[#9A9A9C] leading-relaxed max-w-[220px] font-medium">
              We&apos;ll generate high quality, on-brand creatives that are ready to share.
            </p>
          </div>

        </div>

        {/* Let's go Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#C1CD7D] text-[#1B1B1B] px-10 py-3.5 rounded-full font-semibold text-[15px] hover:bg-[#D4E08F] transition-colors shadow-lg"
        >
          Let&apos;s go!
        </button>

      </div>

      {isModalOpen && (
        <EnterWebsiteModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
