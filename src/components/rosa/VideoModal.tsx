import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#080b12]/95 backdrop-blur-xl" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl relative bg-[#04060a] rounded-2xl overflow-hidden border border-rose-500/30 shadow-2xl shadow-rose-950/60"
      >
        {/* Modal Top Bar */}
        <div className="h-12 bg-white/5 border-b border-white/10 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="mono-label !text-rose-300 text-xs">ROSA_DEMO // PRODUCT_WALKTHROUGH</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative pt-[56.25%] w-full bg-black">
          <iframe
            src="https://www.youtube-nocookie.com/embed/5vYocJ2jEdY?autoplay=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&controls=1"
            title="Rosa Product Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full border-0"
          />
        </div>
      </motion.div>
    </div>
  );
};
