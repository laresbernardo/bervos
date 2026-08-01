import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe2,
  BookOpen,
  Bot,
  Feather,
  Mail,
  Bookmark,
  Dices
} from 'lucide-react';

import { ExcerptModal } from './ExcerptModal';
import { PreorderModal } from './PreorderModal';
import { HumanConnectionsBackground } from './HumanConnectionsBackground';
import { updatePageMetadata } from '../../utils/meta';

export const RutinasLandingPage: React.FC = () => {
  const [lang, setLang] = useState<'ES' | 'EN'>('ES');
  const [isExcerptOpen, setIsExcerptOpen] = useState(false);
  const [isPreorderOpen, setIsPreorderOpen] = useState(false);

  useEffect(() => {
    const title = lang === 'ES'
      ? "RUTINAS | Atlas Íntimo de la Humanidad — Bernardo Lares"
      : "RUTINAS | Intimate Atlas of Humanity — Bernardo Lares";
    const description = lang === 'ES'
      ? "Un viaje íntimo a través de rutinas cotidianas de 196 culturas actuales. Un libro para conectar y aprender a través de los ojos de otros."
      : "An intimate journey through daily routines of 196 current cultures. A book in Spanish to connect and learn through the eyes of others.";

    const cleanupMeta = updatePageMetadata({
      title,
      description,
      favicon: "/rutinas-favicon.png",
      appleTouchIcon: "/rutinas-favicon.png",
      appName: "Rutinas",
      ogImage: "https://bervos.org/rutinas-logo.png",
      url: window.location.href
    });

    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', 'G-380P0NRV7V', {
        page_title: document.title,
        page_path: window.location.pathname,
        page_location: window.location.href
      });
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_path: window.location.pathname,
        page_location: window.location.href
      });
    }

    return cleanupMeta;
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ES' ? 'EN' : 'ES'));
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 selection:bg-amber-500/30 overflow-x-hidden font-sans">
      {/* Dynamic Human Connections Network Background */}
      <HumanConnectionsBackground />

      {/* Ambient background lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-amber-600/30 via-orange-600/10 to-transparent blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:36px_36px] opacity-15" />
      </div>

      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#070a12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
            <img src="/rutinas-logo.png" alt="Rutinas Logo" className="h-9 w-9 object-contain rounded-lg border border-amber-500/20" />
            <span className="text-xl font-black tracking-tight text-white glow-text">RUTINAS</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/40 transition-all"
              title="Change Language / Cambiar Idioma"
            >
              <span className="text-lg leading-none">{lang === 'ES' ? '🇺🇸' : '🇪🇸'}</span>
              <span className="text-[10px] font-mono text-amber-400">{lang === 'ES' ? 'EN' : 'ES'}</span>
            </button>

            <button
              onClick={() => setIsPreorderOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Bookmark size={14} />
              {lang === 'ES' ? 'LISTA DE ESPERA' : 'WAITLIST'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 px-6 z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Title & Backcover Question */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300"
            >
              <Globe2 size={14} className="text-amber-400" />
              <span>{lang === 'ES' ? 'ATLAS ÍNTIMO DE LA HUMANIDAD' : 'INTIMATE ATLAS OF HUMANITY'}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-rose-400">
                RUTINAS
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xl sm:text-2xl font-serif italic text-amber-200/90 leading-snug border-l-2 border-amber-500/40 pl-5"
            >
              {lang === 'ES'
                ? '“¿Quién serías hoy si hubieses nacido en las lejanías de Siberia, una calle en Yakarta o una tribu de Yemen?”'
                : '“Who would you be today if you had been born in the remote reaches of Siberia, a street in Jakarta, or a tribe in Yemen?”'}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-sans"
            >
              {lang === 'ES'
                ? 'Un viaje íntimo a través de relatos de rutinas cotidianas y actuales de 196 culturas. Un libro para viajar y aprender a través de los ojos de otros.'
                : 'An intimate journey through stories of daily modern routines of 196 cultures. A book to travel and learn through the eyes of others.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <button
                onClick={() => setIsExcerptOpen(true)}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-amber-500/25 flex items-center gap-3"
              >
                <BookOpen size={18} />
                {lang === 'ES' ? 'LEER MUESTRAS DE RELATOS' : 'READ SAMPLE STORIES'}
              </button>
              <button
                onClick={() => setIsPreorderOpen(true)}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-3 hover:scale-[1.02] active:scale-95"
              >
                <Mail size={18} className="text-amber-400" />
                {lang === 'ES' ? 'NOTIFICARME DEL LANZAMIENTO' : 'NOTIFY ME ON LAUNCH'}
              </button>
            </motion.div>
          </div>

          {/* Right Column: Full Book Cover Visual */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative w-full max-w-xs sm:max-w-sm lg:max-w-[340px] group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/40 via-orange-500/20 to-amber-600/30 rounded-2xl blur-3xl opacity-70 group-hover:opacity-90 transition-opacity" />
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-500/20 max-h-[480px] flex items-center justify-center bg-[#0d121f]">
                <img
                  src="/rutinas-front-cover.jpg"
                  alt="Rutinas Front Book Cover"
                  className="w-full h-auto max-h-[480px] object-contain group-hover:scale-[1.02] transition-transform duration-700"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Author's Vision & AI Co-Creation Methodology Section */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="mono-label !text-amber-400">
              {lang === 'ES' ? 'METODOLOGÍA DE CO-CREACIÓN // IA & EMPATÍA' : 'CO-CREATION METHODOLOGY // AI & EMPATHY'}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              {lang === 'ES' ? 'Escapar de los sesgos y estereotipos.' : 'Escaping Bias and Stereotypes.'}
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              {lang === 'ES'
                ? 'El autor utiliza la Inteligencia Artificial como brújula para construir realidades creíbles, actualizadas e inmersivas de personajes que jamás habría concebido únicamente por su conocimiento previo del mundo y sus culturas locales tan variadas.'
                : 'The author uses Artificial Intelligence as a compass to construct credible, up-to-date, and immersive realities of characters he could never have conceived through his prior world knowledge and varied local cultures alone.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="tech-card p-6 space-y-4 border-amber-500/20">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Globe2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">
                {lang === 'ES' ? '196 Países & Voces Únicas' : '196 Countries & Unique Voices'}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {lang === 'ES'
                  ? 'Cada relato explora un día en la vida de un personaje ficticio pero tangible. Sin duda, aprenderemos una cosa u otra de cada uno de ellos y sus culturas.'
                  : 'Each story explores a day in the life of a tangible yet fictional character. Without a doubt, we will learn a thing or two from each of them and their cultures.'}
              </p>
            </div>

            <div className="tech-card p-6 space-y-4 border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-amber-950/20 to-[#0d121f] shadow-xl shadow-amber-500/10 relative overflow-hidden group hover:border-amber-400/70 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" />
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <Dices size={24} />
              </div>
              <h3 className="text-lg font-black text-amber-300">
                {lang === 'ES' ? 'El Juego Interactivo' : 'The Interactive Game'}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {lang === 'ES'
                  ? 'Los países permanecen en secreto durante la lectura. Descubre las pistas, gira la página para comprobarlo y empareja los rostros en la portada con el relato.'
                  : 'Countries remain secret while reading. Discover the clues, turn the page to check, and match the faces on the cover with their story.'}
              </p>
            </div>

            <div className="tech-card p-6 space-y-4 border-amber-500/20">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Bot size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">
                {lang === 'ES' ? 'IA como Catalizador' : 'AI as a Catalyst'}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {lang === 'ES'
                  ? 'Algoritmos generativos ayudan a generar perfiles de profesiones, conflictos, personalidades, entornos culturales propios y realistas para enriquecer el contenido de la narrativa.'
                  : 'Generative algorithms help build profiles of professions, conflicts, personalities, unique cultural environments to enrich the narrative content realisticaly.'}
              </p>
            </div>

            <div className="tech-card p-6 space-y-4 border-amber-500/20">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Feather size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">
                {lang === 'ES' ? 'Curaduría & Edición' : 'Curating & Editing'}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {lang === 'ES'
                  ? 'Cada historia es minuciosamente co-creada para asegurar realismo sensorial e inmersión altamente íntima y humana.'
                  : 'Each story is meticulously co-created to ensure intimacy, human experience and sensory realism.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 relative z-10 border-t border-white/5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <a href="https://bervos.org" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity flex items-center">
              <img src="/logo.svg" alt="BERVOS Ecosystem" className="h-6 w-auto brightness-200" />
            </a>
            <span className="font-mono text-slate-400">RUTINAS &copy; 2026 BERVOS Ecosystem</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/" className="hover:text-amber-400 transition-colors">BERVOS Home</a>
            <button onClick={() => setIsExcerptOpen(true)} className="hover:text-amber-400 transition-colors">
              {lang === 'ES' ? 'Muestras' : 'Samples'}
            </button>
            <button onClick={() => setIsPreorderOpen(true)} className="hover:text-amber-400 transition-colors">
              {lang === 'ES' ? 'Lista de Espera' : 'Waitlist'}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExcerptModal isOpen={isExcerptOpen} onClose={() => setIsExcerptOpen(false)} lang={lang} />
      <PreorderModal isOpen={isPreorderOpen} onClose={() => setIsPreorderOpen(false)} lang={lang} />
    </div>
  );
};

export default RutinasLandingPage;
