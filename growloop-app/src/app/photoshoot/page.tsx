import Link from "next/link";
import { Camera, ImagePlus } from "lucide-react";

export default function PhotoshootGateway() {
  return (
    <div className="min-h-screen bg-[#1A1B1A] text-zinc-100 flex flex-col items-center pt-24 px-6 md:px-12 selection:bg-[#3A3C32] pl-[200px] transition-all">
      <div className="max-w-4xl w-full text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mx-auto flex justify-center mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#C4CE83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#C4CE83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#C4CE83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif italic mb-4 tracking-tight drop-shadow-sm">What would you like to create?</h1>
        <p className="text-[#9A9A9C] text-lg max-w-xl mx-auto">
          Choose a path to start generating on-brand visual assets using your recently extracted Business DNA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
        {/* Product Photoshoot Card */}
        <Link href="/photoshoot/templates" className="group">
          <div className="bg-[#242426] border border-white/5 hover:border-[#C4CE83]/40 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center aspect-square md:aspect-auto md:h-[400px] transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#C4CE83]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-24 h-24 bg-[#2B2B2D] rounded-full flex items-center justify-center mb-8 group-hover:bg-[#313328] transition-colors shadow-inner relative z-10 border border-white/5 group-hover:border-[#C4CE83]/20">
              <Camera className="w-10 h-10 text-[#C4CE83]" />
            </div>
            <h2 className="text-2xl font-medium mb-3 text-[#EAEAEA] relative z-10 drop-shadow-sm">Create a product photoshoot</h2>
            <p className="text-[#9A9A9C] text-sm leading-relaxed max-w-[280px] relative z-10">
              Upload your product shots and place them in stunning, AI-generated environments tailored to your brand.
            </p>
          </div>
        </Link>

        {/* Generate / Edit Image Card */}
        <Link href="/photoshoot/templates" className="group">
           <div className="bg-[#242426] border border-white/5 hover:border-[#C4CE83]/40 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center aspect-square md:aspect-auto md:h-[400px] transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#C4CE83]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-24 h-24 bg-[#2B2B2D] rounded-full flex items-center justify-center mb-8 group-hover:bg-[#313328] transition-colors shadow-inner relative z-10 border border-white/5 group-hover:border-[#C4CE83]/20">
              <ImagePlus className="w-10 h-10 text-[#C4CE83]" />
            </div>
            <h2 className="text-2xl font-medium mb-3 text-[#EAEAEA] relative z-10 drop-shadow-sm">Generate or edit an image</h2>
            <p className="text-[#9A9A9C] text-sm leading-relaxed max-w-[280px] relative z-10">
              Create entirely new visual assets from scratch or use AI magic to edit existing ones with text prompts.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
