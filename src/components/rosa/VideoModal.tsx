import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Lock, CheckCircle2, Mail, User, Building2 } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');

  useEffect(() => {
    try {
      const isUnlocked = localStorage.getItem('rosa_demo_unlocked') === 'true';
      if (isUnlocked) {
        setUnlocked(true);
        setName(localStorage.getItem('rosa_demo_name') || '');
        setEmail(localStorage.getItem('rosa_demo_email') || '');
        setCompany(localStorage.getItem('rosa_demo_company') || '');
      }
    } catch { }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('company', company || 'N/A');
      formData.append('subject', `[ROSA MMM DEMO] New Lead: ${name} (${company || 'Personal'})`);
      formData.append(
        'message',
        `User requested access to watch the Rosa MMM Product Demo Video.\n\nName: ${name}\nEmail: ${email}\nCompany/Role: ${company || 'N/A'}\nTimestamp: ${new Date().toISOString()}`
      );

      const res = await fetch('https://formspree.io/f/xwvyyebo', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        if (db) {
          try {
            await addDoc(collection(db, 'demo_leads'), {
              name,
              email: email.toLowerCase(),
              company: company || 'N/A',
              project: 'Rosa',
              type: 'watch_video',
              source: 'watch_video_modal',
              timestamp: new Date().toISOString()
            });
          } catch (err) {
            console.warn('[Firestore] Lead backup error:', err);
          }
        }

        try {
          localStorage.setItem('rosa_demo_unlocked', 'true');
          localStorage.setItem('rosa_demo_name', name);
          localStorage.setItem('rosa_demo_email', email);
          localStorage.setItem('rosa_demo_company', company);
        } catch { }

        setUnlocked(true);
        setStatus('idle');

        // Track GA lead event
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'generate_lead', {
            event_category: 'conversion',
            event_label: 'Rosa Demo Unlocked',
            value: '1'
          });
        }
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#080b12]/95 backdrop-blur-xl" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl relative bg-[#04060a] rounded-2xl overflow-hidden border border-vinotinto/40 shadow-2xl shadow-vinotinto-dark/70 text-slate-100 font-sans"
        >
          {/* Modal Header */}
          <div className="h-14 bg-white/5 border-b border-white/10 px-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-vinotinto-light shadow-sm shadow-vinotinto/50 animate-pulse" />
              <span className="mono-label !text-vinotinto-light text-xs tracking-wider">
                ROSA_DEMO // PRODUCT_WALKTHROUGH
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8">
            {!unlocked ? (
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-vinotinto/15 border border-vinotinto/30 text-vinotinto-light flex items-center justify-center mx-auto">
                    <Lock size={22} />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    Unlock Product Demo Video
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Please provide your details below to unlock the interactive walkthrough of Rosa.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1.5">
                      <User size={13} className="text-vinotinto-light" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-vinotinto/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1.5">
                      <Mail size={13} className="text-vinotinto-light" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-vinotinto/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1.5">
                      <Building2 size={13} className="text-vinotinto-light" />
                      <span>Company / Organization (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Corp / Marketing Analytics"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-vinotinto/50 transition-colors"
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-xs text-vinotinto-light text-center font-mono">
                      Submission error. Please verify your data and try again.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full py-3.5 bg-gradient-to-r from-vinotinto to-vinotinto-hover hover:from-vinotinto-hover hover:to-vinotinto-light text-white font-black text-xs rounded-xl shadow-lg shadow-vinotinto/30 transition-all flex items-center justify-center gap-2"
                  >
                    {status === 'sending' ? (
                      <span>UNLOCKING...</span>
                    ) : (
                      <>
                        <Play size={15} className="fill-white" />
                        <span>UNLOCK DEMO VIDEO</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative pt-[56.25%] w-full bg-black rounded-xl overflow-hidden border border-white/10 shadow-inner">
                  <iframe
                    src="https://www.youtube-nocookie.com/embed/5vYocJ2jEdY?autoplay=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&controls=1"
                    title="Rosa Product Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full border-0"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>Unlocked for: <strong className="text-white">{name}</strong> ({email})</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
