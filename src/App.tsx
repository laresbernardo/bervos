import { ExternalLink, Star, Users, ArrowUpRight } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { motion } from 'framer-motion';

const projects = [
  {
    title: 'Billio',
    description: 'Advanced financial management and projection system.',
    link: 'https://billio.bervos.org/',
    tags: ['Finance', 'Travel', 'Collaboration'],
    logo: '/billio-logo.png'
  },
  {
    title: 'Chessverse',
    description: 'A modern platform for chess enthusiasts and professionals.',
    link: 'https://chessverse-demo.web.app/',
    tags: ['Chess', 'Puzzles', 'Openings'],
    logo: '/chessverse-logo.png'
  },
  {
    title: 'tripitdown',
    description: 'Precision-focused travel itinerary and log management.',
    link: 'https://tripitdown.web.app/',
    tags: ['Tailwind', 'Maps', 'Travel'],
    logo: '/tripitdown-logo.png'
  },
  {
    title: 'Scribo',
    description: 'Master Arabic and Japanese characters through immersive practice.',
    link: 'https://scribo-demo.web.app/mastery',
    tags: ['Markdown', 'Focus', 'Writers'],
    logo: '/scribo-logo.png'
  }
];

const openSource = [
  {
    name: 'Robyn',
    description: 'Marketing Mix Modeling (MMM) by Meta Marketing Science.',
    stars: '1.2k',
    contributors: '45',
    link: 'https://github.com/facebookexperimental/Robyn'
  },
  {
    name: 'lares',
    description: 'R package for data science, analytics, and business intelligence.',
    stars: '500+',
    contributors: '12',
    link: 'https://github.com/laresbernardo/lares'
  }
];

function App() {
  return (
    <div className="min-h-screen selection:bg-white/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="h-10 flex items-center justify-center transition-all duration-300">
              <img src="/bervos-logo.png" alt="BERVOS" className="h-full w-auto object-contain invert brightness-200" />
            </div>
          </motion.div>

          <nav className="hidden md:flex items-center gap-10 text-sm font-medium">
            {['Projects', 'Open Source', 'Connect'].map((item, i) => (
              <motion.a
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-white/50 hover:text-white transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all group-hover:w-full" />
              </motion.a>
            ))}
          </nav>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-48 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none opacity-25">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-medium mb-10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Innovation & Practicity
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent leading-[1.1]"
          >
            Digital solutions for <br />fuller experiences
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-2xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Family of premium useful tools <br className="hidden md:block" /> landed as practical robust solutions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-6"
          >
            <a href="#projects" className="px-10 py-5 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10">
              Explore Projects
            </a>
            <a href="https://github.com/laresbernardo" target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95">
              GitHub
            </a>
          </motion.div>
        </div>
      </header>

      {/* Projects Section */}
      <section id="projects" className="py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl font-bold mb-4">Core Ecosystem</h2>
              <p className="text-white/40 text-lg">Specialized tools built for high-performance domains.</p>
            </motion.div>
            <div className="text-white/10 text-2xl font-black hidden md:block select-none">01</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, i) => (
              <motion.a
                key={project.title}
                href={project.link}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative glass p-10 glass-hover glow overflow-hidden"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="w-20 h-20 rounded-[22.5%] bg-white/5 border border-white/10 overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
                    <img
                      src={project.logo}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <motion.div
                    whileHover={{ x: 5, y: -5 }}
                    className="p-3 rounded-full bg-white/5 border border-white/10 text-white/40 group-hover:text-white transition-colors"
                  >
                    <ArrowUpRight size={24} />
                  </motion.div>
                </div>
                <h3 className="text-3xl font-bold mb-4">{project.title}</h3>
                <p className="text-white/40 mb-10 text-lg leading-relaxed h-20">{project.description}</p>
                <div className="flex flex-wrap gap-3">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-[11px] uppercase tracking-widest font-black px-4 py-2 rounded-full bg-white/5 text-white/30 border border-white/10 group-hover:border-white/20 transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section id="open-source" className="py-40 px-6 relative">
        <div className="absolute inset-0 bg-white/[0.01] -skew-y-3 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-end justify-between mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl font-bold mb-4">Open Source</h2>
              <p className="text-white/40 text-lg">Contributions to the global engineering stack.</p>
            </motion.div>
            <div className="text-white/10 text-2xl font-black hidden md:block select-none">02</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {openSource.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass border-white/5 p-10 flex flex-col justify-between hover:border-white/20 transition-all duration-500"
              >
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <FaGithub size={24} className="text-white/80" />
                    </div>
                    <h3 className="text-2xl font-bold">{pkg.name}</h3>
                  </div>
                  <p className="text-white/40 mb-10 text-lg leading-relaxed">{pkg.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-8">
                    <div className="flex items-center gap-2.5 text-sm text-white/60">
                      <Star size={18} className="text-yellow-500/60" />
                      <span>{pkg.stars}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-white/60">
                      <Users size={18} className="text-blue-500/60" />
                      <span>{pkg.contributors}</span>
                    </div>
                  </div>
                  <a
                    href={pkg.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors"
                  >
                    Repository <ExternalLink size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Connect Footer */}
      <footer id="connect" className="py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass p-16 flex flex-col md:flex-row items-center justify-between gap-16 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full -mr-48 -mt-48" />

            <div className="relative">
              <h2 className="text-5xl font-bold mb-6">Let's build <br />something great.</h2>
              <p className="text-white/40 text-xl max-w-md">Open for high-impact collaborations and partnerships.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 relative">
              <a
                href="https://github.com/laresbernardo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-4 px-10 py-5 rounded-2xl bg-white text-black font-black hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
              >
                <FaGithub size={24} />
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/laresbernardo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-4 px-10 py-5 rounded-2xl border border-white/10 hover:bg-white/5 transition-all font-black hover:scale-105 active:scale-95"
              >
                <FaLinkedin size={24} />
                LinkedIn
              </a>
            </div>
          </motion.div>

          <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 text-sm text-white/20">
            <div className="flex items-center gap-4">
              <img src="/bervos-logo.png" alt="BERVOS" className="w-6 h-6 opacity-40 invert" />
              <span className="font-medium tracking-wide">&copy; {new Date().getFullYear()} BERVOS. Digital Craftsmanship.</span>
            </div>
            <div className="flex gap-12 font-bold uppercase tracking-widest text-[10px]">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="mailto:laresbernardo@gmail.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
