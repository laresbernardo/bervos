import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, X } from 'lucide-react';

interface TelemetryHUDProps {
  isSyncing: boolean;
  progress: number;
  stepText: string;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  isSyncing,
  progress,
  stepText
}) => {
  const [visible, setVisible] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(progress);

  const wasSyncingRef = useRef(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync display progress with prop
  useEffect(() => {
    setDisplayProgress(progress);
  }, [progress]);

  // Handle syncing lifecycle and completion delay cleanly without state feedback loops
  useEffect(() => {
    if (isSyncing) {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      wasSyncingRef.current = true;
      setVisible(true);
      setIsDone(false);
    } else if (wasSyncingRef.current) {
      // Transition from active sync -> synchronised completion
      wasSyncingRef.current = false;
      setIsDone(true);
      setDisplayProgress(100);

      // Auto-dismiss after 1.8 seconds of showing the success state
      dismissTimerRef.current = setTimeout(() => {
        setVisible(false);
        setIsDone(false);
        dismissTimerRef.current = null;
      }, 1800);
    }
  }, [isSyncing]);

  // Clear any pending timer on component unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const handleDismiss = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    wasSyncingRef.current = false;
    setVisible(false);
    setIsDone(false);
  };

  return (
    <>
      {/* 1. Nano-Progress Line: Fixed at the very top of the viewport (Zero CLS) */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_12px_rgba(99,102,241,0.9)]"
          initial={{ width: '0%', opacity: 0 }}
          animate={{
            width: `${displayProgress}%`,
            opacity: visible ? 1 : 0
          }}
          transition={{
            width: { duration: 0.3, ease: 'easeOut' },
            opacity: { duration: 0.3 }
          }}
        />
      </div>

      {/* 2. Floating Cyberpunk HUD Capsule: Fixed at bottom-right (Zero CLS) */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-6 right-4 sm:right-6 z-50 pointer-events-auto max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto"
          >
            <div className="tech-card border border-indigo-500/30 bg-[#0a0e1a]/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_20px_rgba(99,102,241,0.2)] p-4 rounded-2xl relative overflow-hidden font-mono">
              {/* Subtle top accent beam */}
              <div
                className={`absolute top-0 left-0 right-0 h-[1.5px] transition-colors duration-500 ${
                  isDone
                    ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-indigo-500 to-transparent'
                }`}
              />

              {/* Status Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isDone ? (
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 animate-in zoom-in-75 duration-200" />
                  ) : (
                    <Loader2 size={15} className="animate-spin text-indigo-400 shrink-0" />
                  )}
                  <span
                    className={`text-[10px] tracking-wider uppercase font-semibold transition-colors duration-300 ${
                      isDone ? 'text-emerald-400' : 'text-indigo-400'
                    }`}
                  >
                    {isDone ? '// SYSTEM_SYNCHRONISED' : '// TELEMETRY_PIPELINE'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold tabular-nums transition-colors duration-300 ${
                      isDone ? 'text-emerald-300' : 'text-indigo-300'
                    }`}
                  >
                    {displayProgress}%
                  </span>
                  <button
                    onClick={handleDismiss}
                    className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 rounded-md hover:bg-white/5 cursor-pointer"
                    title="Dismiss HUD"
                    aria-label="Dismiss HUD"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Step Description */}
              <p className="text-xs text-slate-300 font-mono truncate mt-2 mb-2.5">
                {isDone ? 'Telemetry pipeline synchronised & cache secured.' : stepText}
              </p>

              {/* Micro Progress Bar */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]'
                  }`}
                  animate={{ width: `${displayProgress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
