import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle2, BookMarked, MessageSquare } from 'lucide-react';

interface PreorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ES' | 'EN';
}

export const PreorderModal: React.FC<PreorderModalProps> = ({ isOpen, onClose, lang }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('subject', `[RUTINAS BOOK] Priority Waitlist - ${name}`);
      formData.append(
        'message',
        `New signup for RUTINAS Book (2026 Launch):\n\nName: ${name}\nEmail: ${email}\nLanguage: ${lang}\n\nPersonal Comment for Author:\n${comment || '(No personal comment provided)'}`
      );

      const res = await fetch('https://formspree.io/f/xwvyyebo', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#0d121f] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100 font-sans"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>

          {status === 'success' ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-2xl font-black text-white">
                {lang === 'ES' ? '¡Te has registrado con éxito!' : 'Successfully Registered!'}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                {lang === 'ES'
                  ? 'Te notificaremos prioritariamente sobre el lanzamiento de RUTINAS y avances exclusivos.'
                  : 'We will notify you with first priority when RUTINAS launches in 2026.'}
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
              >
                {lang === 'ES' ? 'CERRAR' : 'CLOSE'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <BookMarked size={20} />
                </div>
                <div>
                  <span className="mono-label !text-amber-400 text-xs">
                    {lang === 'ES' ? 'LANZAMIENTO 2026' : 'LAUNCH 2026'}
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {lang === 'ES' ? 'Lista de Espera Prioritaria' : 'Priority Waitlist'}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === 'ES'
                  ? 'Recibe actualizaciones del proceso de redacción y fecha de publicación oficial directamente en tu correo.'
                  : 'Receive writing updates, sample chapters, and official launch announcements directly in your inbox.'}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    {lang === 'ES' ? 'Nombre completo' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'ES' ? 'Tu nombre' : 'Your name'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    {lang === 'ES' ? 'Correo electrónico' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-amber-400" />
                      <span>{lang === 'ES' ? 'Mensaje o comentario para el autor (Opcional)' : 'Message or comment for the author (Optional)'}</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      lang === 'ES'
                        ? 'Escribe aquí tu mensaje... Bernardo Lares lo leerá personalmente.'
                        : 'Write your message here... Bernardo Lares will read it personally.'
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-colors resize-none placeholder:text-slate-500"
                  />
                  <p className="text-[10px] text-amber-400/80 font-mono mt-1">
                    {lang === 'ES'
                      ? '✓ Tu mensaje será enviado directamente al correo personal del autor.'
                      : '✓ Your message will be sent directly to the author’s email inbox.'}
                  </p>
                </div>
              </div>

              {status === 'error' && (
                <p className="text-xs text-rose-400 text-center font-mono">
                  {lang === 'ES' ? 'Error de envío. Por favor reintenta.' : 'Submission error. Please try again.'}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                {status === 'sending'
                  ? (lang === 'ES' ? 'ENVIANDO...' : 'SENDING...')
                  : (lang === 'ES' ? 'ENVIAR MENSAJE & UNIRME' : 'SEND MESSAGE & JOIN WAITLIST')}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
