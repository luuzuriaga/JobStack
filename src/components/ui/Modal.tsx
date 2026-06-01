import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string; // e.g. 'max-w-md', 'max-w-2xl'
  scrollable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-lg',
  scrollable = true
}) => {
  // Manejar el cierre con la tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      {/* Backdrop (Soft, elegant blur, avoiding pitch-black heavy space) */}
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity duration-350"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className={`relative w-full ${maxWidthClass} bg-slate-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-800 p-5 sm:p-8 z-10 transition-all transform duration-300 scale-100 shadow-2xl shadow-violet-500/5 overflow-hidden animate-slide-up`}
      >
        {/* Glow effect in background (subtle gradient, no hard top line) */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header (Clean open space, no divider lines) */}
        <div className="flex items-center justify-between pb-4 mb-6">
          <h3 className="text-xl font-bold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-200">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700/50 transition-all"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className={`relative pr-1 ${scrollable ? 'max-h-[70vh] overflow-y-auto' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
