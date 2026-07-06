import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';

interface HubLoginProps {
  onBackToHome: () => void;
}

export const HubLogin: React.FC<HubLoginProps> = ({ onBackToHome }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!auth || !googleProvider) {
        throw new Error('Firebase Auth is not configured. Missing environment variables.');
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign In Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication process interrupted.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b12] flex items-center justify-center p-6 selection:bg-indigo-500/30">
      
      {/* Background Graphic Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-[20%] left-0 w-full h-[1px] bg-indigo-500" />
        <div className="absolute top-[80%] left-0 w-full h-[1px] bg-indigo-500" />
        <div className="absolute left-[30%] top-0 w-[1px] h-full bg-indigo-500" />
        <div className="absolute left-[70%] top-0 w-[1px] h-full bg-indigo-500" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="tech-card p-10 max-w-md w-full relative z-10 space-y-8 bg-[#0c121d]"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        
        {/* Header Warning HUD */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Shield size={32} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="mono-label !text-indigo-400">System_Lock // Protocol_Auth</span>
            <h2 className="text-3xl font-black tracking-tight text-white uppercase glow-text">BERVOS HUB</h2>
          </div>
        </div>

        {/* Console Security Message */}
        <div className="border border-white/5 bg-white/[0.01] rounded-xl p-5 space-y-3 font-mono text-[11px] leading-relaxed text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-400 font-bold">WARNING: SECURE AREA</span>
          </div>
          <p>This console contains live production telemetry streams and administrative controllers for the BERVOS ecosystem solutions.</p>
          <p>Access is restricted strictly to the authorized administrator account.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 rounded-lg text-xs font-mono text-center">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="group flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition-all hover:scale-[1.01] active:scale-95 shadow-xl shadow-indigo-500/15 cursor-pointer disabled:opacity-50"
        >
          <FaGoogle className="text-lg transition-transform group-hover:scale-110" />
          {loading ? 'AUTHENTICATING...' : 'SIGN IN WITH GOOGLE'}
        </button>

        {/* Back Link */}
        <div className="text-center pt-2">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 font-mono text-[10px] text-slate-500 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft size={12} />
            Return to main site
          </button>
        </div>

      </motion.div>
    </div>
  );
};
