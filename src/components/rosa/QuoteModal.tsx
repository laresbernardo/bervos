import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, Mail } from 'lucide-react';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('company', formData.company);
    data.append('subject', 'Rosa MMM - Access & Support Inquiry');
    data.append('message', formData.message);
    data.append('_cc', 'admin@bervos.org');
    data.append('recipient', 'laresbernardo@gmail.com');

    try {
      const response = await fetch('https://formspree.io/f/xwvyyebo', {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#080b12]/90 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="tech-card p-8 max-w-xl w-full relative border border-rose-500/30 shadow-2xl shadow-rose-950/40"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <span className="mono-label !text-rose-400 block mb-1">ROSA_SYSTEM // SUPPORT_TRANSMISSION</span>
          <h3 className="text-2xl font-bold text-white">Request Access & Support</h3>
          <p className="text-xs text-slate-400 mt-1">Get custom enterprise deployment details, repository access, and consulting packages.</p>
        </div>

        {status === 'success' ? (
          <div className="py-10 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-white">Transmission Successful</h4>
              <p className="text-sm text-slate-400">
                Your inquiry has been dispatched to the admins. We will get back to you within 24 hours.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20 text-sm"
            >
              Return to Rosa
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="mono-label !text-slate-300">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={status === 'sending'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="mono-label !text-slate-300">Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder=""
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={status === 'sending'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="mono-label !text-slate-300">Company / Organization</label>
              <input
                type="text"
                placeholder=""
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                disabled={status === 'sending'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="mono-label !text-slate-300">Project Requirements & Timeline</label>
              <textarea
                rows={4}
                required
                placeholder="Tell us about your brand, current MMM setup, dataset volume, or specific features needed..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                disabled={status === 'sending'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-rose-400 text-xs font-bold text-center">Transmission error. Please try again or email admin@bervos.org directly.</p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20 text-sm flex items-center justify-center gap-2"
            >
              {status === 'sending' ? (
                'TRANSMITTING INQUIRY...'
              ) : (
                <>
                  <Mail size={16} />
                  SEND REQUEST
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
