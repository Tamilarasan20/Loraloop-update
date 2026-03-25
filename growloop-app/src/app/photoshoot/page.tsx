import Link from "next/link";
import { Camera, ImagePlus } from "lucide-react";

export default function PhotoshootGateway() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center pt-24 px-6 md:px-12 selection:bg-lime-100 overflow-hidden font-sans">
      <div className="max-w-4xl w-full text-center mb-20 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="mx-auto flex justify-center mb-8">
          <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-gray-100 transform -rotate-6 group hover:rotate-0 transition-transform duration-500">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tighter text-gray-900 decoration-lime-400">What would you like to create?</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto font-bold leading-relaxed">
          Choose a path to start generating on-brand visual assets using your recently extracted Business DNA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both px-4">
        {/* Product Photoshoot Card */}
        <Link href="/photoshoot/templates" className="group">
          <div className="bg-white border-2 border-transparent hover:border-lime-400 rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center aspect-square md:aspect-auto md:h-[450px] transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(132,204,22,0.15)] hover:-translate-y-2 relative overflow-hidden shadow-2xl shadow-gray-200/50">
            <div className="absolute inset-0 bg-gradient-to-b from-lime-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-28 h-28 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-10 group-hover:bg-lime-50 transition-all duration-500 shadow-inner relative z-10 border border-gray-100 group-hover:border-lime-200 group-hover:scale-110">
              <Camera className="w-12 h-12 text-lime-600 transition-transform group-hover:rotate-12" />
            </div>
            <h2 className="text-3xl font-extrabold mb-4 text-gray-900 relative z-10 tracking-tight">Product Photoshoot</h2>
            <p className="text-gray-400 text-[15px] font-bold leading-relaxed max-w-[280px] relative z-10">
              Upload your product shots and place them in stunning, AI-generated environments tailored to your brand.
            </p>
            <div className="mt-8 flex items-center gap-2 text-lime-600 font-extrabold uppercase tracking-widest text-[11px] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
              Get Started <span className="text-lg">→</span>
            </div>
          </div>
        </Link>

        {/* Generate / Edit Image Card */}
        <Link href="/photoshoot/templates" className="group">
           <div className="bg-white border-2 border-transparent hover:border-lime-400 rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center aspect-square md:aspect-auto md:h-[450px] transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(132,204,22,0.15)] hover:-translate-y-2 relative overflow-hidden shadow-2xl shadow-gray-200/50">
            <div className="absolute inset-0 bg-gradient-to-b from-lime-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-28 h-28 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-10 group-hover:bg-lime-50 transition-all duration-500 shadow-inner relative z-10 border border-gray-100 group-hover:border-lime-200 group-hover:scale-110">
              <ImagePlus className="w-12 h-12 text-lime-600 transition-transform group-hover:-rotate-12" />
            </div>
            <h2 className="text-3xl font-extrabold mb-4 text-gray-900 relative z-10 tracking-tight">AI Generation</h2>
            <p className="text-gray-400 text-[15px] font-bold leading-relaxed max-w-[280px] relative z-10">
              Create entirely new visual assets from scratch or use AI magic to edit existing ones with text prompts.
            </p>
            <div className="mt-8 flex items-center gap-2 text-lime-600 font-extrabold uppercase tracking-widest text-[11px] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
              Explore Tools <span className="text-lg">→</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
