import React, { useState, useEffect, useCallback, useRef } from 'react';
import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';
import { InitiativeCard } from './InitiativeCard';
import type { InitiativeMetric } from './InitiativeCard';
import { RefreshCw, LogOut, Users, Download, ShieldAlert, Star, FolderGit, X, Search, Loader2, List } from 'lucide-react';
import ecosystem from '../data/ecosystem.json';

const UserAvatar: React.FC<{ src?: string; name: string; email: string }> = ({ src, name, email }) => {
  const [error, setError] = useState(false);
  const initials = (name || email || '?').substring(0, 2).toUpperCase();
  if (src && !error) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setError(true)}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <span className="text-xs font-bold text-indigo-300 uppercase">
      {initials}
    </span>
  );
};

const getStaticMetrics = (): InitiativeMetric[] => {
  const { projects, openSource } = ecosystem;
  
  const staticProj = projects.map((p) => {
    const isOS = p.category === 'oss' || (p.link.includes('github.com/laresbernardo') && !p.link.includes('github.io'));
    const type = isOS ? ('SoftwareSourceCode' as const) : ('SoftwareApplication' as const);
    
    return {
      id: p.title.toLowerCase(),
      name: p.title,
      type,
      url: p.link,
      description: p.description,
      version: p.version,
      applicationCategory: p.applicationCategory,
    };
  });

  const staticOS = openSource.map((o) => ({
    id: o.name.toLowerCase(),
    name: o.name,
    type: 'SoftwareSourceCode' as const,
    url: o.link,
    description: o.description,
  }));

  return [...staticProj, ...staticOS] as InitiativeMetric[];
};

interface HubDashboardProps {
  user: User;
}

export const HubDashboard: React.FC<HubDashboardProps> = ({ user }) => {
  const [metrics, setMetrics] = useState<InitiativeMetric[]>(() => {
    try {
      const cached = localStorage.getItem('bervos_metrics');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return getStaticMetrics();
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('bervos_metrics');
      if (cached) {
        const parsed = JSON.parse(cached);
        return !parsed || parsed.length === 0;
      }
      return true;
    } catch (e) {
      return true;
    }
  });
  const [loadingStepText, setLoadingStepText] = useState('Establishing connection with secure gateway...');
  const [loadingProgress, setLoadingProgress] = useState(10);

  useEffect(() => {
    if (!loading) {
      setLoadingProgress(100);
      return;
    }
    setLoadingProgress(15);
    setLoadingStepText('Initializing secure session gateway...');

    const steps = [
      { text: 'Resolving BERVOS Hub configuration...', progress: 30 },
      { text: 'Accessing Firebase Admin SDK database references...', progress: 50 },
      { text: 'Polling live GitHub API repositories for stars & issues...', progress: 70 },
      { text: 'Compiling project backlogs and commit histories...', progress: 85 },
      { text: 'Securing local cache and finalizing pipeline...', progress: 95 }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoadingStepText(steps[currentStep].text);
        setLoadingProgress(steps[currentStep].progress);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [loading]);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string | null>(() => {
    try {
      return localStorage.getItem('bervos_cache_status');
    } catch (e) {
      return null;
    }
  });
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingProjectIds, setRefreshingProjectIds] = useState<Record<string, boolean>>({});
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [usersList, setUsersList] = useState<Array<{
    email: string;
    displayName: string;
    photoURL: string;
    projects: string[];
    lastActive: string;
    firstActive: string;
    projectDetails?: Record<string, { firstActive: string; lastActive: string }>;
  }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersSearch, setUsersSearch] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
  const [usersSortBy, setUsersSortBy] = useState<'LAST_LOGIN' | 'SIGNUP'>('LAST_LOGIN');
  const [backlogModalProject, setBacklogModalProject] = useState<string | null>(null);
  const [backlogModalContent, setBacklogModalContent] = useState<string>('');
  const [backlogModalUpdatedAt, setBacklogModalUpdatedAt] = useState<string>('');
  const backlogFetchedRef = useRef(false);

  const GIT_REPO_MAP: Record<string, string> = {
    'billio': 'laresbernardo/Billio',
    'chessverse': 'laresbernardo/Chessverse',
    'tripitdown': 'laresbernardo/tripitdown',
    'aura': 'laresbernardo/aura',
    'scribo': 'laresbernardo/Scribo',
    'laresdj': 'laresbernardo/laresdj.com',
    'pinmage': 'laresbernardo/pinmage',
    'tonaly': 'laresbernardo/tonaly',
    'yt2mp3': 'laresbernardo/YT2MP3',
    'bervos': 'laresbernardo/bervos'
  };

  const getRepoPath = useCallback((name: string): string | null => {
    const n = name.toLowerCase();
    if (GIT_REPO_MAP[n]) return GIT_REPO_MAP[n];
    const project = metrics.find(m => m.name === name);
    if (project?.url?.includes('github.com')) {
      const m = project.url.match(/github\.com\/([^/]+\/[^/]+?)(\.git|\/|$)/);
      if (m) return m[1];
    }
    return null;
  }, [metrics]);

  useEffect(() => {
    if (backlogFetchedRef.current || metrics.length === 0) return;
    const needsBacklog = metrics.filter(m => m.backlogCount === undefined);
    if (needsBacklog.length === 0) {
      backlogFetchedRef.current = true;
      return;
    }

    backlogFetchedRef.current = true;
    Promise.all(needsBacklog.map(async (project) => {
      const repoPath = getRepoPath(project.name);
      if (!repoPath) return null;
      const branches = ['main', 'master'];
      for (const branch of branches) {
        try {
          const res = await fetch(`https://raw.githubusercontent.com/${repoPath}/${branch}/BACKLOG.md`);
          if (res.ok) {
            const content = await res.text();
            const lines = content.split('\n');
            const count = lines.filter(l => l.trim().startsWith('- ')).length;
            return { id: project.id, count, content, updatedAt: '' };
          }
        } catch (e) { }
      }
      for (const branch of branches) {
        try {
          const res = await fetch(`https://api.github.com/repos/${repoPath}/contents/BACKLOG.md?ref=${branch}`, {
            headers: { 'Accept': 'application/vnd.github.v3.raw', 'User-Agent': 'bervos-hub' }
          });
          if (res.ok) {
            const content = await res.text();
            const lines = content.split('\n');
            const count = lines.filter(l => l.trim().startsWith('- ')).length;
            return { id: project.id, count, content, updatedAt: '' };
          }
        } catch (e) { }
      }
      return { id: project.id, count: 0, content: '', updatedAt: '' };
    })).then(results => {
      const valid = results.filter(Boolean) as Array<{ id: string; count: number; content: string; updatedAt: string }>;
      const toUpdate = valid.filter(r => r.count > 0 || r.content !== '');
      if (toUpdate.length > 0) {
        setMetrics(prev => prev.map(m => {
          const found = toUpdate.find(v => v.id === m.id);
          return found ? { ...m, backlogCount: found.count, backlogContent: found.content } : m;
        }));
      }
    });
  }, [metrics, getRepoPath]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to load users list (Status: ${res.status})`);
      }
      const data = await res.json();
      setUsersList(data);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'An error occurred while loading users list.');
    } finally {
      setLoadingUsers(false);
    }
  }, [user]);

  const handleOpenUsersModal = useCallback((projectName = 'ALL') => {
    setSelectedProjectFilter(projectName);
    setIsUsersModalOpen(true);
    fetchUsers();
  }, [fetchUsers]);

  const handleShowBacklog = useCallback((projectId: string) => {
    const project = metrics.find(m => m.id === projectId);
    if (project) {
      setBacklogModalContent(project.backlogContent || '');
      setBacklogModalProject(project.name);
      setBacklogModalUpdatedAt(project.backlogUpdatedAt || '');
    }
  }, [metrics]);

  const fetchMetrics = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }

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
      try {
        localStorage.setItem('bervos_metrics', JSON.stringify(data));
        if (cache) {
          localStorage.setItem('bervos_cache_status', cache);
        }
      } catch (e) {
        console.error('Failed to cache metrics in localStorage', e);
      }

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
              const freshCache = freshRes.headers.get('X-Cache-Status') || 'HIT';
              setCacheStatus(freshCache);
              try {
                localStorage.setItem('bervos_metrics', JSON.stringify(freshData));
                localStorage.setItem('bervos_cache_status', freshCache);
              } catch (e) {
                console.error('Failed to cache metrics in localStorage', e);
              }
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

  const refreshProject = useCallback(async (projectId: string) => {
    setRefreshingProjectIds(prev => ({ ...prev, [projectId]: true }));
    try {
      const idToken = await user.getIdToken();
      const projectObj = metrics.find(m => m.id === projectId);
      const queryParam = projectObj ? encodeURIComponent(projectObj.name) : encodeURIComponent(projectId);
      const res = await fetch(`/api/metrics?refresh=true&project=${queryParam}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to refresh project (Status: ${res.status})`);
      }

      const data = await res.json();
      setMetrics(data);
      const freshCache = res.headers.get('X-Cache-Status') || 'MISS';
      setCacheStatus(freshCache);
      try {
        localStorage.setItem('bervos_metrics', JSON.stringify(data));
        localStorage.setItem('bervos_cache_status', freshCache);
      } catch (e) {
        console.error('Failed to cache metrics in localStorage', e);
      }
    } catch (err) {
      console.error('[Dashboard] Project refresh failed:', err);
      const msg = err instanceof Error ? err.message : 'Failed to refresh project metrics.';
      alert(msg);
    } finally {
      setRefreshingProjectIds(prev => ({ ...prev, [projectId]: false }));
    }
  }, [user, metrics]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMetrics();
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMetrics, fetchUsers]);

  const handleSignOut = () => {
    if (auth) signOut(auth);
  };

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('LAST_UPDATED');
  const [backlogFilter, setBacklogFilter] = useState(false);

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
      if (backlogFilter) {
        return matchesSearch && (item.backlogCount || 0) > 0;
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

  // Check if any filter or search query is active to label stats as filtered
  const isFiltered = search !== '' || filterType !== 'ALL' || backlogFilter;

  // Check if we have active telemetry records loaded (e.g. from local storage cache)
  const hasTelemetry = metrics.some(m => m.stars !== undefined || m.totalUsers !== undefined || m.downloads !== undefined);

  // Aggregated Stats
  const totalProjectsCount = filteredAndSorted.length;
  const webProjectsCount = filteredAndSorted.filter(m => m.type === 'SoftwareApplication' && m.applicationCategory !== 'UtilitiesApplication').length;
  const desktopProjectsCount = filteredAndSorted.filter(m => m.type === 'SoftwareApplication' && m.applicationCategory === 'UtilitiesApplication').length;
  const ossProjectsCount = filteredAndSorted.filter(m => m.type === 'SoftwareSourceCode').length;

  const totalUsers = filteredAndSorted.reduce((sum, m) => sum + (m.totalUsers || 0), 0);
  const totalActive30d = filteredAndSorted.reduce((sum, m) => sum + (m.active30d || 0), 0);

  const totalDownloads = filteredAndSorted
    .filter(m => m.type !== 'SoftwareSourceCode')
    .reduce((sum, m) => sum + (m.downloads || 0), 0);

  const totalStars = filteredAndSorted
    .filter(m => m.type === 'SoftwareSourceCode')
    .reduce((sum, m) => sum + (m.stars || 0), 0);

  const downloadSolutionsCount = filteredAndSorted
    .filter(m => m.type !== 'SoftwareSourceCode' && (m.downloads || 0) > 0).length;

  // Dynamic unique users logic for summary analytics card
  const filteredUsersList = usersList.filter(u => {
    const matchesSearch = !search ||
      (u.displayName && u.displayName.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      u.projects.some(p => p.toLowerCase().includes(search.toLowerCase()));

    const matchesProject = filterType === 'ALL' ||
      u.projects.some(projName => {
        const proj = metrics.find(m => m.name === projName);
        if (!proj) return false;
        if (filterType === 'WEB') return proj.type === 'SoftwareApplication' && proj.applicationCategory !== 'UtilitiesApplication';
        if (filterType === 'DESKTOP') return proj.type === 'SoftwareApplication' && proj.applicationCategory === 'UtilitiesApplication';
        if (filterType === 'OS') return proj.type === 'SoftwareSourceCode';
        return true;
      });

    return matchesSearch && matchesProject;
  });

  const uniqueUsersFiltered = filteredUsersList.length;
  const uniqueActive30dFiltered = filteredUsersList.filter(u => {
    const lastActiveTime = Date.parse(u.lastActive);
    if (isNaN(lastActiveTime)) return false;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return lastActiveTime >= thirtyDaysAgo;
  }).length;



  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 py-6 md:py-10 px-4 sm:px-6 md:px-12 selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center justify-center p-2 bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-white/10 rounded-xl transition-all cursor-pointer group"
              title="Back to website"
            >
              <img src="/logo.svg" alt="BERVOS Logo" className="h-7 w-auto brightness-200 group-hover:scale-105 transition-all duration-300" />
            </a>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="mono-label !text-indigo-400">System_Control // {__APP_VERSION__}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black glow-text tracking-tighter uppercase leading-none">BERVOS Hub</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Cache Status Badge */}
            {cacheStatus && cacheStatus !== 'MISS' && (
              <div
                className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] tracking-wider uppercase ${cacheStatus === 'HIT'
                  ? 'bg-green-500/5 text-green-400 border-green-500/20'
                  : cacheStatus === 'STALE'
                    ? 'bg-yellow-500/5 text-yellow-400 border-yellow-500/20 animate-pulse'
                    : 'bg-indigo-500/5 text-indigo-400 border-indigo-500/20'
                  }`}
                title="SWR Cache Status. HIT = Served from cache. STALE = Served cache and refreshing backend. MISS = Cache empty."
              >
                <span className="hidden sm:inline">CACHE_</span>{cacheStatus}
              </div>
            )}

            <button
              onClick={() => fetchMetrics(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:border-indigo-500/40 rounded-xl text-xs font-mono uppercase tracking-widest text-slate-300 hover:text-indigo-400 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
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

        {/* Telemetry Handshake Status (Progress Log) */}
        {loading && (
          <div className="tech-card border-indigo-500/20 bg-indigo-500/[0.01] p-4.5 font-mono text-xs text-indigo-300 flex items-center gap-3">
            <Loader2 size={16} className="animate-spin text-indigo-400 shrink-0" />
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-indigo-500">//</span>
                <span className="text-slate-200">{loadingStepText}</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                <span className="text-[10px] text-indigo-400/80">{loadingProgress}%</span>
                <div className="w-full sm:w-48 bg-white/5 border border-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading / Error States */}
        {error && !hasTelemetry && (
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

        {error && hasTelemetry && (
          <div className="flex items-center justify-between gap-3 px-4.5 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-mono">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="shrink-0" />
              <span>[SYSTEM_ALERT] Telemetry update failed: {error}. Serving cached records.</span>
            </div>
            <button
              onClick={() => fetchMetrics(true)}
              disabled={refreshing}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 hover:border-red-500/40 text-red-400 rounded-lg border border-white/10 uppercase text-[9px] tracking-wider transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {refreshing ? (
                <>
                  <Loader2 size={10} className="animate-spin text-red-400" />
                  Retrying...
                </>
              ) : (
                'Retry'
              )}
            </button>
          </div>
        )}

        {loading && metrics.length === 0 ? (
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
        ) : (
          <div className="space-y-12">

            {/* Search, Filter, and Sort Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              {/* Search */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search solutions, repositories, or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono"
                />
                <span className="absolute left-3.5 top-3.5 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </span>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filters & Sorting */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Type Filter Buttons */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${filterType === 'ALL' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setFilterType('WEB')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${filterType === 'WEB' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    WEB
                  </button>
                  <button
                    onClick={() => setFilterType('OS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${filterType === 'OS' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    OSS
                  </button>
                  <button
                    onClick={() => setFilterType('DESKTOP')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${filterType === 'DESKTOP' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    DESKTOP
                  </button>
                </div>

                {metrics.some(m => (m.backlogCount || 0) > 0) && (
                  <button
                    onClick={() => setBacklogFilter(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer border ${backlogFilter
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200 border-white/5'
                      }`}
                    title="Show only projects with backlog items"
                  >
                    <span>w/BACKLOG</span>
                    <span className={`text-[9px] ${backlogFilter ? 'text-amber-300' : 'text-slate-500'}`}>
                      ({metrics.filter(m => (m.backlogCount || 0) > 0).length})
                    </span>
                  </button>
                )}

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

            {/* High-Level Summary Analytics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

              <div className="tech-card p-4.5 flex flex-col justify-between group min-h-[110px]">
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-0.5">
                    <span className="mono-label !text-indigo-400">
                      Total Projects {isFiltered && <span className="text-[9px] text-amber-500/80 normal-case ml-1 font-mono font-normal tracking-normal">(Filtered)</span>}
                    </span>
                    <h3 className="text-4xl md:text-5xl font-black text-white font-display tracking-tight leading-none">{totalProjectsCount}</h3>
                  </div>
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
                    <FolderGit size={18} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1 pt-3 mt-2.5 border-t border-white/5 text-[9px] font-mono text-slate-400">
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

              <div className="tech-card p-4.5 flex flex-col justify-between group min-h-[110px]">
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-0.5">
                    <span className="mono-label !text-amber-400">
                      Backlog Items {isFiltered && <span className="text-[9px] text-amber-500/80 normal-case ml-1 font-mono font-normal tracking-normal">(Filtered)</span>}
                    </span>
                    <h3 className="text-4xl md:text-5xl font-black text-white font-display tracking-tight leading-none">
                      {loading && metrics.every(m => m.backlogCount === undefined) ? (
                        <span className="inline-block w-16 h-8 bg-white/5 border border-white/10 rounded-lg animate-pulse mt-1" />
                      ) : (
                        metrics.reduce((s, m) => s + (m.backlogCount || 0), 0)
                      )}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shrink-0">
                    <List size={18} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-3 mt-2.5 border-t border-white/5 text-[9px] font-mono text-slate-400">
                  {loading && metrics.every(m => m.backlogCount === undefined) ? (
                    <span className="inline-block w-24 h-3 bg-white/5 rounded animate-pulse" />
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>PROJECTS: <strong className="text-white">{metrics.filter(m => (m.backlogCount || 0) > 0).length}</strong> WITH ITEMS</span>
                    </>
                  )}
                </div>
              </div>

              <div
                onClick={() => !loading && handleOpenUsersModal('ALL')}
                className={`tech-card p-4.5 flex flex-col justify-between group min-h-[110px] ${loading ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]'} transition-all`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-0.5">
                    <span className="mono-label !text-violet-400">
                      Total Users {isFiltered && <span className="text-[9px] text-amber-500/80 normal-case ml-1 font-mono font-normal tracking-normal">(Filtered)</span>}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-4xl md:text-5xl font-black text-white font-display tracking-tight leading-none">
                        {loading && usersList.length === 0 ? (
                          <span className="inline-block w-24 h-8 bg-white/5 border border-white/10 rounded-lg animate-pulse mt-1" />
                        ) : (
                          usersList.length > 0 ? uniqueUsersFiltered.toLocaleString() : totalUsers.toLocaleString()
                        )}
                      </h3>
                      {!loading && usersList.length > 0 && (
                        <span className="text-[9px] text-slate-400 font-mono">
                          UNIQ ({totalUsers.toLocaleString()} SUM)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl group-hover:bg-violet-500/20 transition-colors shrink-0">
                    <Users size={18} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-3 mt-2.5 border-t border-white/5 text-[9px] font-mono text-slate-400">
                  {loading && usersList.length === 0 ? (
                    <span className="inline-block w-36 h-3 bg-white/5 rounded animate-pulse" />
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                      <span>
                        ACTIVE (30D): <strong className="text-white">{usersList.length > 0 ? uniqueActive30dFiltered.toLocaleString() : totalActive30d.toLocaleString()}</strong>
                        {usersList.length > 0 && (
                          <span className="text-slate-500 ml-1.5">
                            UNIQ ({totalActive30d.toLocaleString()} SUM)
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="tech-card p-4.5 flex flex-col justify-between group min-h-[110px]">
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-0.5">
                    <span className="mono-label !text-cyan-400">
                      Downloads {isFiltered && <span className="text-[9px] text-amber-500/80 normal-case ml-1 font-mono font-normal tracking-normal">(Filtered)</span>}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-4xl md:text-5xl font-black text-white font-display tracking-tight leading-none">
                        {loading && metrics.every(m => m.downloads === undefined) ? (
                          <span className="inline-block w-24 h-8 bg-white/5 border border-white/10 rounded-lg animate-pulse mt-1" />
                        ) : (
                          totalDownloads.toLocaleString()
                        )}
                      </h3>
                      {!loading && (
                        <span className="text-[9px] text-slate-400 font-mono">
                          FROM {downloadSolutionsCount} {downloadSolutionsCount === 1 ? 'SOLUTION' : 'SOLUTIONS'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl shrink-0">
                    <Download size={18} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-3 mt-2.5 border-t border-white/5 text-[9px] font-mono text-slate-400">
                  {loading && metrics.every(m => m.downloads === undefined) ? (
                    <span className="inline-block w-32 h-3 bg-white/5 rounded animate-pulse" />
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      <span>TELEMETRY: <strong className="text-white">ACTIVE SOLUTIONS</strong></span>
                    </>
                  )}
                </div>
              </div>

              <div className="tech-card p-4.5 flex flex-col justify-between group min-h-[110px]">
                <div className="flex items-center justify-between w-full">
                  <div className="space-y-0.5">
                    <span className="mono-label !text-yellow-400">
                      GitHub Stars {isFiltered && <span className="text-[9px] text-amber-500/80 normal-case ml-1 font-mono font-normal tracking-normal">(Filtered)</span>}
                    </span>
                    <h3 className="text-4xl md:text-5xl font-black text-white font-display tracking-tight leading-none">
                      {loading && metrics.every(m => m.stars === undefined) ? (
                        <span className="inline-block w-16 h-8 bg-white/5 border border-white/10 rounded-lg animate-pulse mt-1" />
                      ) : (
                        totalStars.toLocaleString()
                      )}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl shrink-0">
                    <Star size={18} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-3 mt-2.5 border-t border-white/5 text-[9px] font-mono text-slate-400">
                  {loading && metrics.every(m => m.stars === undefined) ? (
                    <span className="inline-block w-36 h-3 bg-white/5 rounded animate-pulse" />
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      <span>REPOSITORIES: <strong className="text-white">{ossProjectsCount} TRACKED</strong></span>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Dashboard Grid */}
            {filteredAndSorted.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSorted.map((item) => (
                  <InitiativeCard
                    key={item.id}
                    item={item}
                    onUsersClick={handleOpenUsersModal}
                    onRefresh={refreshProject}
                    isRefreshing={!!refreshingProjectIds[item.id]}
                    onShowBacklog={handleShowBacklog}
                    isLoadingData={loading}
                  />
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

      {/* Users Modal */}
      {isUsersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080b12]/80 backdrop-blur-md transition-all duration-300">
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#0c121d] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.15)]">
            {/* Top blueprint line decorations */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-start justify-between">
              <div>
                <span className="mono-label !text-indigo-400">// ECOSYSTEM_REGISTRY_DIRECTORY</span>
                <h3 className="text-xl font-black text-white tracking-tight uppercase mt-1">Ecosystem User Directory</h3>
                <p className="text-slate-400 text-xs font-mono mt-1">
                  Showing aggregated user sign-ups and multi-platform registration tracking.
                </p>
              </div>
              <button
                onClick={() => setIsUsersModalOpen(false)}
                className="p-2 bg-white/5 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Filtering / Search Bar */}
            <div className="p-6 bg-white/[0.01] border-b border-white/5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Search */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search by name, email, or project..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono"
                />
                <span className="absolute left-3 top-3 text-slate-500">
                  <Search size={14} />
                </span>
              </div>

              {/* Project Filter Dropdown & Sort Dropdown wrapper */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Project Filter Dropdown */}
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Filter:</span>
                  <select
                    value={selectedProjectFilter}
                    onChange={(e) => setSelectedProjectFilter(e.target.value)}
                    className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer border-0"
                  >
                    <option value="ALL" className="bg-[#0f131a]">ALL PROJECTS ({usersList.length})</option>
                    {metrics
                      .filter(m => m.type === 'SoftwareApplication' && m.applicationCategory !== 'UtilitiesApplication')
                      .map(proj => {
                        const count = usersList.filter(u => u.projects.includes(proj.name)).length;
                        return (
                          <option key={proj.id} value={proj.name} className="bg-[#0f131a]">
                            {proj.name.toUpperCase()} ({count})
                          </option>
                        );
                      })
                    }
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sort:</span>
                  <select
                    value={usersSortBy}
                    onChange={(e) => setUsersSortBy(e.target.value as 'LAST_LOGIN' | 'SIGNUP')}
                    className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer border-0"
                  >
                    <option value="LAST_LOGIN" className="bg-[#0f131a]">LAST LOGIN</option>
                    <option value="SIGNUP" className="bg-[#0f131a]">SIGNUP DATE</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingUsers ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 size={32} className="text-indigo-500 animate-spin" />
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Compiling user records...</span>
                </div>
              ) : usersError ? (
                <div className="tech-card border-red-500/30 p-8 bg-red-500/[0.01] flex items-start gap-4">
                  <ShieldAlert size={24} className="text-red-400 shrink-0" />
                  <div className="space-y-1">
                    <span className="mono-label !text-red-400">// REGISTRY_LOAD_FAILURE</span>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Failed to load registry</h4>
                    <p className="text-slate-400 text-xs font-mono">{usersError}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Grid of Users */}
                  {(() => {
                    const filteredUsers = usersList
                      .filter(u => {
                        const matchesSearch =
                          (u.displayName && u.displayName.toLowerCase().includes(usersSearch.toLowerCase())) ||
                          (u.email && u.email.toLowerCase().includes(usersSearch.toLowerCase())) ||
                          u.projects.some(p => p.toLowerCase().includes(usersSearch.toLowerCase()));

                        const matchesProject =
                          selectedProjectFilter === 'ALL' ||
                          u.projects.includes(selectedProjectFilter);

                        return matchesSearch && matchesProject;
                      })
                      .sort((a, b) => {
                        const parseToTime = (val?: string) => {
                          if (!val) return 0;
                          let t = Date.parse(val);
                          if (!isNaN(t)) return t;
                          if (/^\d+$/.test(val)) {
                            return parseInt(val, 10);
                          }
                          return 0;
                        };
                        const getCompareDate = (u: typeof a) => {
                          if (usersSortBy === 'SIGNUP') {
                            return (selectedProjectFilter !== 'ALL' && u.projectDetails && u.projectDetails[selectedProjectFilter])
                              ? u.projectDetails[selectedProjectFilter].firstActive
                              : u.firstActive;
                          } else {
                            if (selectedProjectFilter !== 'ALL' && u.projectDetails && u.projectDetails[selectedProjectFilter]) {
                              return u.projectDetails[selectedProjectFilter].lastActive;
                            }
                            let maxDate = u.lastActive || '';
                            if (u.projectDetails) {
                              Object.values(u.projectDetails).forEach((details) => {
                                if (details.lastActive) {
                                  if (!maxDate || new Date(details.lastActive) > new Date(maxDate)) {
                                    maxDate = details.lastActive;
                                  }
                                }
                              });
                            }
                            return maxDate;
                          }
                        };
                        const dateA = parseToTime(getCompareDate(a));
                        const dateB = parseToTime(getCompareDate(b));
                        return dateB - dateA;
                      });

                    if (filteredUsers.length === 0) {
                      return (
                        <div className="text-center py-20 border border-dashed border-white/5 rounded-xl">
                          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">No matching user registrations found.</span>
                        </div>
                      );
                    }

                    const formatDate = (dateStr?: string) => {
                      if (!dateStr) return 'N/A';
                      try {
                        const d = new Date(dateStr);
                        if (isNaN(d.getTime())) return dateStr;
                        return d.toISOString().split('T')[0];
                      } catch (e) {
                        return dateStr;
                      }
                    };

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredUsers.map((u, i) => {
                          const displaySignupDate = (selectedProjectFilter !== 'ALL' && u.projectDetails && u.projectDetails[selectedProjectFilter])
                            ? u.projectDetails[selectedProjectFilter].firstActive
                            : u.firstActive;

                          const displayActiveDate = (() => {
                            if (selectedProjectFilter !== 'ALL' && u.projectDetails && u.projectDetails[selectedProjectFilter]) {
                              return u.projectDetails[selectedProjectFilter].lastActive;
                            }
                            let maxDate = u.lastActive || '';
                            if (u.projectDetails) {
                              Object.values(u.projectDetails).forEach((details) => {
                                if (details.lastActive) {
                                  if (!maxDate || new Date(details.lastActive) > new Date(maxDate)) {
                                    maxDate = details.lastActive;
                                  }
                                }
                              });
                            }
                            return maxDate;
                          })();

                          return (
                            <div key={i} className="bg-[#0c121d] border border-white/10 p-4 rounded-xl flex flex-col gap-3 hover:border-indigo-500/40 transition-all hover:bg-white/[0.01] relative overflow-hidden group/item">
                              {/* Accent highlight on hover */}
                              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-500/0 group-hover/item:bg-indigo-500/50 transition-all" />

                              {/* Top row: Avatar + Details */}
                              <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-500/10 border border-white/10 flex items-center justify-center shrink-0">
                                  <UserAvatar src={u.photoURL} name={u.displayName} email={u.email} />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-white truncate leading-tight group-hover/item:text-indigo-400 transition-colors">{u.displayName}</h4>
                                  <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{u.email}</p>
                                </div>
                              </div>

                              {/* Middle row: Projects (full width) */}
                              <div className="flex flex-wrap gap-1.5 py-1">
                                {u.projects.map((proj, idx) => {
                                  const isSelected = selectedProjectFilter === proj;
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedProjectFilter(prev => prev === proj ? 'ALL' : proj)}
                                      className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase tracking-wider transition-all cursor-pointer ${isSelected
                                        ? 'bg-indigo-500 border border-indigo-400 text-white font-bold'
                                        : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/30'
                                        }`}
                                    >
                                      {proj}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Bottom row: Timestamps (full width, side-by-side) */}
                              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-slate-500">
                                <div>
                                  <span className="text-slate-600 uppercase">
                                    {selectedProjectFilter === 'ALL' ? 'Signup:' : `${selectedProjectFilter.toLowerCase()} signup:`}
                                  </span>{' '}
                                  <span className="text-slate-400 font-bold">{formatDate(displaySignupDate)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-600 uppercase">
                                    {selectedProjectFilter === 'ALL' ? 'Last Login:' : `${selectedProjectFilter.toLowerCase()} login:`}
                                  </span>{' '}
                                  <span className="text-slate-400 font-bold">{formatDate(displayActiveDate)}</span>
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
              <div className="flex items-center gap-2">
                <span>SYSTEM STATUS: ONLINE // DATA SECURE</span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-400 cursor-help" title="Unique users are aggregated by email address across all projects. Total registrations is the sum of users in all project databases individually.">
                  AGGREGATED BY UNIQUE EMAILS
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span>TOTAL REGISTERED (SUM): <strong className="text-white font-bold">{totalUsers}</strong></span>
                <span>UNIQUE USERS: <strong className="text-white font-bold">{usersList.length}</strong></span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Backlog Modal */}
      {backlogModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080b12]/80 backdrop-blur-md transition-all duration-300">
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-[#0c121d] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.15)]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-start justify-between">
              <div>
                <span className="mono-label !text-indigo-400">
                  // BACKLOG_DIRECTORY{backlogModalUpdatedAt ? <span className="text-slate-500 ml-1">// LAST UPDATED: {backlogModalUpdatedAt}</span> : ''}
                </span>
                <h3 className="text-xl font-black text-white tracking-tight uppercase mt-1">{backlogModalProject}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBacklogModalProject(null)}
                  className="p-2 bg-white/5 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {backlogModalContent ? (
                <div className="space-y-1.5 font-mono text-xs leading-relaxed">
                  {(() => {
                    const lines = backlogModalContent.split('\n');
                    const sections: { heading: string | null; items: string[] }[] = [];
                    let orphanItems: string[] = [];

                    // Collect all list items that appear before any header
                    let headerFound = false;
                    lines.forEach((line) => {
                      if (line.startsWith('#')) {
                        headerFound = true;
                        sections.push({ heading: line.replace(/^#+\s*/, '').replace(/:[\s]*$/, '').trim(), items: [] });
                      } else if (line.trim().startsWith('- ')) {
                        if (!headerFound) {
                          orphanItems.push(line);
                        } else if (sections.length > 0) {
                          sections[sections.length - 1].items.push(line);
                        }
                      } else if (line.startsWith('#') === false && sections.length > 0 && line.trim()) {
                        // non-empty non-header line after a header — could be body text, skip
                      }
                    });

                    const rendered: React.ReactNode[] = [];

                    if (orphanItems.length > 0) {
                      rendered.push(
                        <div key="orphan" className="space-y-1.5 mt-2">
                          {orphanItems.map((item, ii) => (
                            <div key={ii} className="text-slate-200 pl-4 border-l-2 border-indigo-500/40">
                              <span className="flex items-start gap-2">
                                <span className="text-indigo-400 shrink-0 mt-0.5">→</span>
                                <span>{item.trim().substring(2)}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    sections.forEach((section, si) => {
                      if (section.items.length === 0) return;
                      rendered.push(
                        <div key={`s-${si}`}>
                          <div className="text-white font-bold text-sm mt-4 mb-2">{section.heading}</div>
                          <div className="space-y-1.5">
                            {section.items.map((item, ii) => (
                              <div key={ii} className="text-slate-200 pl-4 border-l-2 border-indigo-500/40">
                                <span className="flex items-start gap-2">
                                  <span className="text-indigo-400 shrink-0 mt-0.5">→</span>
                                  <span>{item.trim().substring(2)}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });

                    return rendered.length > 0 ? rendered : <div className="text-slate-500 text-center py-10 font-mono text-xs">No actionable backlog items found.</div>;
                  })()}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <List size={32} className="text-slate-500" />
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">No backlog items found</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>BACKLOG.md // LIVE FROM GITHUB</span>
              <span>
                <strong className="text-white font-bold">
                  {backlogModalContent ? backlogModalContent.split('\n').filter(l => l.trim().startsWith('- ')).length : 0}
                </strong> ITEM{(backlogModalContent ? backlogModalContent.split('\n').filter(l => l.trim().startsWith('- ')).length : 0) !== 1 ? 'S' : ''}
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
