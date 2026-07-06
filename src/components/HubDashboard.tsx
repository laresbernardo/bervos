import React, { useState, useEffect, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';
import { InitiativeCard } from './InitiativeCard';
import type { InitiativeMetric } from './InitiativeCard';
import { RefreshCw, LogOut, Users, Download, ShieldAlert, Star, FolderGit } from 'lucide-react';

interface HubDashboardProps {
  user: User;
}

export const HubDashboard: React.FC<HubDashboardProps> = ({ user }) => {
  const [metrics, setMetrics] = useState<InitiativeMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const endpoint = isManual ? '/api/metrics?refresh=true' : '/api/metrics';
      const res = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Forbidden: Your account does not have access to this hub.');
        }
        throw new Error(`Failed to load metrics (Status: ${res.status})`);
      }

      const data = await res.json();
      setMetrics(data);
      const cache = res.headers.get('X-Cache-Status');
      setCacheStatus(cache);

      // If the cache was stale, the backend triggered a background update.
      // Re-fetch after 4 seconds to get the newly generated data.
      if (cache === 'STALE') {
        console.log('[SWR] Cache is stale. Scheduling a re-fetch in 4 seconds...');
        setTimeout(async () => {
          try {
             const freshToken = await user.getIdToken();
             const freshRes = await fetch('/api/metrics', {
               headers: { 'Authorization': `Bearer ${freshToken}` }
             });
             if (freshRes.ok) {
               const freshData = await freshRes.json();
               setMetrics(freshData);
               setCacheStatus(freshRes.headers.get('X-Cache-Status') || 'HIT');
               console.log('[SWR] Metrics updated successfully.');
             }
          } catch (e) {
            console.error('[SWR] Silent re-fetch failed:', e);
          }
        }, 4000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred while loading dashboard metrics.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMetrics();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMetrics]);

  const handleSignOut = () => {
    if (auth) signOut(auth);
  };

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('LAST_UPDATED');

  // Aggregated Stats
  const totalProjectsCount = metrics.length;
  const webProjectsCount = metrics.filter(m => m.type === 'SoftwareApplication' && m.applicationCategory !== 'UtilitiesApplication').length;
  const desktopProjectsCount = metrics.filter(m => m.type === 'SoftwareApplication' && m.applicationCategory === 'UtilitiesApplication').length;
  const ossProjectsCount = metrics.filter(m => m.type === 'SoftwareSourceCode').length;

  const totalUsers = metrics.reduce((sum, m) => sum + (m.totalUsers || 0), 0);
  const totalActive30d = metrics.reduce((sum, m) => sum + (m.active30d || 0), 0);

  const totalDownloads = metrics
    .filter(m => m.type !== 'SoftwareSourceCode')
    .reduce((sum, m) => sum + (m.downloads || 0), 0);

  const totalStars = metrics
    .filter(m => m.type === 'SoftwareSourceCode')
    .reduce((sum, m) => sum + (m.stars || 0), 0);

  // Sorting helper functions
  const getSortDate = (item: InitiativeMetric) => {
    if (item.commits && item.commits.length > 0 && item.commits[0].timestamp) {
      const time = new Date(item.commits[0].timestamp).getTime();
      if (!isNaN(time)) return time;
    }
    if (item.lastUpdated) {
      const time = new Date(item.lastUpdated).getTime();
      if (!isNaN(time)) return time;
    }
    return 0;
  };

  const getUsersCount = (item: InitiativeMetric) => {
    if (item.type === 'SoftwareApplication') {
      if (item.applicationCategory === 'UtilitiesApplication') {
        return item.downloads || 0;
      }
      return item.totalUsers || 0;
    }
    return 0;
  };

  // Search, Filter, and Sort logic
  const filteredAndSorted = metrics
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      if (filterType === 'WEB') {
        return matchesSearch && item.type === 'SoftwareApplication' && item.applicationCategory !== 'UtilitiesApplication';
      }
      if (filterType === 'DESKTOP') {
        return matchesSearch && item.type === 'SoftwareApplication' && item.applicationCategory === 'UtilitiesApplication';
      }
      if (filterType === 'OS') {
        return matchesSearch && item.type === 'SoftwareSourceCode';
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'LAST_UPDATED') {
        return getSortDate(b) - getSortDate(a);
      }
      if (sortBy === 'USERS') {
        return getUsersCount(b) - getUsersCount(a);
      }
      if (sortBy === 'STARS') {
        return (b.stars || 0) - (a.stars || 0);
      }
      if (sortBy === 'NAME') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 py-24 px-6 md:px-12 selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="mono-label !text-indigo-400">System_Control // Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black glow-text tracking-tighter uppercase">BERVOS Hub</h1>
            <p className="text-slate-400 font-mono text-xs uppercase tracking-wider">
              Operator: <span className="text-indigo-400 font-bold">{user.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Cache Status Badge */}
            {cacheStatus && (
              <div 
                className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] tracking-wider uppercase ${
                  cacheStatus === 'HIT' 
                    ? 'bg-green-500/5 text-green-400 border-green-500/20' 
                    : cacheStatus === 'STALE'
                    ? 'bg-yellow-500/5 text-yellow-400 border-yellow-500/20 animate-pulse'
                    : 'bg-indigo-500/5 text-indigo-400 border-indigo-500/20'
                }`}
                title="SWR Cache Status. HIT = Served from cache. STALE = Served cache and refreshing backend. MISS = Cache empty."
              >
                CACHE_{cacheStatus}
              </div>
            )}

            <button
              onClick={() => fetchMetrics(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:border-indigo-500/40 rounded-xl text-xs font-mono uppercase tracking-widest text-slate-300 hover:text-indigo-400 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh Stats'}
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-xs font-mono uppercase tracking-widest text-red-400 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {error && (
          <div className="tech-card border-red-500/30 p-8 bg-red-500/[0.02] flex items-start gap-4">
            <ShieldAlert size={28} className="text-red-400 shrink-0" />
            <div className="space-y-1">
              <span className="mono-label !text-red-400">// CONTROL_SYSTEM_ERROR</span>
              <h4 className="text-lg font-bold text-white uppercase tracking-wider">Metrics Pipeline Failure</h4>
              <p className="text-slate-400 text-sm font-mono">{error}</p>
              <button 
                onClick={() => fetchMetrics()} 
                className="mt-4 px-4 py-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg text-xs font-mono uppercase text-white"
              >
                Retry Request
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-8">
            {/* Skeletal Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="tech-card p-6 bg-white/[0.01] border-white/5 h-28 animate-pulse" />
              ))}
            </div>
            {/* Skeletal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="tech-card p-8 h-96 bg-white/[0.01] border-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        ) : !error && (
          <div className="space-y-12">
            
            {/* High-Level Summary Analytics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="tech-card p-6 flex flex-col justify-between group min-h-[130px]">
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-1">
                    <span className="mono-label !text-indigo-400">Total Projects</span>
                    <h3 className="text-3xl font-black text-white font-display tracking-tight">{totalProjectsCount}</h3>
                  </div>
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <FolderGit size={20} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1 pt-4 mt-3 border-t border-white/5 text-[9px] font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>WEB <span className="text-white font-bold">{webProjectsCount}</span></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    <span>DESKTOP <span className="text-white font-bold">{desktopProjectsCount}</span></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    <span>OSS <span className="text-white font-bold">{ossProjectsCount}</span></span>
                  </div>
                </div>
              </div>

              <div className="tech-card p-6 flex flex-col justify-between group min-h-[130px]">
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-1">
                    <span className="mono-label !text-violet-400">Total Users</span>
                    <h3 className="text-3xl font-black text-white font-display tracking-tight">{totalUsers.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl">
                    <Users size={20} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-4 mt-3 border-t border-white/5 text-[9px] font-mono text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  <span>ACTIVE (30D): <strong className="text-white">{totalActive30d.toLocaleString()}</strong></span>
                </div>
              </div>

              <div className="tech-card p-6 flex flex-col justify-between group min-h-[130px]">
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-1">
                    <span className="mono-label !text-cyan-400">Downloads</span>
                    <h3 className="text-3xl font-black text-white font-display tracking-tight">{totalDownloads.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
                    <Download size={20} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-4 mt-3 border-t border-white/5 text-[9px] font-mono text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span>TELEMETRY: <strong className="text-white">ACTIVE SOLUTIONS</strong></span>
                </div>
              </div>

              <div className="tech-card p-6 flex flex-col justify-between group min-h-[130px]">
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-1">
                    <span className="mono-label !text-yellow-400">GitHub Stars</span>
                    <h3 className="text-3xl font-black text-white font-display tracking-tight">{totalStars.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl">
                    <Star size={20} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-4 mt-3 border-t border-white/5 text-[9px] font-mono text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  <span>REPOSITORIES: <strong className="text-white">{ossProjectsCount} TRACKED</strong></span>
                </div>
              </div>

            </div>

            {/* Search, Filter, and Sort Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              {/* Search */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search solutions, repositories, or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono"
                />
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </span>
              </div>

              {/* Filters & Sorting */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Type Filter Buttons */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
                      filterType === 'ALL' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setFilterType('WEB')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
                      filterType === 'WEB' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    WEB
                  </button>
                  <button
                    onClick={() => setFilterType('OS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
                      filterType === 'OS' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    OSS
                  </button>
                  <button
                    onClick={() => setFilterType('DESKTOP')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
                      filterType === 'DESKTOP' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    DESKTOP
                  </button>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer border-0"
                  >
                    <option value="LAST_UPDATED" className="bg-[#0f131a]">LAST UPDATED</option>
                    <option value="USERS" className="bg-[#0f131a]">ACTIVE / USERS</option>
                    <option value="NAME" className="bg-[#0f131a]">NAME (A-Z)</option>
                    <option value="STARS" className="bg-[#0f131a]">GITHUB STARS</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dashboard Grid */}
            {filteredAndSorted.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSorted.map((item) => (
                  <InitiativeCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="tech-card p-12 text-center bg-white/[0.01] border-white/5">
                <p className="text-slate-500 font-mono text-sm">NO INITIATIVES FOUND MATCHING THE SEARCH OR FILTER CRITERIA</p>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
