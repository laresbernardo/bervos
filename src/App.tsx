import { ExternalLink, Package, Star, Users, ArrowUpRight } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

const projects = [
  {
    title: 'Billio',
    description: 'Advanced financial management and projection system.',
    link: 'https://mybillio.web.app/',
    tags: ['Next.js', 'Firebase', 'Finance']
  },
  {
    title: 'Chessverse',
    description: 'A modern platform for chess enthusiasts and professionals.',
    link: 'https://chessverse-demo.web.app/',
    tags: ['React', 'WebSockets', 'Game']
  },
  {
    title: 'tripitdown',
    description: 'Precision-focused travel itinerary and log management.',
    link: 'https://tripitdown.web.app/',
    tags: ['Tailwind', 'Maps', 'Travel']
  },
  {
    title: 'Scribo',
    description: 'Minimalist writing environment for elite engineers.',
    link: 'https://scribo-demo.web.app/mastery',
    tags: ['Markdown', 'Focus', 'Writers']
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
    <div className="min-h-screen premium-gradient selection:bg-white/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
              <img src="/logo.svg" alt="BERVOS" className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">BERVOS</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#projects" className="hover:text-white transition-colors">Projects</a>
            <a href="#opensource" className="hover:text-colors">Open Source</a>
            <a href="#connect" className="hover:text-white transition-colors">Connect</a>
          </nav>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Available for new ventures
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Building tools for a <br />fuller experience
          </h1>
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Building premium digital experiences through innovative and robust tools.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="#projects" className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all active:scale-95 shadow-xl shadow-white/5">
              Explore Projects
            </a>
            <a href="https://github.com/laresbernardo" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all active:scale-95">
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Projects Section */}
      <section id="projects" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16">
            <div>
              <h2 className="text-4xl font-bold mb-4">Projects</h2>
              <p className="text-white/40">Handcrafted web applications for specific domains.</p>
            </div>
            <div className="text-white/20 hidden md:block">01</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <a
                key={project.title}
                href={project.link}
                className="group relative glass p-8 glass-hover glow overflow-hidden border-white/5 hover:border-white/10"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <Package className="text-white/60" size={24} />
                  </div>
                  <ArrowUpRight className="text-white/20 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" size={20} />
                </div>
                <h3 className="text-2xl font-bold mb-3">{project.title}</h3>
                <p className="text-white/40 mb-8 leading-relaxed">{project.description}</p>
                <div className="flex gap-2">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-white/5 text-white/40 border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section id="open-source" className="py-32 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16">
            <div>
              <h2 className="text-4xl font-bold mb-4">Open Source</h2>
              <p className="text-white/40">Contributions to the global engineering community.</p>
            </div>
            <div className="text-white/20 hidden md:block">02</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {openSource.map((pkg) => (
              <div key={pkg.name} className="glass border-white/5 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <FaGithub size={20} className="text-white/60" />
                    <h3 className="text-xl font-bold">{pkg.name}</h3>
                  </div>
                  <p className="text-white/40 mb-8 leading-relaxed">{pkg.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Star size={14} className="text-yellow-500/60" />
                      <span>{pkg.stars}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Users size={14} className="text-blue-500/60" />
                      <span>{pkg.contributors}</span>
                    </div>
                  </div>
                  <a
                    href={pkg.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    View Repo <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connect Footer */}
      <footer id="connect" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass p-12 flex flex-col md:flex-row items-center justify-between gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Stay Connected</h2>
              <p className="text-white/40">Open for collaborations and technical discussions.</p>
            </div>
            <div className="flex gap-4">
              <a
                href="https://github.com/laresbernardo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-all"
              >
                <FaGithub size={20} />
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/laresbernardo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-bold"
              >
                <FaLinkedin size={20} />
                LinkedIn
              </a>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-8 text-sm text-white/20">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="BERVOS" className="w-5 h-5 opacity-20" />
              <span>&copy; {new Date().getFullYear()} BERVOS. All rights reserved.</span>
            </div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white/40 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white/40 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
