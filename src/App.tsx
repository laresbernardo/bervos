import { useState, useEffect } from 'react';
import { Star, Users, ArrowUpRight, X, GitFork, Download, Search, Loader2 } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { motion } from 'framer-motion';
import DecryptedText from './components/DecryptedText';

// Firebase & Hub Imports
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './firebase';
import { HubLogin } from './components/HubLogin';
import { HubDashboard } from './components/HubDashboard';
import { HubAccessDenied } from './components/HubAccessDenied';

declare global {
  interface Window {
    gtag: (command: string, action: string, params?: Record<string, string>) => void;
  }
}

// GA Event Tracking Helper
const trackEvent = (action: string, category: string, label: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      'event_category': category,
      'event_label': label
    });
  }
};

import ecosystem from './data/ecosystem.json';

const { projects, openSource } = ecosystem;

const HeroGraphic = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
      <svg className="w-full h-full" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d="M500 100 L900 500 L500 900 L100 500 Z"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-indigo-500"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M500 200 L800 500 L500 800 L200 500 Z"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-cyan-500"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
        />
        <g className="text-indigo-500/30">
          {[...Array(10)].map((_, i) => (
            <motion.line
              key={i}
              x1="0" y1={i * 100} x2="1000" y2={i * 100}
              stroke="currentColor"
              strokeWidth="0.2"
              initial={{ x: -1000 }}
              animate={{ x: 0 }}
              transition={{ duration: 10 + i, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

interface ContactData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Modal = ({
  type,
  onClose,
  status,
  data,
  setData,
  resetForm,
  onSubmit
}: {
  type: 'privacy' | 'terms' | 'contact' | 'concept',
  onClose: () => void,
  status: 'idle' | 'sending' | 'success' | 'error',
  data: ContactData,
  setData: (data: ContactData) => void,
  resetForm: () => void,
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#080b12]/90 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="tech-card p-8 max-w-2xl w-full relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors z-10"
        >
          <X size={20} />
        </button>
        <div className="mb-6">
          <span className="mono-label block mb-1">System_Dialog // {type.toUpperCase()}</span>
          <h2 className="text-3xl font-bold glow-text">
            {type === 'privacy' ? 'Privacy Policy' : type === 'terms' ? 'Terms of Service' : type === 'concept' ? 'The BERVOS Concept' : status === 'success' ? 'Message Sent' : 'Get in Touch'}
          </h2>
        </div>
        <div className="text-slate-400 leading-relaxed space-y-4 max-h-[70vh] overflow-y-auto pr-4 scrollbar-thin">
          {status === 'success' ? (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <Star size={40} fill="currentColor" />
                </motion.div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-white">Transmission Received</p>
                <p className="text-sm">Your message has been delivered directly to my inbox. <br />Expected response time: &lt; 24 hours.</p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20"
              >
                Return to Site
              </button>
            </div>
          ) : type === 'privacy' ? (
            <>
              <p>At BERVOS, we respect your privacy. This website is a showcase of digital solutions and craftsmanship.</p>
              <p><strong>Data Collection:</strong> We do not collect personal data from visitors unless you explicitly contact us via email. Any information provided is used solely to respond to your inquiries.</p>
              <p><strong>Cookies:</strong> We use minimal cookies for site performance and analytics to improve your experience.</p>
              <p><strong>Security:</strong> We implement standard security measures to protect the integrity of our digital showcase.</p>
              <p>By using this site, you agree to the terms outlined in this policy.</p>
            </>
          ) : type === 'terms' ? (
            <>
              <p>Welcome to BERVOS. By accessing this website, you agree to comply with and be bound by the following terms of use.</p>
              <p><strong>Intellectual Property:</strong> All content, including logos, text, and code, is the property of BERVOS and protected by intellectual property laws. You may not reproduce or distribute any content without prior written permission.</p>
              <p><strong>Use of Tools:</strong> Our projects (Billio, Chessverse, tripitdown, Aura, Scribo, Pinmage) are provided for demonstration and individual use according to their respective licenses.</p>
              <p><strong>Liability:</strong> We provide our tools and information "as is" without warranties of any kind. BERVOS is not liable for any damages arising from the use of this site or its projects.</p>
              <p><strong>Changes:</strong> We reserve the right to modify these terms at any time without notice.</p>
            </>
          ) : type === 'concept' ? (
            <div className="space-y-8 py-4">
              <div className="border-l-2 border-indigo-500/30 pl-6">
                <h3 className="text-white font-bold mb-2 uppercase tracking-wider text-sm">Action Angle // Ber + Verbos</h3>
                <p className="text-sm">In Spanish, <em>verbos</em> are the engines of action. BERVOS signifies tools built to execute, optimize, and move the needle, not just passive reports.</p>
              </div>
              <div className="border-l-2 border-cyan-500/30 pl-6">
                <h3 className="text-white font-bold mb-2 uppercase tracking-wider text-sm">Enterprise System // B.E.R.V.O.S.</h3>
                <p className="text-sm">Business Effectiveness & Resource Visualization Optimization System. Personal framework to measure impact and drive growth.</p>
              </div>
              <div className="border-l-2 border-indigo-500/30 pl-6">
                <h3 className="text-white font-bold mb-2 uppercase tracking-wider text-sm">Client-Centric // Ber-Vos</h3>
                <p className="text-sm">"Ber for You." A linguistic nod to <em>vos</em>, signaling highly personalized solutions designed specifically for the end user.</p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="space-y-6 pt-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="mono-label">Full Name</label>
                  <input
                    name="name"
                    required
                    type="text"
                    placeholder="John Doe"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    disabled={status === 'sending'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50 font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="mono-label">Email Address</label>
                  <input
                    name="email"
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    disabled={status === 'sending'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50 font-mono text-sm"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="mono-label">Subject</label>
                  <input
                    name="subject"
                    required
                    type="text"
                    placeholder="Project Inquiry"
                    value={data.subject}
                    onChange={(e) => setData({ ...data, subject: e.target.value })}
                    disabled={status === 'sending'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="mono-label">Message</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="How can we help you?"
                  value={data.message}
                  onChange={(e) => setData({ ...data, message: e.target.value })}
                  disabled={status === 'sending'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors resize-none disabled:opacity-50 font-mono text-sm"
                />
              </div>
              {status === 'error' && (
                <p className="text-red-400 text-xs font-bold text-center">Transmission Error. Please retry or contact via LinkedIn.</p>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-500 transition-all hover:scale-[1.01] active:scale-95 shadow-xl shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-wait"
              >
                {status === 'sending' ? 'TRANSMITTING...' : 'SEND MESSAGE'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ----- Home page extracted into its own component to satisfy Rules of Hooks -----

function HomePage() {
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'contact' | 'concept' | null>(null);
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [contactData, setContactData] = useState<ContactData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [repoStats, setRepoStats] = useState<Record<string, { stars: string, forks: string, contributors: string, downloads: string }>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'productivity' | 'leisure'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const fetchStats = async () => {
      const stats: Record<string, { stars: string, forks: string, contributors: string, downloads: string }> = {};

      const formatNumber = (num: number) => {
        if (num >= 100000) {
          return Math.round(num / 1000) + 'k';
        }
        if (num >= 1000) {
          return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return num.toString();
      };

      for (const repo of openSource) {
        try {
          const repoPath = repo.link.replace('https://github.com/', '');
          const results = await Promise.allSettled([
            fetch(`https://api.github.com/repos/${repoPath}`),
            fetch(`https://api.github.com/repos/${repoPath}/contributors?per_page=1`),
            fetch(`https://cranlogs.r-pkg.org/downloads/total/2012-10-01:2030-01-01/${repo.name}`)
          ]);

          let stars = repo.stars;
          let forks = repo.forks;
          let contributors = repo.contributors;
          let downloads = repo.downloads;

          // GitHub Repo Data
          if (results[0].status === 'fulfilled' && results[0].value.ok) {
            const data = await results[0].value.json();
            if (data.stargazers_count !== undefined) stars = formatNumber(data.stargazers_count);
            if (data.forks_count !== undefined) forks = formatNumber(data.forks_count);
          }

          // GitHub Contributors
          if (results[1].status === 'fulfilled' && results[1].value.ok) {
            const linkHeader = results[1].value.headers.get('Link');
            if (linkHeader) {
              const match = linkHeader.match(/page=(\d+)>; rel="last"/);
              if (match) contributors = match[1];
            } else {
              const data = await results[1].value.json();
              if (Array.isArray(data)) contributors = data.length.toString();
            }
          }

          // CRAN Downloads
          if (results[2].status === 'fulfilled' && results[2].value.ok) {
            const data = await results[2].value.json();
            if (Array.isArray(data) && data[0]?.downloads) {
              downloads = formatNumber(data[0].downloads);
            }
          }

          stats[repo.name] = { stars, forks, contributors, downloads };
        } catch (e) {
          console.error(`Failed to fetch stats for ${repo.name}`, e);
          stats[repo.name] = {
            stars: repo.stars,
            forks: repo.forks,
            contributors: repo.contributors,
            downloads: repo.downloads
          };
        }
      }
      setRepoStats(stats);
    };

    fetchStats();
  }, []);

  const resetContactForm = () => {
    setContactData({ name: '', email: '', subject: '', message: '' });
    setContactStatus('idle');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setContactStatus('sending');
    const formData = new FormData();
    formData.append('name', contactData.name);
    formData.append('email', contactData.email);
    formData.append('subject', contactData.subject);
    formData.append('message', contactData.message);

    try {
      const response = await fetch('https://formspree.io/f/xwvyyebo', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        setContactStatus('success');
        trackEvent('contact_form_success', 'engagement', 'Message Sent');
      } else {
        setContactStatus('error');
      }
    } catch {
      setContactStatus('error');
    }
  };

  return (
    <div className="min-h-screen selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[60] border-b border-white/5 bg-[#080b12]/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => window.location.href = '/hub'}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <img src="/logo.svg" alt="BERVOS" className="h-8 w-auto brightness-200" />
          </motion.div>

          <nav className="flex items-center gap-1 sm:gap-6">
            {['Projects', 'Open Source', 'Connect'].map((item, i) => (
              <motion.a
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="px-2 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-white/10"
              >
                {item}
              </motion.a>
            ))}
          </nav>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 md:pt-40 pb-20 px-6 overflow-hidden min-h-[90vh] flex items-center">
        <HeroGraphic />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          <div className="lg:col-span-8 text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 mb-8"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="mono-label !text-indigo-400">Innovation & Practicality</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1] md:leading-[0.9] glow-text uppercase py-2"
            >
              Building <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">fuller</span> <br />
              experiences.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl leading-relaxed font-medium border-l-2 border-indigo-500/30 pl-6"
            >
              BERVOS. A family of flexible digital solutions engineered to learn and drive true action.
            </motion.p>
          </div>

          <div className="hidden lg:block lg:col-span-4 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="relative aspect-square"
            >
              <div className="absolute inset-0 border border-indigo-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-8 border border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="/logo.svg" alt="Logo" className="w-32 h-32 opacity-40 blur-sm absolute" />
                <img src="/logo.svg" alt="Logo" className="w-32 h-32" />
              </div>
            </motion.div>
          </div>
        </div>
      </header>      {/* Projects Section */}
      <section id="projects" className="py-40 px-6 relative">
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-20 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="mono-label !text-indigo-400 mb-2 block">Index_01 // Projects</span>
              <h2 className="text-5xl font-black mb-4 glow-text uppercase tracking-tighter">
                <DecryptedText
                  text="Bervos Ecosystem"
                  speed={40}
                  maxIterations={30}
                  animateOn="inViewHover"
                />
              </h2>
              <p className="text-slate-400 text-lg max-w-md border-l border-indigo-500/30 pl-4">Specialized tools for various domains.</p>
            </motion.div>
            <div className="text-indigo-500/10 text-8xl font-black hidden md:block select-none leading-none tracking-tighter">PROJECTS_01</div>
          </div>

          {/* High-Tech Search & Category Filter HUD */}
          <div className="flex flex-col md:flex-row md:items-center justify-start gap-6 md:gap-8 mb-12 border-b border-white/5 pb-8">
            {/* Search Input */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(3); // Reset pagination count on search
                  trackEvent('project_search', 'engagement', e.target.value);
                }}
                placeholder="SEARCH_PROJECTS // (e.g. Chess, Finance, Go...)"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono text-xs placeholder-slate-500 uppercase tracking-wider"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setVisibleCount(3);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="mono-label !text-slate-500 mr-2 hidden lg:inline">[SELECT_FILTER] //</span>
              {(['all', 'productivity', 'leisure'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setActiveFilter(filter);
                    setVisibleCount(3); // Reset visible count when filter changes
                    trackEvent('filter_change', 'engagement', filter);
                  }}
                  className={`relative px-4 py-2.5 font-mono text-xs uppercase tracking-widest rounded-lg border transition-all duration-300 cursor-pointer ${activeFilter === filter
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 glow-text'
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                    }`}
                >
                  {filter === 'all' ? '00 // Show_All' : filter === 'productivity' ? '01 // Productivity' : '02 // Leisure_Creative'}
                  {activeFilter === filter && (
                    <motion.div
                      layoutId="activeFilterOutline"
                      className="absolute inset-0 border border-indigo-500/50 rounded-lg pointer-events-none"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Expandable Project Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {(() => {
              const filteredProjects = projects.filter((p) => {
                const categoryMatch = activeFilter === 'all' || p.category === activeFilter;
                const searchMatch = !searchQuery ||
                  p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
                return categoryMatch && searchMatch;
              });

              if (filteredProjects.length === 0) {
                return (
                  <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <span className="mono-label !text-slate-500 block mb-2">// ERROR: NO_RESULTS_FOUND</span>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">No Projects Match Your Search</h3>
                    <p className="text-slate-400 font-mono text-xs">Try searching for other terms or clearing the filter.</p>
                  </div>
                );
              }

              const displayProjects = filteredProjects.slice(0, visibleCount);

              const cards = displayProjects.map((project, i) => (
                <motion.a
                  layout
                  key={project.title}
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => trackEvent('project_click', 'engagement', project.title)}
                  className="group relative bg-[#080b12] p-6 sm:p-10 hover:bg-[#0c121d] transition-all duration-500 overflow-hidden flex flex-col justify-between min-h-[340px] sm:min-h-[380px] border border-white/5 hover:border-indigo-500/30 rounded-2xl"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={20} className="text-indigo-400" />
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-8 sm:mb-12">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:border-indigo-500/50">
                        <img
                          src={project.logo}
                          alt={project.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-2xl sm:text-3xl font-black group-hover:text-indigo-400 transition-colors tracking-tight">{project.title}</h3>
                      <p className="text-slate-400 mb-6 sm:mb-10 text-base sm:text-lg leading-relaxed group-hover:text-slate-300 transition-colors">{project.description}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-2 mt-6 sm:mt-8">
                      {project.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-mono uppercase tracking-tighter px-3 py-1 bg-white/5 text-slate-400 border border-white/10 group-hover:border-indigo-500/20 group-hover:text-indigo-400 transition-all">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Decorative blueprint elements */}
                  <div className="absolute bottom-0 left-0 w-20 h-px bg-indigo-500/0 group-hover:bg-indigo-500/40 transition-all duration-700" />
                  <div className="absolute bottom-0 left-0 w-px h-20 bg-indigo-500/0 group-hover:bg-indigo-500/40 transition-all duration-700" />
                </motion.a>
              ));

              // If there's an empty slot in the row (length % 3 !== 0), render a custom CTA card
              if (displayProjects.length % 3 !== 0) {
                cards.push(
                  <motion.button
                    layout
                    key="cta-project"
                    onClick={() => {
                      setModalType('contact');
                      trackEvent('cta_click', 'engagement', 'Your Project');
                    }}
                    className="group relative bg-[#080b12] p-6 sm:p-10 hover:bg-[#0c121d] transition-all duration-500 overflow-hidden flex flex-col justify-between min-h-[340px] sm:min-h-[380px] border border-white/5 hover:border-indigo-500/30 rounded-2xl cursor-pointer text-left w-full"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={20} className="text-indigo-400" />
                    </div>

                    <div>
                      <div className="flex justify-between items-start mb-8 sm:mb-12">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/50 transition-colors">
                          <Star size={28} className="animate-pulse" />
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-2xl sm:text-3xl font-black group-hover:text-indigo-400 transition-colors tracking-tight">Your Project Next?</h3>
                        <p className="text-slate-400 mb-6 sm:mb-10 text-base sm:text-lg leading-relaxed group-hover:text-slate-300 transition-colors">
                          Have an innovative idea, tool, or collaboration in mind? Let's build it together.
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-2 mt-6 sm:mt-8">
                        {['Collab', 'AI', 'Fullstack', 'Design'].map(tag => (
                          <span key={tag} className="text-[9px] font-mono uppercase tracking-tighter px-3 py-1 bg-white/5 text-slate-400 border border-white/10 group-hover:border-indigo-500/20 group-hover:text-indigo-400 transition-all">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Decorative blueprint elements */}
                    <div className="absolute bottom-0 left-0 w-20 h-px bg-indigo-500/0 group-hover:bg-indigo-500/40 transition-all duration-700" />
                    <div className="absolute bottom-0 left-0 w-px h-20 bg-indigo-500/0 group-hover:bg-indigo-500/40 transition-all duration-700" />
                  </motion.button>
                );
              }

              return cards;
            })()}
          </motion.div>

          {/* Interactive Expand Workspace Button */}
          {(() => {
            const filteredProjects = projects.filter((p) => {
              const categoryMatch = activeFilter === 'all' || p.category === activeFilter;
              const searchMatch = !searchQuery ||
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
              return categoryMatch && searchMatch;
            });

            const hasMore = filteredProjects.length > visibleCount;
            const canCollapse = filteredProjects.length > 3 && visibleCount >= filteredProjects.length;

            if (!hasMore && !canCollapse) return null;

            return (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => {
                    if (hasMore) {
                      setVisibleCount(prev => prev + 3); // Load one additional row (3 columns) at a time
                      trackEvent('expand_workspace', 'engagement', 'Load More');
                    } else {
                      setVisibleCount(3); // Reset to first row
                      trackEvent('expand_workspace', 'engagement', 'Collapse');
                    }
                  }}
                  className="group flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 rounded-xl font-mono text-[11px] uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-all duration-300 shadow-lg cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full bg-indigo-500 ${hasMore ? 'animate-pulse' : 'animate-none'}`} />
                  {hasMore ? '[+ RENDER NEXT BLOCK // LOAD MORE]' : '[- COLLAPSE EXTENDED DIRECTORY]'}
                </button>
              </div>
            );
          })()}
        </div>
      </section>
      {/* Open Source Section */}
      <section id="open-source" className="py-40 px-6 relative bg-white/[0.01]">
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-start md:items-end justify-between mb-20 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="mono-label !text-cyan-400 mb-2 block">Index_02 // Shared_Intelligence</span>
              <h2 className="text-5xl font-black mb-4 glow-text uppercase tracking-tighter">
                <DecryptedText
                  text="Open Source"
                  speed={40}
                  maxIterations={30}
                  animateOn="inViewHover"
                />
              </h2>
              <p className="text-slate-400 text-lg max-w-md border-l border-cyan-500/30 pl-4">Contributions to open sourced solutions.</p>
            </motion.div>
            <div className="text-cyan-500/10 text-8xl font-black hidden md:block select-none leading-none tracking-tighter">OSS_LIB_02</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {openSource.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="tech-card p-10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-indigo-400">
                        <FaGithub size={24} />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight">{pkg.name}</h3>
                    </div>

                  </div>
                  <p className="text-slate-400 mb-10 text-lg leading-relaxed">{pkg.description}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-8 border-t border-white/5 gap-6">
                  <div className="flex flex-wrap gap-x-4 gap-y-3 sm:gap-6">
                    <div className="flex items-center gap-2.5" title="Stars">
                      <Star size={16} className="text-yellow-500/40" />
                      <span className="mono-label !text-slate-400">{repoStats[pkg.name]?.stars || pkg.stars}</span>
                    </div>
                    <div className="flex items-center gap-2.5" title="Forks">
                      <GitFork size={16} className="text-green-500/40" />
                      <span className="mono-label !text-slate-400">{repoStats[pkg.name]?.forks || pkg.forks}</span>
                    </div>
                    <a
                      href={`https://cran.r-project.org/web/packages/${pkg.name}/index.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 hover:text-indigo-400 transition-colors"
                      title="CRAN Downloads"
                    >
                      <Download size={16} className="text-indigo-500/40" />
                      <span className="mono-label !text-slate-400">{repoStats[pkg.name]?.downloads || pkg.downloads}</span>
                    </a>
                    <div className="flex items-center gap-2.5" title="Collaborators">
                      <Users size={16} className="text-blue-500/40" />
                      <span className="mono-label !text-slate-400">{repoStats[pkg.name]?.contributors || pkg.contributors}</span>
                    </div>
                  </div>
                  <a
                    href={pkg.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    ACCESS_REPO <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Connect Footer */}
      <footer id="connect" className="py-20 px-6 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="tech-card p-12 flex flex-col md:flex-row items-center justify-between gap-12"
          >
            <div className="relative">
              <span className="mono-label !text-indigo-400 mb-2 block">Command_Output // Next_Steps</span>
              <h2 className="text-5xl font-black mb-6 uppercase tracking-tighter glow-text">Let's build <br />something great.</h2>
              <p className="text-slate-400 text-xl max-w-md border-l border-indigo-500/30 pl-6">Open for high-impact collaborations and partnerships. Also, feedback is welcome!</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 relative">
              <a
                href="https://github.com/laresbernardo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-4 px-10 py-5 rounded-xl bg-white text-black font-black hover:bg-slate-200 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
              >
                <FaGithub size={20} />
                GITHUB
              </a>
              <a
                href="https://linkedin.com/in/laresbernardo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-4 px-10 py-5 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-black hover:scale-105 active:scale-95"
              >
                <FaLinkedin size={20} />
                LINKEDIN
              </a>
            </div>
          </motion.div>

          <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={scrollToTop}>
                <img src="/logo.svg" alt="BERVOS" className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="mono-label !text-slate-500 tracking-widest text-[11px]">&copy; {new Date().getFullYear()} BERVOS</span>
              </div>
            </div>
            <div className="flex gap-4 sm:gap-8">
              {['Concept', 'Privacy', 'Terms', 'Contact'].map(item => (
                <button
                  key={item}
                  onClick={() => setModalType(item.toLowerCase() as 'privacy' | 'terms' | 'contact' | 'concept')}
                  className="mono-label !text-slate-500 hover:!text-indigo-400 transition-colors cursor-pointer"
                >
                  [{item.toUpperCase()}]
                </button>
              ))}
            </div>
          </div>
        </div>
        {modalType && (
          <Modal
            type={modalType}
            onClose={() => setModalType(null)}
            status={contactStatus}
            data={contactData}
            setData={setContactData}
            resetForm={resetContactForm}
            onSubmit={handleContactSubmit}
          />
        )}
      </footer>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  const isHub = window.location.pathname === '/hub';

  if (isHub) {
    if (loadingAuth) {
      return (
        <div className="min-h-screen bg-[#080b12] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="mono-label !text-indigo-400">CONNECTING_SYSTEM_AUTH // LOADING</span>
        </div>
      );
    }
    if (!user) {
      return <HubLogin onBackToHome={() => { window.location.href = '/'; }} />;
    }
    if (user.email !== 'laresbernardo@gmail.com') {
      return <HubAccessDenied user={user} onBackToHome={() => { window.location.href = '/'; }} />;
    }
    return <HubDashboard user={user} />;
  }

  return <HomePage />;
}

export default App;
