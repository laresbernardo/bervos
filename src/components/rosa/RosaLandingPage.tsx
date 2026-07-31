import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Cpu,
  Bot,
  FileSpreadsheet,
  LineChart,
  ArrowRight,
  CheckCircle2,
  Play,
  Mail,
  Server,
  Lock,
  Layers,
  Sparkles,
  Clock,
  FileCode,
  TrendingUp,
  FileText
} from 'lucide-react';
import { FaGithub, FaRProject } from 'react-icons/fa';

import { QuoteModal } from './QuoteModal';
import { VideoModal } from './VideoModal';
import { LicenseModal } from './LicenseModal';
import { MmmTimeSeriesBackground } from './MmmTimeSeriesBackground';

export const RosaLandingPage: React.FC = () => {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);

  useEffect(() => {
    document.title = "Rosa | Enterprise Self-Hosted Robyn-Powered MMM Application";

    const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    const previousHref = favicon ? favicon.href : '/favicon.svg';
    const previousType = favicon ? favicon.type : 'image/svg+xml';

    if (favicon) {
      favicon.href = '/rosa-favicon.png';
      favicon.type = 'image/png';
    }

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

    return () => {
      document.title = "BERVOS | Digital Solutions, Systems & Open Source";
      if (favicon) {
        favicon.href = previousHref;
        favicon.type = previousType;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 selection:bg-rose-500/30 overflow-x-hidden font-sans">
      {/* Background Decorative Grids & Time Series */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-rose-600/30 via-pink-600/10 to-transparent blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
      </div>

      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#080b12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
            <img src="/rosa-logo.png" alt="Rosa Logo" className="h-9 w-9 object-contain" />
            <span className="text-xl font-black tracking-tight text-white glow-text">Rosa</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLicenseOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <FileText size={14} className="text-rose-400" />
              <span>Rosa Licence</span>
            </button>
            <a
              href="https://github.com/laresbernardo/Rosa"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              <FaGithub size={16} />
              <span className="bg-rose-500/10 text-rose-400 text-[10px] px-2 py-0.5 rounded border border-rose-500/20 font-sans">Private Repo</span>
            </a>
            <button
              onClick={() => setIsQuoteOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2"
            >
              <Mail size={14} />
              Contact Us
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 px-6 z-10 max-w-7xl mx-auto overflow-hidden">
        <MmmTimeSeriesBackground />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative z-10">
          <div className="lg:col-span-7 space-y-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">
                Marketing Mix Modeling
              </span> <br />
              With Built-in AI.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-2xl border-l-2 border-rose-500/30 pl-5"
            >
              Enterprise-grade self-hosted Robyn-powered Marketing Mix Modeling (MMM) Application with built-in AI Assistant, scenario simulations, automated reporting, and complete data privacy.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <button
                onClick={() => setIsQuoteOpen(true)}
                className="px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-rose-600/25 flex items-center gap-3"
              >
                REQUEST ACCESS
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setIsVideoOpen(true)}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-3 hover:scale-[1.02] active:scale-95"
              >
                <Play size={16} className="text-rose-400 fill-rose-400" />
                WATCH DEMO (VIDEO)
              </button>
            </motion.div>
          </div>

          {/* Clean Transparent Hexagon Artwork - Positioned Higher */}
          <div className="lg:col-span-5 flex justify-center items-start lg:-mt-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/25 to-pink-500/25 rounded-full blur-2xl opacity-70" />
              <img
                src="/rosa-logo.png"
                alt="Rosa Logo Artwork"
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_35px_rgba(225,29,72,0.45)] hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          </div>

          {/* Guaranteed Single Row Feature Bar across full 12 columns */}
          <div className="lg:col-span-12 mt-4 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Cpu size={15} className="text-rose-400 flex-shrink-0" />
                <span>Meta Robyn Interoperable</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <ShieldCheck size={15} className="text-rose-400 flex-shrink-0" />
                <span>100% Private & Self-Hosted</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <FileSpreadsheet size={15} className="text-rose-400 flex-shrink-0" />
                <span>PowerPoint & Data Exports</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Bot size={15} className="text-rose-400 flex-shrink-0" />
                <span>Trained AI Assistant</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <TrendingUp size={15} className="text-rose-400 flex-shrink-0" />
                <span>Scenario Simulation Engine</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Server size={15} className="text-rose-400 flex-shrink-0" />
                <span>Docker & Cloud Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game-Changer Highlights Section */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="mono-label !text-rose-400">WHY ROSA IS A GAME-CHANGER</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">Built for Data Scientists, Marketers & Executives.</h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Developed by Meta Robyn’s main developer, Rosa resolves traditional MMM friction by unifying mathematical accuracy, AI speed, and local data security into a single app.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: 'Secure & 100% Private',
                desc: 'Standalone solution running locally or on your private cloud. You own the code and deployment—zero external telemetry or data leaks.'
              },
              {
                icon: Cpu,
                title: 'Robyn-Powered Core',
                desc: 'Built directly upon Robyn as its underlying engine. Fully interoperable, enhanced with unique UI extensions, model refreshers, and audit logs.'
              },
              {
                icon: Bot,
                title: 'AI Assistant & Automation',
                desc: 'Leverages AI tools trained on dedicated documentation, Dataset AI querychat, and ML algorithms to reduce human bias and expedite delivery.'
              },
              {
                icon: LineChart,
                title: 'Scenario Simulation',
                desc: 'Simulate budget reallocation scenarios, test diminishing returns, and answer complex business questions with instant visual output.'
              },
              {
                icon: FileSpreadsheet,
                title: 'Automated PowerPoint Reports',
                desc: 'Generates fully editable PowerPoint (.pptx) executive slide decks, ready for stakeholder presentations without manual work.'
              },
              {
                icon: Layers,
                title: 'End-to-End Workflow',
                desc: 'Documented end-to-end framework covering data preparation, hyperparameter calibration, model storage, and post-modeling QA.'
              }
            ].map((f, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="tech-card p-8 hover:border-rose-500/40 transition-all group relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform">
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications Table */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div>
              <span className="mono-label !text-rose-400 mb-2 block">SYSTEM_REQUIREMENTS // SPECS</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Minimum Technical Requirements</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <FaRProject size={14} /> R &gt;= 4.5.0 Recommended
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-white/5 text-slate-200 font-mono text-xs uppercase">
                  <tr>
                    <th className="py-4 px-6">Requirement</th>
                    <th className="py-4 px-6">Specification Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  <tr>
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                      <Server size={16} className="text-rose-400" /> OS / Platform
                    </td>
                    <td className="py-4 px-6">R-compatible (Linux, macOS, Windows). Run locally or in private cloud.</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                      <Cpu size={16} className="text-rose-400" /> CPU Cores
                    </td>
                    <td className="py-4 px-6">Parallel computing supported. 6 - 12 cores recommended for optimal performance.</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                      <Clock size={16} className="text-rose-400" /> Memory
                    </td>
                    <td className="py-4 px-6">&gt;= 8GB RAM required for parallel hyperparameter optimization.</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                      <Lock size={16} className="text-rose-400" /> Data
                    </td>
                    <td className="py-4 px-6">Manual CSV/JSON uploads. Optional multiple providers for AI assistants & model storage.</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                      <FileCode size={16} className="text-rose-400" /> Docker
                    </td>
                    <td className="py-4 px-6">Containerized Dockerfile included for instant server deployment and scaling.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-4 tech-card p-8 space-y-6 flex flex-col justify-between border-rose-500/20">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">Private Cloud & Docker Ready</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Rosa comes equipped with a tested Docker configuration. Deploy across AWS, Azure, Google Cloud, or on-premise hardware behind your firewall.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <span className="mono-label !text-slate-400 text-[10px]">RESOURCES_INCLUDED</span>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-rose-400" /> Full Rosa R codebase & GUI</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-rose-400" /> Curated documentation suite</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-rose-400" /> Dockerfile & environment scripts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership & Deliverables Section */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="tech-card p-10 md:p-14 border-rose-500/30 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="mono-label !text-rose-400">PARTNERSHIP & CONSULTANCY</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Full Repository Access & Dedicated Onboarding Package
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Lifetime access to the private GitHub repository allows your team to fork, customize, and maintain your own version of Rosa forever.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {[
                  'Private GitHub Repository Access',
                  '10-Hour Onboarding & QA Package',
                  'Codebase Walkthroughs & Training',
                  'Support on QA & Integration',
                  'Simple Code Tweaks (Logs, APIs, Logos)',
                  'Fixes for Future Breaking Changes'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 size={16} className="text-rose-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 text-center p-8 rounded-2xl bg-gradient-to-b from-rose-950/40 to-slate-950/80 border border-rose-500/30 space-y-6">
              <span className="mono-label !text-rose-300">CUSTOM ENTERPRISE ACCESS</span>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Get Access</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Includes full repository access, setup support, and 10 hours of expert consultancy.
                </p>
              </div>

              <button
                onClick={() => setIsQuoteOpen(true)}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-sm rounded-xl transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                REQUEST ACCESS
              </button>

              <div className="flex items-center justify-center gap-4 text-slate-400 text-xs pt-2">
                <button
                  onClick={() => setIsLicenseOpen(true)}
                  className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 underline underline-offset-4 transition-colors cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  Rosa Licence
                </button>
              </div>
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
            <span className="font-mono text-slate-400">Rosa &copy; {new Date().getFullYear()} BERVOS Ecosystem</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/" className="hover:text-rose-400 transition-colors">BERVOS Home</a>
            <button onClick={() => setIsLicenseOpen(true)} className="hover:text-rose-400 transition-colors">Rosa Licence</button>
            <button onClick={() => setIsQuoteOpen(true)} className="hover:text-rose-400 transition-colors">Contact</button>
          </div>
        </div>
      </footer>

      {/* Quote Request Modal */}
      <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />

      {/* Embedded Video Modal */}
      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />

      {/* License Modal */}
      <LicenseModal isOpen={isLicenseOpen} onClose={() => setIsLicenseOpen(false)} />
    </div>
  );
};

export default RosaLandingPage;
