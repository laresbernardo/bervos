import { useState } from 'react';
import { ExternalLink, Star, Users, ArrowUpRight, X } from 'lucide-react';
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

const Modal = ({ 
  type, 
  onClose, 
  status, 
  data, 
  setData, 
  resetForm,
  onSubmit
}: { 
  type: 'privacy' | 'terms' | 'contact', 
  onClose: () => void,
  status: 'idle' | 'sending' | 'success' | 'error',
  data: any,
  setData: (data: any) => void,
  resetForm: () => void,
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass p-8 max-w-2xl w-full relative overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
        >
          <X size={20} />
        </button>
        <h2 className="text-3xl font-bold mb-6">
          {type === 'privacy' ? 'Privacy Policy' : type === 'terms' ? 'Terms of Service' : status === 'success' ? 'Message Sent' : 'Get in Touch'}
        </h2>
        <div className="text-white/60 leading-relaxed space-y-4 max-h-[70vh] overflow-y-auto pr-4 scrollbar-thin">
          {status === 'success' ? (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <Star size={40} fill="currentColor" />
                </motion.div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-white">Thank you for reaching out!</p>
                <p className="text-sm">Your message has been delivered directly to my inbox. <br />I'll get back to you as soon as possible.</p>
              </div>
              <button 
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
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
              <p><strong>Use of Tools:</strong> Our projects (Billio, Chessverse, tripitdown, Scribo) are provided for demonstration and individual use according to their respective licenses.</p>
              <p><strong>Liability:</strong> We provide our tools and information "as is" without warranties of any kind. BERVOS is not liable for any damages arising from the use of this site or its projects.</p>
              <p><strong>Changes:</strong> We reserve the right to modify these terms at any time without notice.</p>
            </>
          ) : (
            <form 
              onSubmit={onSubmit}
              className="space-y-6 pt-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40">Full Name</label>
                  <input 
                    name="name"
                    required
                    type="text" 
                    placeholder="John Doe"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    disabled={status === 'sending'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40">Email Address</label>
                  <input 
                    name="email"
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    disabled={status === 'sending'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40">Subject</label>
                  <input 
                    name="subject"
                    required
                    type="text" 
                    placeholder="Project Inquiry"
                    value={data.subject}
                    onChange={(e) => setData({ ...data, subject: e.target.value })}
                    disabled={status === 'sending'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40">Message</label>
                <textarea 
                  name="message"
                  required
                  rows={4}
                  placeholder="How can we help you?"
                  value={data.message}
                  onChange={(e) => setData({ ...data, message: e.target.value })}
                  disabled={status === 'sending'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors resize-none disabled:opacity-50"
                />
              </div>
              {status === 'error' && (
                <p className="text-red-400 text-xs font-bold text-center">Something went wrong. Please try again or email directly.</p>
              )}
              <button 
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-white/90 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5 disabled:opacity-50 disabled:cursor-wait"
              >
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

function App() {
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'contact' | null>(null);
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const resetContactForm = () => {
    setContactData({ name: '', email: '', subject: '', message: '' });
    setContactStatus('idle');
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
      } else {
        setContactStatus('error');
      }
    } catch (err) {
      setContactStatus('error');
    }
  };

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
                target="_blank"
                rel="noopener noreferrer"
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
      <footer id="connect" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass p-12 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden"
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

          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 text-sm text-white/20">
            <div className="flex items-center gap-4">
              <img src="/bervos-logo.png" alt="BERVOS" className="w-6 h-6 opacity-40 invert" />
              <span className="font-medium tracking-wide">&copy; {new Date().getFullYear()} BERVOS</span>
            </div>
            <div className="flex gap-12 font-bold uppercase tracking-widest text-[10px]">
              <button onClick={() => setModalType('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy</button>
              <button onClick={() => setModalType('terms')} className="hover:text-white transition-colors cursor-pointer">Terms</button>
              <button onClick={() => setModalType('contact')} className="hover:text-white transition-colors cursor-pointer">Contact</button>
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

export default App;
