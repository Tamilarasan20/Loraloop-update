import { X } from "lucide-react";

interface ConfirmationModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmationModal({ 
  title, 
  description, 
  confirmLabel = "Confirm", 
  cancelLabel = "Cancel",
  isDestructive = false,
  onConfirm, 
  onClose 
}: ConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#2C2D2E] border border-white/5 rounded-[32px] p-8 w-full max-w-[420px] shadow-2xl relative shadow-black/40 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mt-2 mb-8">
          <h3 className="text-[20px] font-serif text-[#EAEAEA] italic mb-3">{title}</h3>
          <p className="text-[14px] text-[#9A9A9C] font-medium leading-relaxed px-2">
            {description}
          </p>
        </div>

        <div className="flex gap-4 font-semibold text-[14px]">
          <button 
            onClick={onClose}
            className="flex-1 bg-[#363738] text-[#EAEAEA] hover:bg-[#414244] py-3.5 rounded-full transition-colors shadow-sm"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3.5 rounded-full shadow-lg transition-colors ${
              isDestructive 
                ? "bg-red-500/90 hover:bg-red-500 text-white" 
                : "bg-[#C1CD7D] text-[#1B1B1B] hover:bg-[#D4E08F]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
