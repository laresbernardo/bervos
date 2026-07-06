import React from 'react';
import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'framer-motion';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

interface HubAccessDeniedProps {
  user: User;
  onBackToHome: () => void;
}

export const HubAccessDenied: React.FC<HubAccessDeniedProps> = ({ user, onBackToHome }) => {
  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen bg-[#080b12] flex items-center justify-center p-6 selection:bg-indigo-500/30">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="tech-card p-10 max-w-md w-full relative z-10 space-y-8 bg-[#0c121d] border-red-500/20"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-1">
            <span className="mono-label !text-red-400">System_Denial // Code_403</span>
            <h2 className="text-3xl font-black tracking-tight text-white uppercase glow-text">Access Denied</h2>
          </div>
        </div>

        <div className="border border-red-500/10 bg-red-500/[0.01] rounded-xl p-5 space-y-3 font-mono text-[11px] leading-relaxed text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-red-400 font-bold">UNAUTHORIZED OPERATOR</span>
          </div>
          <p>You have successfully authenticated via Google Sign-In as:</p>
          <p className="text-red-400 font-bold break-all bg-red-500/5 p-2 rounded border border-red-500/10 text-center">{user.email}</p>
          <p>However, your identity is not registered in the access control list. Administrative dashboards are locked.</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-black transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <LogOut size={16} />
            TRY ANOTHER ACCOUNT
          </button>

          <button
            onClick={onBackToHome}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 font-black transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} />
            RETURN TO HOME
          </button>
        </div>

      </motion.div>
    </div>
  );
};
