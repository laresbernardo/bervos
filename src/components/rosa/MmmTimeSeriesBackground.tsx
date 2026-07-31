import React from 'react';
import { motion } from 'framer-motion';

// MMM Stacked Area Time Series Background Graphic
export const MmmTimeSeriesBackground: React.FC = () => {
  // Generate 30 data points across width 1200
  const points = React.useMemo(() => {
    const pts: { x: number; y0: number; y1: number; y2: number; y3: number; y4: number; y5: number }[] = [];
    const count = 31;
    const width = 1200;
    const step = width / (count - 1);
    const baseline = 580;

    for (let i = 0; i < count; i++) {
      const x = i * step;

      // Realistic stacked channel heights with high-frequency campaign peaks and valleys
      const h1 = 90 + 25 * Math.sin(i * 0.5) + 15 * Math.cos(i * 1.2);
      const h2 = 45 + 20 * Math.sin(i * 0.8 + 1.2) + 15 * Math.cos(i * 1.7);
      const h3 = 40 + 18 * Math.sin(i * 1.1 + 2.1) + 12 * Math.cos(i * 0.9);
      const h4 = 55 + 25 * Math.sin(i * 0.7 + 3.4) + 20 * Math.cos(i * 1.5);
      const h5 = 60 + 30 * Math.sin(i * 0.9 + 4.5) + 22 * Math.cos(i * 1.1);

      const y0 = baseline;
      const y1 = y0 - h1;
      const y2 = y1 - h2;
      const y3 = y2 - h3;
      const y4 = y3 - h4;
      const y5 = y4 - h5;

      pts.push({ x, y0, y1, y2, y3, y4, y5 });
    }
    return pts;
  }, []);

  // Helpers to generate SVG path strings for stacked filled polygon bands
  const buildBandPath = (topKey: 'y1' | 'y2' | 'y3' | 'y4' | 'y5', bottomKey: 'y0' | 'y1' | 'y2' | 'y3' | 'y4') => {
    const topPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p[topKey].toFixed(1)}`).join(' ');
    const bottomPath = points.slice().reverse().map((p) => `L ${p.x.toFixed(1)},${p[bottomKey].toFixed(1)}`).join(' ');
    return `${topPath} ${bottomPath} Z`;
  };

  const buildLinePath = (key: 'y1' | 'y2' | 'y3' | 'y4' | 'y5') => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p[key].toFixed(1)}`).join(' ');
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 z-0">
      <svg className="w-full h-full" viewBox="0 0 1200 650" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="stackBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#9f1239" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="stackDigital" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.40" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.20" />
          </linearGradient>
          <linearGradient id="stackSocial" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.40" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.20" />
          </linearGradient>
          <linearGradient id="stackSearch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="stackOffline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.50" />
            <stop offset="100%" stopColor="#be123c" stopOpacity="0.30" />
          </linearGradient>
        </defs>

        {/* Subtle Background Grid Lines */}
        <g stroke="currentColor" strokeWidth="0.5" className="text-white/5">
          {[100, 200, 300, 400, 500, 600].map((y) => (
            <line key={y} x1="0" y1={y} x2="1200" y2={y} strokeDasharray="4 8" />
          ))}
          {[150, 300, 450, 600, 750, 900, 1050].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="650" strokeDasharray="4 8" />
          ))}
        </g>

        {/* 5 Stacked Filled Area Bands (Bottom to Top) */}
        <motion.path
          d={buildBandPath('y1', 'y0')}
          fill="url(#stackBase)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.path
          d={buildBandPath('y2', 'y1')}
          fill="url(#stackDigital)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        />
        <motion.path
          d={buildBandPath('y3', 'y2')}
          fill="url(#stackSocial)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <motion.path
          d={buildBandPath('y4', 'y3')}
          fill="url(#stackSearch)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.path
          d={buildBandPath('y5', 'y4')}
          fill="url(#stackOffline)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />

        {/* Sleek Glowing Separator Stroke Lines */}
        <motion.path
          d={buildLinePath('y1')}
          stroke="#f43f5e"
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        <motion.path
          d={buildLinePath('y2')}
          stroke="#38bdf8"
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.1, ease: "easeInOut" }}
        />
        <motion.path
          d={buildLinePath('y3')}
          stroke="#34d399"
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeInOut" }}
        />
        <motion.path
          d={buildLinePath('y4')}
          stroke="#fbbf24"
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
        />
        <motion.path
          d={buildLinePath('y5')}
          stroke="#fda4af"
          strokeWidth="2.5"
          className="drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
};
