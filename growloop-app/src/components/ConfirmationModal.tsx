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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border border-[#E5E7EB] rounded-[32px] p-8 w-full max-w-[420px] shadow-2xl relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-[#A1A1AA] hover:text-[#111111] bg-transparent hover:bg-gray-100 p-1.5 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mt-2 mb-8">
          <h3 className="text-[20px] font-bold text-[#111111] mb-3">{title}</h3>
          <p className="text-[14px] text-[#71717A] leading-relaxed px-2">
            {description}
          </p>
        </div>

        <div className="flex gap-4 font-semibold text-[14px]">
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-100 text-[#111111] hover:bg-gray-200 py-3.5 rounded-full transition-colors shadow-sm"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3.5 rounded-full shadow-md transition-colors ${
              isDestructive 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-[#111111] text-white hover:bg-[#27272A]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
