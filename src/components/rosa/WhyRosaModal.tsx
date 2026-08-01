import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface WhyRosaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhyRosaModal: React.FC<WhyRosaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#080b12]/95 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="tech-card p-6 sm:p-8 max-w-2xl w-full relative border border-vinotinto/40 shadow-2xl shadow-vinotinto-dark/60 text-slate-100 font-sans"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-vinotinto to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <span className="mono-label !text-vinotinto-light block mb-1">ROSA_PHILOSOPHY // BEHIND THE NAME</span>
          <h3 className="text-2xl font-black text-white">Why Rosa?</h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Three core pillars define the name, architecture, and identity of the tool.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-vinotinto/30 space-y-2">
            <div className="flex items-center gap-3 text-vinotinto-light font-bold text-sm">
              <span className="px-2 py-0.5 rounded bg-vinotinto/15 border border-vinotinto/30 text-xs font-mono text-vinotinto-light">01 // ROAS</span>
              <span className="text-white">ROAS Calculation</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-1">
              A specialized tool engineered to calculate <strong className="text-vinotinto-light">ROAS</strong> (Return on Ad Spend), being an exact anagram of <strong className="text-white">Rosa</strong> (ROAS & ROSA).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-vinotinto/30 space-y-2">
            <div className="flex items-center gap-3 text-vinotinto-light font-bold text-sm">
              <span className="px-2 py-0.5 rounded bg-vinotinto/15 border border-vinotinto/30 text-xs font-mono text-vinotinto-light">02 // ROBYN</span>
              <span className="text-white">R Language & Robyn Heritage</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-1">
              It is a woman's name like <strong className="text-vinotinto-light">Robyn</strong> (its underlying engine by Meta), and starts with an <strong className="text-white font-mono">'R'</strong> because it uses <strong className="text-white">R</strong> as its core programming language.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-vinotinto/30 space-y-2">
            <div className="flex items-center gap-3 text-vinotinto-light font-bold text-sm">
              <span className="px-2 py-0.5 rounded bg-vinotinto/15 border border-vinotinto/30 text-xs font-mono text-vinotinto-light">03 // ROSE</span>
              <span className="text-white">The Rose & Petal Decomposition</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-1">
              <strong className="text-vinotinto-light">Rosa</strong> means <em>rose</em> in Spanish. The flower is the complete, beautiful whole, and Rosa helps split the channels performance <strong className="text-white font-semibold">petal by petal</strong> to understand what your growth is made of.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vinotinto hover:bg-vinotinto-hover text-white font-bold rounded-xl text-xs transition-all"
          >
            Got It
          </button>
        </div>
      </motion.div>
    </div>
  );
};
