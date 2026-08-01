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
import { WhyRosaModal } from './WhyRosaModal';
import { MmmTimeSeriesBackground } from './MmmTimeSeriesBackground';
import { updatePageMetadata } from '../../utils/meta';

export const RosaLandingPage: React.FC = () => {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [isWhyRosaOpen, setIsWhyRosaOpen] = useState(false);

  useEffect(() => {
    const cleanupMeta = updatePageMetadata({
      title: "Rosa | MMM Self-Hosted Enterprise Solution",
      description: "Enterprise-grade self-hosted Robyn-powered Marketing Mix Modeling (MMM) Application with built-in AI Assistant, scenario simulations, automated reporting, and complete data privacy.",
      favicon: "/rosa-favicon.png",
      appleTouchIcon: "/rosa-favicon.png",
      appName: "Rosa",
      ogImage: "https://bervos.org/rosa-logo.png",
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
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#080b12] text-slate-100 selection:bg-vinotinto/40 overflow-x-hidden font-sans">
      {/* Background Decorative Grids & Time Series */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-vinotinto/40 via-vinotinto-dark/20 to-transparent blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#960117_1px,transparent_1px)] [background-size:32px_32px] opacity-25" />
      </div>

      <main className="flex-grow">
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
              <FileText size={14} className="text-vinotinto-light" />
              <span>Rosa Licence</span>
            </button>
            <a
              href="https://github.com/laresbernardo/Rosa"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              <FaGithub size={16} />
              <span className="bg-vinotinto/15 text-vinotinto-light text-[10px] px-2 py-0.5 rounded border border-vinotinto/30 font-sans">Private Repo</span>
            </a>
            <button
              onClick={() => setIsQuoteOpen(true)}
              className="px-4 py-2 bg-vinotinto hover:bg-vinotinto-hover text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-vinotinto/30 flex items-center gap-2"
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vinotinto-light via-rose-400 to-amber-300">
                Marketing Mix Modeling
              </span> <br />
              With Built-in AI.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-2xl border-l-2 border-vinotinto/40 pl-5"
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
                className="px-8 py-4 bg-gradient-to-r from-vinotinto to-vinotinto-hover hover:from-vinotinto-hover hover:to-vinotinto-light text-white font-black text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-vinotinto/40 flex items-center gap-3"
              >
                REQUEST ACCESS
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setIsVideoOpen(true)}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-3 hover:scale-[1.02] active:scale-95"
              >
                <Play size={16} className="text-vinotinto-light fill-vinotinto-light" />
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
              <div className="absolute inset-0 bg-gradient-to-tr from-vinotinto/35 to-vinotinto-light/20 rounded-full blur-2xl opacity-70" />
              <img
                src="/rosa-logo.png"
                alt="Rosa Logo Artwork"
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_35px_rgba(150,1,23,0.55)] hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          </div>

          {/* Guaranteed Single Row Feature Bar across full 12 columns */}
          <div className="lg:col-span-12 mt-4 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Cpu size={15} className="text-vinotinto-light flex-shrink-0" />
                <span>Meta Robyn Interoperable</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <ShieldCheck size={15} className="text-vinotinto-light flex-shrink-0" />
                <span>100% Private & Self-Hosted</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <FileSpreadsheet size={15} className="text-vinotinto-light flex-shrink-0" />
                <span>PowerPoint & Data Exports</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Bot size={15} className="text-vinotinto-light flex-shrink-0" />
                <span>Trained AI Assistant</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <TrendingUp size={15} className="text-vinotinto-light flex-shrink-0" />
                <span>Scenario Simulation Engine</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Server size={15} className="text-vinotinto-light flex-shrink-0" />
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
            <span className="mono-label !text-vinotinto-light">WHY ROSA IS A GAME-CHANGER</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">Built for Data Scientists, Marketers & Executives.</h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Developed by Meta Robyn’s <a href="https://www.linkedin.com/in/laresbernardo/" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:underline transition-colors">main developer</a>, Rosa resolves traditional MMM friction by unifying mathematical accuracy, AI speed, and local data security into a single app.
              <button onClick={() => setIsWhyRosaOpen(true)} className="inline-flex items-center gap-1 text-xs text-vinotinto-light hover:text-rose-300 font-mono underline underline-offset-4 ml-3 transition-colors">
                <Sparkles size={12} />
                Discover why Rosa
              </button>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: 'Secure & 100% Private',
                desc: 'Standalone solution running locally or on your private cloud. You own the code and deployment. Zero external telemetry or data sharing or leaks.'
              },
              {
                icon: Cpu,
                title: 'Robyn-Powered Core',
                desc: <>Built directly upon <a href="https://github.com/facebookexperimental/Robyn" target="_blank" rel="noopener noreferrer" className="text-vinotinto-light hover:text-rose-300 underline font-semibold transition-colors">Robyn</a> as its underlying engine. Fully interoperable, enhanced with unique UI extensions, model selection flow, tested default parameters, audit logs.</>
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
                title: 'Automated Reporting',
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
                className="tech-card p-8 hover:border-vinotinto/50 transition-all group relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-xl bg-vinotinto/15 border border-vinotinto/30 flex items-center justify-center text-vinotinto-light mb-6 group-hover:scale-110 transition-transform">
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
              <span className="mono-label !text-vinotinto-light mb-2 block">SYSTEM_REQUIREMENTS // SPECS</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Minimum Technical Requirements</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-vinotinto/15 text-vinotinto-light border border-vinotinto/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
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
                      <Server size={16} className="text-vinotinto-light" /> Platform
                    </td>
                    <td className="py-4 px-6">R-compatible (Linux, macOS, Windows). Run locally or in private cloud.</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                      <Cpu size={16} className="text-vinotinto-light" /> CPU Cores
                    </td>
                    <td className="py-4 px-6">Parallel computing supported. 6 - 12 cores recommended for optimal performance.</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                      <Clock size={16} className="text-vinotinto-light" /> Memory
                    </td>
                    <td className="py-4 px-6">&gt;= 8GB RAM required for parallel hyperparameter optimization.</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                      <Lock size={16} className="text-vinotinto-light" /> Data
                    </td>
                    <td className="py-4 px-6">Manual CSV/JSON uploads. Optional multiple providers for AI assistants & model storage.</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                      <FileCode size={16} className="text-vinotinto-light" /> Docker
                    </td>
                    <td className="py-4 px-6">Containerized Dockerfile included for instant server deployment and scaling.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-4 tech-card p-8 space-y-6 flex flex-col justify-between border-vinotinto/30">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-vinotinto/15 border border-vinotinto/30 flex items-center justify-center text-vinotinto-light">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">Private Cloud & Docker Ready</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Rosa comes equipped with a tested Docker configuration. Deploy across AWS, Azure, Google Cloud, or on-premise hardware behind your firewall.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <span className="mono-label !text-slate-400 text-[10px]">RESOURCES_INCLUDED</span>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-vinotinto-light" /> Full Rosa R codebase & GUI</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-vinotinto-light" /> Curated documentation suite</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-vinotinto-light" /> Dockerfile & environment scripts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership & Deliverables Section */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="tech-card p-10 md:p-14 border-vinotinto/40 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="mono-label !text-vinotinto-light">PARTNERSHIP & CONSULTANCY</span>
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
                    <CheckCircle2 size={16} className="text-vinotinto-light flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 text-center p-8 rounded-2xl bg-[#0b0e17] border border-white/10 space-y-6">
              <span className="mono-label !text-vinotinto-light">CUSTOM ENTERPRISE ACCESS</span>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Get Access</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Includes full repository access, setup support, and 10 hours of expert consultancy.
                </p>
              </div>

              <button
                onClick={() => setIsQuoteOpen(true)}
                className="w-full py-3.5 bg-vinotinto hover:bg-vinotinto-hover text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-vinotinto/25 flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                REQUEST ACCESS
              </button>

              <div className="flex items-center justify-center gap-4 sm:gap-6 text-slate-400 text-xs pt-2">
                <button
                  onClick={() => setIsWhyRosaOpen(true)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-vinotinto-light underline underline-offset-4 transition-colors cursor-pointer"
                >
                  <Sparkles size={14} className="text-vinotinto-light" />
                  Why Rosa?
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={() => setIsLicenseOpen(true)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-vinotinto-light underline underline-offset-4 transition-colors cursor-pointer"
                >
                  <ShieldCheck size={14} className="text-vinotinto-light" />
                  Rosa Licence
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 relative z-10 border-t border-white/5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <a href="https://bervos.org" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity flex items-center">
              <img src="/logo.svg" alt="BERVOS Ecosystem" className="h-6 w-auto brightness-200" />
            </a>
            <span className="font-mono text-slate-400">Rosa &copy; {new Date().getFullYear()} BERVOS Ecosystem</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/" className="hover:text-vinotinto-light transition-colors">BERVOS Home</a>
            <button onClick={() => setIsWhyRosaOpen(true)} className="hover:text-vinotinto-light transition-colors">Why Rosa?</button>
            <button onClick={() => setIsLicenseOpen(true)} className="hover:text-vinotinto-light transition-colors">Rosa Licence</button>
            <button onClick={() => setIsQuoteOpen(true)} className="hover:text-vinotinto-light transition-colors">Contact</button>
          </div>
        </div>
      </footer>

      {/* Quote Request Modal */}
      <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />

      {/* Embedded Video Modal */}
      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />

      {/* License Modal */}
      <LicenseModal isOpen={isLicenseOpen} onClose={() => setIsLicenseOpen(false)} />

      {/* Why Rosa Modal */}
      <WhyRosaModal isOpen={isWhyRosaOpen} onClose={() => setIsWhyRosaOpen(false)} />
    </div>
  );
};

export default RosaLandingPage;
