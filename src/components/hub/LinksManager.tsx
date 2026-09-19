import React, { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  Link2,
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Download,
  Trash2,
  Edit2,
  RefreshCw,
  RotateCcw,
  Loader2,
  X,
  Calendar,
  MousePointerClick,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { generateQrCanvas, downloadQrPng, downloadQrSvg } from '../../utils/qrCode';

export interface ShortLink {
  id: string;
  slug: string;
  destinationUrl: string;
  title?: string;
  clickCount: number;
  createdAt: string;
  firstClickedAt: string | null;
  lastClickedAt: string | null;
  isActive: boolean;
  createdBy: string;
  updatedAt: string;
  lastResetAt?: string | null;
}

interface LinksManagerProps {
  user: User;
}

const RESERVED_SLUGS = new Set([
  'api', 'hub', 'social', 'links', 'shortlinks', 'short-links',
  'assets', 'public', 'dist',
  'favicon', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'logo.svg', 'llms.txt', 'cname'
]);

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return 'Not yet clicked';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Not yet clicked';
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return 'Not yet clicked';
  }
}

export const LinksManager: React.FC<LinksManagerProps> = ({ user }) => {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Creation form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit modal state
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null);
  const [editDestination, setEditDestination] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal state
  const [deletingLink, setDeletingLink] = useState<ShortLink | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reset modal state
  const [resettingLink, setResettingLink] = useState<ShortLink | null>(null);
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // QR Modal state
  const [qrModalLink, setQrModalLink] = useState<ShortLink | null>(null);
  const [qrDownloading, setQrDownloading] = useState<'png' | 'svg' | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedQrImage, setCopiedQrImage] = useState(false);
  const [copyImageError, setCopyImageError] = useState<string | null>(null);
  const [qrIncludeLogo, setQrIncludeLogo] = useState<boolean>(true);

  // Clipboard copy feedback
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Fetch short links
  const fetchLinks = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/links', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`Failed to load links (${res.status})`);
      }

      const data = await res.json();
      setLinks(data.links || []);
      setLastRefreshedAt(new Date());
    } catch (err: unknown) {
      console.error('[LinksManager] Error fetching links:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve links');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        await fetchLinks();
      } catch (err) {
        if (!ignore) {
          console.error('[LinksManager] Initial fetch failed:', err);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [user]);

  // Handle QR preview render when modal opens or logo option changes
  useEffect(() => {
    if (!qrModalLink) {
      setQrDataUrl(null);
      setCopiedQrImage(false);
      setCopyImageError(null);
      return;
    }
    const fullUrl = `https://bervos.org/${qrModalLink.slug}`;

    generateQrCanvas(fullUrl, { size: 512, margin: 3, includeLogo: qrIncludeLogo })
      .then((canvas) => {
        setQrDataUrl(canvas.toDataURL('image/png'));
      })
      .catch((err) => {
        console.error('[LinksManager] QR preview generation failed:', err);
      });
  }, [qrModalLink, qrIncludeLogo]);

  // Copy QR Image to clipboard
  const handleCopyQrImage = async () => {
    if (!qrDataUrl || !qrModalLink) return;
    try {
      setCopyImageError(null);
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      if (navigator.clipboard && typeof (window as any).ClipboardItem !== 'undefined') {
        const item = new (window as any).ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopiedQrImage(true);
        setTimeout(() => setCopiedQrImage(false), 2500);
      } else {
        throw new Error('ClipboardItem API not supported');
      }
    } catch (e) {
      console.warn('[LinksManager] Clipboard image write not supported:', e);
      setCopyImageError('Long-press image to copy');
      setTimeout(() => setCopyImageError(null), 3500);
    }
  };

  // Copy URL to clipboard
  const handleCopy = async (slugToCopy: string) => {
    const fullUrl = `https://bervos.org/${slugToCopy}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedSlug(slugToCopy);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch (e) {
      console.warn('[LinksManager] Clipboard write failed:', e);
    }
  };

  // Create new link
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    let cleanUrl = destinationUrl.trim();
    if (!cleanUrl) {
      setCreateError('Please enter a destination URL.');
      return;
    }
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const cleanSlug = slug.trim().toLowerCase();
    if (cleanSlug) {
      if (!/^[a-z0-9-_]{2,60}$/.test(cleanSlug)) {
        setCreateError('Slug must contain 2–60 characters (letters, numbers, hyphens, underscores).');
        return;
      }
      if (RESERVED_SLUGS.has(cleanSlug)) {
        setCreateError(`"${cleanSlug}" is a reserved system path.`);
        return;
      }
    }

    setCreating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          destinationUrl: cleanUrl,
          slug: cleanSlug || undefined,
          title: title.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create short link');
      }

      setLinks((prev) => [data.link, ...prev]);
      setShowCreateModal(false);
      setDestinationUrl('');
      setSlug('');
      setTitle('');
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Error creating short link');
    } finally {
      setCreating(false);
    }
  };

  // Toggle active / inactive status
  const handleToggleActive = async (link: ShortLink) => {
    const newStatus = !link.isActive;
    // Optimistic UI update
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, isActive: newStatus } : l))
    );

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/links/${link.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (!res.ok) {
        throw new Error('Failed to update link status');
      }
    } catch (err) {
      console.error('[LinksManager] Status toggle failed:', err);
      // Revert on error
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, isActive: link.isActive } : l))
      );
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (link: ShortLink) => {
    setEditingLink(link);
    setEditDestination(link.destinationUrl);
    setEditTitle(link.title || '');
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;
    setEditError(null);

    let cleanUrl = editDestination.trim();
    if (!cleanUrl) {
      setEditError('Destination URL cannot be empty.');
      return;
    }
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    setSavingEdit(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/links/${editingLink.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          destinationUrl: cleanUrl,
          title: editTitle.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update short link');
      }

      setLinks((prev) =>
        prev.map((l) => (l.id === editingLink.id ? data.link : l))
      );
      setEditingLink(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Error updating link');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Link
  const handleConfirmDelete = async () => {
    if (!deletingLink) return;
    setDeleting(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/links/${deletingLink.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to delete short link');
      }

      setLinks((prev) => prev.filter((l) => l.id !== deletingLink.id));
      setDeletingLink(null);
    } catch (err: unknown) {
      console.error('[LinksManager] Deletion failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Reset single link counter
  const handleConfirmResetLink = async () => {
    if (!resettingLink) return;
    setResetting(true);
    setResetError(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/links/${resettingLink.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resetCounters: true })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset link counter');
      }

      setLinks((prev) =>
        prev.map((l) => (l.id === resettingLink.id ? data.link : l))
      );
      setResettingLink(null);
    } catch (err: unknown) {
      console.error('[LinksManager] Reset counter failed:', err);
      setResetError(err instanceof Error ? err.message : 'Failed to reset counter');
    } finally {
      setResetting(false);
    }
  };

  // Reset all links counters
  const handleConfirmResetAll = async () => {
    setResetting(true);
    setResetError(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/links/reset-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset all counters');
      }

      const resetTimestamp = data.resetAt || new Date().toISOString();
      setLinks((prev) =>
        prev.map((l) => ({
          ...l,
          clickCount: 0,
          firstClickedAt: null,
          lastClickedAt: null,
          lastResetAt: resetTimestamp,
          updatedAt: resetTimestamp
        }))
      );
      setShowResetAllModal(false);
    } catch (err: unknown) {
      console.error('[LinksManager] Reset all counters failed:', err);
      setResetError(err instanceof Error ? err.message : 'Failed to reset all counters');
    } finally {
      setResetting(false);
    }
  };

  // Download QR Handlers
  const handleDownloadQrPng = async () => {
    if (!qrModalLink) return;
    setQrDownloading('png');
    try {
      await downloadQrPng(
        `https://bervos.org/${qrModalLink.slug}`,
        `bervos-${qrModalLink.slug}-qr.png`,
        { includeLogo: qrIncludeLogo }
      );
    } catch (err) {
      console.error('[LinksManager] PNG download failed:', err);
    } finally {
      setQrDownloading(null);
    }
  };

  const handleDownloadQrSvg = async () => {
    if (!qrModalLink) return;
    setQrDownloading('svg');
    try {
      await downloadQrSvg(
        `https://bervos.org/${qrModalLink.slug}`,
        `bervos-${qrModalLink.slug}-qr.svg`,
        { includeLogo: qrIncludeLogo }
      );
    } catch (err) {
      console.error('[LinksManager] SVG download failed:', err);
    } finally {
      setQrDownloading(null);
    }
  };

  // Filtered links
  const filteredLinks = links.filter((l) => {
    const matchesSearch =
      l.slug.toLowerCase().includes(search.toLowerCase()) ||
      l.destinationUrl.toLowerCase().includes(search.toLowerCase()) ||
      (l.title && l.title.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && l.isActive) ||
      (filterStatus === 'INACTIVE' && !l.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalClicks = links.reduce((sum, l) => sum + (l.clickCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header with Stats & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="mono-label !text-emerald-400">System_Network // SHORT_LINKS</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter glow-text">Short Links & QR Hub</h2>
          <p className="text-slate-500 text-xs font-mono mt-1">
            {links.length} links configured · {totalClicks} total clicks recorded
            {lastRefreshedAt && (
              <span className="text-slate-600"> · Synced {formatDate(lastRefreshedAt.toISOString()).split(' ')[1] || 'just now'}</span>
            )}
          </p>
        </div>

        {/* Stats HUD & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Stats Boxes */}
          <div className="flex items-center bg-white/[0.02] border border-white/5 px-2 py-1.5 rounded-xl">
            <div className="px-3.5 py-1 text-center min-w-[70px]">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider">Links</span>
              <span className="text-sm font-bold text-white font-mono">{links.length}</span>
            </div>
            <div className="h-6 w-px bg-white/5" />
            <div className="px-3.5 py-1 text-center min-w-[70px]">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider">Clicks</span>
              <span className="text-sm font-bold text-indigo-400 font-mono">{totalClicks}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLinks()}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50"
              title={`Refresh metrics${lastRefreshedAt ? ` (last synced: ${formatDate(lastRefreshedAt.toISOString())})` : ''}`}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-indigo-400' : ''} />
            </button>

            {links.length > 0 && (
              <button
                onClick={() => {
                  setResetError(null);
                  setShowResetAllModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 border border-white/10 hover:border-amber-500/30 font-mono text-xs transition-all cursor-pointer group"
                title="Reset all click counters to 0"
              >
                <RotateCcw size={13} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                <span>Reset All</span>
              </button>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] cursor-pointer"
            >
              <Plus size={15} />
              <span>Create Short Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by slug, destination, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5 self-start sm:self-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-mono tracking-wider cursor-pointer transition-all ${
                filterStatus === status
                  ? 'bg-indigo-500 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 size={32} className="text-indigo-400 animate-spin" />
          <span className="mono-label !text-indigo-400">CONNECTING_FIREBASE // RETRIEVING_LINKS</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="text-sm font-mono">{error}</span>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="tech-card p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-500">
            <Link2 size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No short links found</h3>
            <p className="text-xs text-slate-400 font-mono">
              {search
                ? 'No short links matched your search filter.'
                : 'Create your first custom bervos.org/xxxx short link to begin tracking clicks and generating QR codes.'}
            </p>
          </div>
          {!search && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all cursor-pointer"
            >
              <Plus size={14} /> Create Short Link
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLinks.map((link) => (
            <div
              key={link.id}
              className={`tech-card p-5 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border ${
                link.isActive ? 'border-white/5 hover:border-indigo-500/30' : 'border-white/5 opacity-60 bg-white/[0.005]'
              }`}
            >
              {/* Left Details */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-bold ${
                      link.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                  >
                    {link.isActive ? 'ACTIVE' : 'PAUSED'}
                  </span>

                  {link.title && (
                    <span className="text-xs font-bold text-white tracking-wide truncate max-w-[200px] md:max-w-xs">
                      {link.title}
                    </span>
                  )}
                </div>

                {/* Short URL & Copy Action */}
                <div className="flex items-center gap-2">
                  <a
                    href={`/${link.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm md:text-base font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-1.5 transition-colors group cursor-pointer"
                    title={`Open /${link.slug} in new tab`}
                  >
                    <span>bervos.org/{link.slug}</span>
                    <ExternalLink size={13} className="text-indigo-500/60 group-hover:text-indigo-300 transition-colors" />
                  </a>
                  <button
                    onClick={() => handleCopy(link.slug)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy short link"
                  >
                    {copiedSlug === link.slug ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                {/* Destination */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate max-w-xl">
                  <span className="text-slate-500 font-mono">Target:</span>
                  <a
                    href={link.destinationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate hover:text-indigo-400 underline decoration-slate-700 underline-offset-2 transition-colors flex items-center gap-1"
                  >
                    {link.destinationUrl}
                    <ExternalLink size={11} className="inline-block flex-shrink-0" />
                  </a>
                </div>

                {/* Timestamp Row */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-500" />
                    <span>Created: <strong className="text-slate-300">{formatDate(link.createdAt)}</strong></span>
                  </div>

                  {link.lastResetAt && (
                    <div className="flex items-center gap-1">
                      <RotateCcw size={11} className="text-amber-400/80" />
                      <span>Reset: <strong className="text-amber-300/90">{formatDate(link.lastResetAt)}</strong></span>
                    </div>
                  )}

                  {link.clickCount === 0 || !link.firstClickedAt ? (
                    <div className="flex items-center gap-1 text-slate-500">
                      <span>• {link.lastResetAt ? '0 clicks since reset' : 'No clicks recorded yet'}</span>
                    </div>
                  ) : link.clickCount === 1 || link.firstClickedAt === link.lastClickedAt ? (
                    <div className="flex items-center gap-1">
                      <span>Clicked: <strong className="text-slate-300">{formatDate(link.lastClickedAt || link.firstClickedAt)}</strong></span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <span>First Click: <strong className="text-slate-300">{formatDate(link.firstClickedAt)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Last Click: <strong className="text-slate-300">{formatDate(link.lastClickedAt)}</strong></span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Metrics & Action Controls */}
              <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-center justify-between lg:justify-end border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                {/* Click counter badge */}
                <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-xl font-mono text-xs text-indigo-300">
                  <MousePointerClick size={14} className="text-indigo-400" />
                  <span className="font-bold text-sm text-white">{link.clickCount}</span>
                  <span className="text-slate-400 text-[10px] uppercase">Clicks</span>
                </div>

                {/* Reset Counter */}
                <button
                  onClick={() => {
                    setResetError(null);
                    setResettingLink(link);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-300 hover:border-amber-500/30 border border-white/10 transition-colors cursor-pointer"
                  title={`Reset counter for bervos.org/${link.slug} to 0`}
                >
                  <RotateCcw size={14} />
                </button>

                {/* QR Code trigger */}
                <button
                  onClick={() => {
                    setQrIncludeLogo(true);
                    setQrModalLink(link);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-mono transition-colors cursor-pointer"
                  title="View & download QR code"
                >
                  <QrCode size={14} />
                  <span>QR Code</span>
                </button>

                {/* Toggle Active status */}
                <button
                  onClick={() => handleToggleActive(link)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer border ${
                    link.isActive
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/20'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                  }`}
                  title={link.isActive ? 'Pause link' : 'Activate link'}
                >
                  {link.isActive ? 'Pause' : 'Activate'}
                </button>

                {/* Edit Destination */}
                <button
                  onClick={() => handleOpenEdit(link)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Edit link"
                >
                  <Edit2 size={14} />
                </button>

                {/* Delete link */}
                <button
                  onClick={() => setDeletingLink(link)}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                  title="Delete short link"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE LINK MODAL */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="tech-card p-6 md:p-8 max-w-lg w-full relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-0.5">
                <span className="mono-label !text-indigo-400">Action // CREATE_SHORT_LINK</span>
                <h3 className="text-xl font-bold text-white">Create New Short Link</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 block">
                  Target Destination URL <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/laresbernardo/..."
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 block">
                  Custom Slug (optional)
                </label>
                <div className="flex items-center rounded-xl border border-white/10 bg-white/5 focus-within:border-indigo-500/50 overflow-hidden">
                  <span className="px-3 text-xs font-mono text-slate-500 bg-white/[0.02] border-r border-white/10 select-none">
                    bervos.org/
                  </span>
                  <input
                    type="text"
                    placeholder="my-link (leave empty for auto 5-char slug)"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    className="w-full px-3 py-2.5 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Alphanumeric characters, hyphens, and underscores only.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 block">
                  Title / Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Conference Keynote, Twitter Bio, Newsletter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? 'Creating...' : 'Create Short Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LINK MODAL */}
      {editingLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setEditingLink(null)}
        >
          <div
            className="tech-card p-6 md:p-8 max-w-lg w-full relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-0.5">
                <span className="mono-label !text-indigo-400">Action // EDIT_SHORT_LINK</span>
                <h3 className="text-xl font-bold text-white">Edit Short Link Destination</h3>
              </div>
              <button
                onClick={() => setEditingLink(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                  {editError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 block">Short URL (Immutable)</label>
                <div className="px-3.5 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-sm font-mono text-slate-300 select-none">
                  bervos.org/{editingLink.slug}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 block">
                  Target Destination URL <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  value={editDestination}
                  onChange={(e) => setEditDestination(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 block">Title / Description</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {savingEdit && <Loader2 size={14} className="animate-spin" />}
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setDeletingLink(null)}
        >
          <div
            className="tech-card p-6 md:p-8 max-w-md w-full relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-0.5">
                <span className="mono-label !text-red-400">Warning // DELETE_CONFIRMATION</span>
                <h3 className="text-xl font-bold text-white">Delete Short Link</h3>
              </div>
              <button
                onClick={() => setDeletingLink(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">bervos.org/{deletingLink.slug}</strong>? Any existing QR codes or external links pointing to this slug will cease to redirect.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeletingLink(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-50"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR CODE VIEWER & DOWNLOAD MODAL */}
      {qrModalLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setQrModalLink(null)}
        >
          <div
            className="tech-card p-6 md:p-8 max-w-sm w-full relative space-y-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="text-left space-y-0.5">
                <span className="mono-label !text-indigo-400">Generator // BRANDED_QR</span>
                <a
                  href={`/${qrModalLink.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg font-bold text-indigo-400 hover:text-indigo-300 hover:underline truncate max-w-[220px] inline-flex items-center gap-1.5 cursor-pointer group"
                  title={`Open /${qrModalLink.slug} in new tab`}
                >
                  <span>bervos.org/{qrModalLink.slug}</span>
                  <ExternalLink size={14} className="text-indigo-500/60 group-hover:text-indigo-300 transition-colors" />
                </a>
              </div>
              <button
                onClick={() => setQrModalLink(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* QR Image Container (Native <img> enables mobile long-press copy/save) */}
            <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center shadow-inner">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for bervos.org/${qrModalLink.slug}`}
                  className="w-full max-w-[260px] aspect-square rounded-xl shadow-md border border-slate-100 select-auto pointer-events-auto cursor-pointer"
                  style={{ WebkitTouchCallout: 'default' }}
                  title="Press and hold to copy or save on mobile"
                />
              ) : (
                <div className="w-full max-w-[260px] aspect-square flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                </div>
              )}
              <span className="text-[10px] text-slate-400 font-mono mt-2 sm:hidden">
                Tip: Long-press image to copy or save to Photos
              </span>
            </div>

            {/* Logo Toggle Option */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-200 block font-mono">
                  BERVOS Logo
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  {qrIncludeLogo ? 'Centred brand emblem' : 'Standard clean QR matrix'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={qrIncludeLogo}
                onClick={() => setQrIncludeLogo(!qrIncludeLogo)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  qrIncludeLogo ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
                title={qrIncludeLogo ? 'Remove BERVOS logo' : 'Include BERVOS logo'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    qrIncludeLogo ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Action Row: Copy QR Image + Downloads */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleCopyQrImage}
                disabled={!qrDataUrl}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                {copiedQrImage ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-300" />
                    <span>Copied QR Image to Clipboard!</span>
                  </>
                ) : copyImageError ? (
                  <>
                    <Copy size={14} />
                    <span>{copyImageError}</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy QR Image</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadQrPng}
                  disabled={qrDownloading !== null}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-mono text-xs transition-all border border-white/10 cursor-pointer disabled:opacity-50"
                >
                  {qrDownloading === 'png' ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                  <span>PNG (1024px)</span>
                </button>

                <button
                  onClick={handleDownloadQrSvg}
                  disabled={qrDownloading !== null}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/20 text-white font-mono text-xs transition-all border border-white/10 cursor-pointer disabled:opacity-50"
                >
                  {qrDownloading === 'svg' ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                  <span>SVG Vector</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* RESET LINK COUNTER CONFIRMATION MODAL */}
      {resettingLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => !resetting && setResettingLink(null)}
        >
          <div
            className="tech-card p-6 md:p-8 max-w-md w-full relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-0.5">
                <span className="mono-label !text-amber-400">Action // RESET_COUNTER</span>
                <h3 className="text-xl font-bold text-white">Reset Clicks Counter</h3>
              </div>
              <button
                onClick={() => !resetting && setResettingLink(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                {resetError}
              </div>
            )}

            <div className="space-y-3 text-xs font-mono text-slate-300">
              <p>
                Are you sure you want to reset the clicks counter for{' '}
                <strong className="text-indigo-400">bervos.org/{resettingLink.slug}</strong>?
              </p>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Current Clicks:</span>
                  <span className="font-bold text-white">{resettingLink.clickCount}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>New Clicks:</span>
                  <span className="font-bold text-emerald-400">0</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Reset Timestamp:</span>
                  <span className="text-amber-300 font-bold">Now</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                This will set the counter to 0, clear click history timestamps, and record the current refresh timestamp.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setResettingLink(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleConfirmResetLink}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-amber-600/20 cursor-pointer disabled:opacity-50"
              >
                {resetting && <Loader2 size={14} className="animate-spin" />}
                {resetting ? 'Resetting...' : 'Reset to 0'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET ALL COUNTERS CONFIRMATION MODAL */}
      {showResetAllModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => !resetting && setShowResetAllModal(false)}
        >
          <div
            className="tech-card p-6 md:p-8 max-w-md w-full relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-0.5">
                <span className="mono-label !text-amber-400">Action // RESET_ALL_COUNTERS</span>
                <h3 className="text-xl font-bold text-white">Reset All Link Counters</h3>
              </div>
              <button
                onClick={() => !resetting && setShowResetAllModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                {resetError}
              </div>
            )}

            <div className="space-y-3 text-xs font-mono text-slate-300">
              <p>
                Are you sure you want to reset click counters for all{' '}
                <strong className="text-white">{links.length}</strong> short links?
              </p>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Total Links Affected:</span>
                  <span className="font-bold text-white">{links.length}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Clicks Reset:</span>
                  <span className="font-bold text-white">{totalClicks} → 0</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Reset Timestamp:</span>
                  <span className="text-amber-300 font-bold">Now</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                All short links will have their click counts set to 0 and their timestamps refreshed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setShowResetAllModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleConfirmResetAll}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-amber-600/20 cursor-pointer disabled:opacity-50"
              >
                {resetting && <Loader2 size={14} className="animate-spin" />}
                {resetting ? 'Resetting All...' : 'Reset All to 0'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
