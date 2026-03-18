import { X } from "lucide-react";
import Image from "next/image";

interface ImageLightboxModalProps {
  imageUrl: string;
  onClose: () => void;
}

export default function ImageLightboxModal({ imageUrl, onClose }: ImageLightboxModalProps) {
  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200"
      onClick={onClose}
    >
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 text-zinc-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      <div 
        className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden shadow-2xl bg-[#1B1B1B]"
        onClick={(e) => e.stopPropagation()}
      >
         {/* eslint-disable-next-line @next/next/no-img-element */}
         <img 
           src={imageUrl} 
           alt="Full screen preview" 
           className="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain"
         />
      </div>
    </div>
  );
}
