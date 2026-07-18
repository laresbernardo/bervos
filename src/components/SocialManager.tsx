import React, { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { Search, X, Loader2, Check, MessageSquare, Edit3, Eye, Calendar, Share2, Sparkles, Download, Maximize2, Trash2, ArrowUpDown, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, RotateCcw, Upload, Plus } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import ecosystemData from '../data/ecosystem.json';

interface SocialPost {
  id: string;
  status: 'Draft' | 'Approved' | 'Published' | 'Scheduled' | 'Needs AI Revision';
  post_type: 'carousel_before_after' | 'under_the_hood' | 'vibe_coding_reality';
  project: string;
  hook: string;
  caption_english: string;
  caption_spanish: string;
  visual_instruction: string;
  mermaid_code: string | null;
  suggested_date: string;
  user_feedback: string;
  created_at: string;
  updated_at: string;
  screenshots?: string[];
  slides?: string[];
  instagram_media_id?: string | null;
  published_at?: string | null;
  instagram_scheduled_id?: string | null;
  scheduled_at?: string | null;
  instagram_permalink?: string | null;
}

interface SocialManagerProps {
  user: User;
}

const ORIGINAL_VISUAL_DIRECTIONS: Record<string, string> = {
  'billio': 'Branded local-first AI architecture diagram showing the Local Ollama (Gemma 4) model connected to a cloud MCP server and Firestore database via a Node.js terminal bridge.',
  'bervos': 'Ecosystem dashboard consolidation mockup, showing 10 open browser tabs merging into a single pane of glass dashboard at bervos.org/hub with live metrics, commit history, and cache status.',
  'hub': 'Ecosystem dashboard consolidation mockup, showing 10 open browser tabs merging into a single pane of glass dashboard at bervos.org/hub with live metrics, commit history, and cache status.',
  'pinmage': 'Branded geocoding cascade diagram showing the 4-layer fallback pipeline: AI Vision, OSM Nominatim, Apple CLGeocoder, and raw lat/lon coordinates as a last resort.',
  'aura': 'World map photo heatmap visualization showing flight paths between San Francisco, Paris, Tokyo, and Sydney with timeline controls at the bottom.',
  'tripitdown': 'Interactive conversation thread routing mockup showing a primary Gemini model HTTP 503 error triggering an automatic fallback to a secondary Gemini model.',
  'scribo': 'Comparative writing system card grid showing Arabic glyphs, Japanese Hiragana, Elvish Tengwar, and Morse code dot/dash visual components.',
  'yt2mp3': 'Horizontal 5-stage audio download pipeline: Chrome Extension, Node.js API, yt-dlp Engine, iTunes Tagging, and LRCLIB Lyrics.',
  'chessverse': 'Immersive chess opening practice chessboard rendering variations, tactical puzzles, and coordinate guides.',
  'tonaly': 'Interactive music theory circle of fifths ear training chart showing pitch relationships and interval selectors.',
  'laresdj': 'Professional 4-channel DJ mixer console deck layout showing faders, level meters, Traktor mappings, and BPM monitors.'
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  'Draft': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', label: 'DRAFT' },
  'Approved': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'APPROVED' },
  'Scheduled': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'SCHEDULED' },
  'Published': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', label: 'PUBLISHED' },
  'Needs AI Revision': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'NEEDS_REVISION' },
};

const POST_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  'carousel_before_after': { label: 'Before & After', color: 'text-cyan-400' },
  'under_the_hood': { label: 'Under the Hood', color: 'text-indigo-400' },
  'vibe_coding_reality': { label: 'Vibe Coding', color: 'text-purple-400' },
};

const processScreenshotToSquare = (file: File, project: string, postType: string, index: number, idToken: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error("Failed to read file"));
        return;
      }
      const img = new Image();
      img.onload = async () => {
        let boxes: Array<{ xmin: number; ymin: number; xmax: number; ymax: number }> = [];
        try {
          const res = await fetch('/api/social/detect-email', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageBase64: dataUrl })
          });
          if (res.ok) {
            const data = await res.json();
            boxes = data.boxes || [];
          } else {
            const errText = await res.text();
            console.warn('[Email Redaction] API returned error:', res.status, errText);
          }
        } catch (err) {
          console.error('[Email Redaction] Failed to detect email:', err);
        }

        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        // Create offscreen canvas for blurred image if boxes are found
        let renderSource: HTMLImageElement | HTMLCanvasElement = img;
        if (boxes.length > 0) {
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = img.width;
          offscreenCanvas.height = img.height;
          const offscreenCtx = offscreenCanvas.getContext('2d');
          if (offscreenCtx) {
            offscreenCtx.drawImage(img, 0, 0);
            for (const box of boxes) {
              const bx = (box.xmin / 1000) * img.width;
              const by = (box.ymin / 1000) * img.height;
              const bw = ((box.xmax - box.xmin) / 1000) * img.width;
              const bh = ((box.ymax - box.ymin) / 1000) * img.height;

              // Apply blur filter on the specific bounding box
              offscreenCtx.save();
              offscreenCtx.beginPath();
              offscreenCtx.rect(bx, by, bw, bh);
              offscreenCtx.clip();
              offscreenCtx.filter = 'blur(12px)';
              offscreenCtx.drawImage(img, 0, 0);
              offscreenCtx.restore();

              // Draw a very soft, dark translucent overlay block over the blurred region
              offscreenCtx.fillStyle = 'rgba(12, 18, 29, 0.4)';
              offscreenCtx.fillRect(bx, by, bw, bh);
            }
            renderSource = offscreenCanvas;
          }
        }

        // 1. Draw background
        ctx.fillStyle = '#080b12';
        ctx.fillRect(0, 0, 1080, 1080);

        // 2. Draw grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= 1080; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 1080);
          ctx.stroke();
        }
        for (let y = 0; y <= 1080; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(1080, y);
          ctx.stroke();
        }

        // 3. Draw corner decorations (HUD Borders)
        const accentIndigo = '#6366f1';
        const accentCyan = '#06b6d4';
        const textSecondary = '#94a3b8';

        ctx.strokeStyle = accentIndigo;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(80, 50);
        ctx.lineTo(50, 50);
        ctx.lineTo(50, 80);
        ctx.stroke();

        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(1000, 50);
        ctx.lineTo(1030, 50);
        ctx.lineTo(1030, 80);
        ctx.stroke();

        ctx.strokeStyle = accentCyan;
        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(50, 1000);
        ctx.lineTo(50, 1030);
        ctx.lineTo(80, 1030);
        ctx.stroke();

        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(1030, 1000);
        ctx.lineTo(1030, 1030);
        ctx.lineTo(1000, 1030);
        ctx.stroke();

        // 4. Header text
        ctx.fillStyle = accentCyan;
        ctx.font = "bold 20px 'JetBrains Mono', monospace";
        ctx.letterSpacing = "3px";
        ctx.fillText(`// SCREENSHOT // ${project.toUpperCase()}`, 75, 115);

        ctx.fillStyle = textSecondary;
        ctx.font = "14px 'JetBrains Mono', monospace";
        ctx.letterSpacing = "2px";
        ctx.textAlign = 'right';
        ctx.fillText(`// SLIDE 0${index + 2} // ${postType.toUpperCase()}`, 1005, 115);
        ctx.textAlign = 'left'; // Reset

        // 5. Footer line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(60, 965);
        ctx.lineTo(1020, 965);
        ctx.stroke();

        ctx.fillStyle = textSecondary;
        ctx.font = "500 18px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
        ctx.fillText("bervos.org", 75, 1005);

        // 6. Draw screenshot card with aspect ratio
        const maxW = 880;
        const maxH = 618; // 650 minus title bar (32px)
        const imgAspect = img.width / img.height;
        let sw = maxW;
        let sh = maxW / imgAspect;

        if (sh > maxH) {
          sh = maxH;
          sw = maxH * imgAspect;
        }

        const cardW = sw;
        const cardH = sh + 32; // add 32px for window title bar
        const cardX = 540 - cardW / 2;
        const cardY = 510 - cardH / 2;

        // Draw shadow glow
        ctx.shadowColor = 'rgba(99, 102, 241, 0.2)';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#0c121d';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(cardX - 2, cardY - 2, cardW + 4, cardH + 4, 16);
        } else {
          ctx.rect(cardX - 2, cardY - 2, cardW + 4, cardH + 4);
        }
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // Draw card body
        ctx.fillStyle = '#0c121d';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(cardX, cardY, cardW, cardH, 16);
        } else {
          ctx.rect(cardX, cardY, cardW, cardH);
        }
        ctx.fill();

        // Stroke card border
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Title Bar Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cardX, cardY + 32);
        ctx.lineTo(cardX + cardW, cardY + 32);
        ctx.stroke();

        // Draw Window Controls (Three Dots)
        const dotY = cardY + 16;
        // Red
        ctx.fillStyle = '#ff5f56';
        ctx.beginPath();
        ctx.arc(cardX + 16, dotY, 5, 0, 2 * Math.PI);
        ctx.fill();
        // Yellow
        ctx.fillStyle = '#ffbd2e';
        ctx.beginPath();
        ctx.arc(cardX + 30, dotY, 5, 0, 2 * Math.PI);
        ctx.fill();
        // Green
        ctx.fillStyle = '#27c93f';
        ctx.beginPath();
        ctx.arc(cardX + 44, dotY, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Title text in bar (centered)
        ctx.fillStyle = textSecondary;
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        const displayFilename = file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name;
        ctx.fillText(displayFilename.toLowerCase(), cardX + cardW / 2, cardY + 20);
        ctx.textAlign = 'left'; // Reset

        // Clip and Draw Image (using roundRect for bottom corners)
        ctx.save();
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(cardX, cardY + 32, cardW, cardH - 32, [0, 0, 16, 16]);
        } else {
          ctx.rect(cardX, cardY + 32, cardW, cardH - 32);
        }
        ctx.clip();

        // Draw screenshot image
        ctx.drawImage(renderSource, cardX, cardY + 32, sw, sh);
        ctx.restore();

        try {
          const finalDataUrl = canvas.toDataURL('image/png');
          resolve(finalDataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (err) => reject(err);
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const SocialManager: React.FC<SocialManagerProps> = ({ user }) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Draft', 'Approved', 'Scheduled', 'Needs AI Revision']);
  const [search, setSearch] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [editedCaptionEn, setEditedCaptionEn] = useState('');
  const [editedCaptionEs, setEditedCaptionEs] = useState('');
  const [editingVisual, setEditingVisual] = useState(false);
  const [editedVisualInstruction, setEditedVisualInstruction] = useState('');
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('bervos_social_generated_images');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatingPipeline, setGeneratingPipeline] = useState(false);
  const [generationStatusText, setGenerationStatusText] = useState('');
  const [publishingInstagram, setPublishingInstagram] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createProject, setCreateProject] = useState('None');
  const [createPrompt, setCreatePrompt] = useState('');
  const [createPostType, setCreatePostType] = useState<'carousel_before_after' | 'under_the_hood' | 'vibe_coding_reality'>('vibe_coding_reality');
  const [generatingCustomDraft, setGeneratingCustomDraft] = useState(false);
  const [customDraft, setCustomDraft] = useState<{
    project: string;
    post_type: 'carousel_before_after' | 'under_the_hood' | 'vibe_coding_reality';
    hook: string;
    caption_english: string;
    caption_spanish: string;
    visual_instruction: string;
    mermaid_code: string | null;
  } | null>(null);
  const [savingCustomPost, setSavingCustomPost] = useState(false);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
    link?: { url: string; label: string };
  } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showHud, setShowHud] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'project' | 'status' | 'updated'>('date_asc');
  const [editingDate, setEditingDate] = useState(false);
  const [editedScheduledAt, setEditedScheduledAt] = useState('');
  const [showQueue, setShowQueue] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingScreenshot, setProcessingScreenshot] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info',
    onConfirm: () => {}
  });

  const showConfirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'info',
      onConfirm: options.onConfirm
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0] && selectedPost) {
      await handleUploadFiles(e.dataTransfer.files, selectedPost);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedPost) {
      await handleUploadFiles(e.target.files, selectedPost);
    }
  };

  const handleUploadFiles = async (files: FileList, post: SocialPost) => {
    setProcessingScreenshot(true);
    try {
      const currentSlides = post.slides || ['__generated__', ...(post.screenshots || [])];
      const newSlides = [...currentSlides];
      const currentScreenshots = post.screenshots || [];
      const newScreenshots = [...currentScreenshots];

      const idToken = await user.getIdToken();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          setNotification({
            title: 'Invalid File',
            message: 'Only image files are allowed as screenshots.',
            type: 'error'
          });
          continue;
        }

        // Process screenshot into square format in the browser
        // Slide number will be index + 2 (since main image is slide 1)
        const slideIndex = newScreenshots.length;
        const processedBase64 = await processScreenshotToSquare(
          file, 
          post.project, 
          post.post_type, 
          slideIndex,
          idToken
        );
        newScreenshots.push(processedBase64);
        newSlides.push(processedBase64);
      }

      await updatePost(post.id, { screenshots: newScreenshots, slides: newSlides });
      setNotification({
        title: 'Screenshot Added',
        message: 'Successfully processed and added screenshot as a secondary slide.',
        type: 'success'
      });
    } catch (err: any) {
      console.error('[Social] Screenshot processing failed:', err);
      setNotification({
        title: 'Processing Failed',
        message: `Failed to process screenshot: ${err.message}`,
        type: 'error'
      });
    } finally {
      setProcessingScreenshot(false);
    }
  };

  const handleMoveSlide = async (post: SocialPost, index: number, direction: 'left' | 'right') => {
    const currentSlides = post.slides || ['__generated__', ...(post.screenshots || [])];
    const newSlides = [...currentSlides];
    const swapWith = direction === 'left' ? index - 1 : index + 1;
    
    // Swap
    const temp = newSlides[index];
    newSlides[index] = newSlides[swapWith];
    newSlides[swapWith] = temp;
    
    await updatePost(post.id, { slides: newSlides });
  };

  const handleDeleteSlide = async (post: SocialPost, index: number) => {
    const currentSlides = post.slides || ['__generated__', ...(post.screenshots || [])];
    if (currentSlides.length <= 1) {
      setNotification({
        title: 'Delete Failed',
        message: 'At least one photo/slide is required to publish to Instagram.',
        type: 'error'
      });
      return;
    }
    
    showConfirm({
      title: 'Delete Slide',
      message: 'Are you sure you want to delete this slide? This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: async () => {
        const slideToDelete = currentSlides[index];
        const newSlides = currentSlides.filter((_: string, idx: number) => idx !== index);
        
        const updates: Partial<SocialPost> = { slides: newSlides };
        if (slideToDelete !== '__generated__') {
          const currentScreenshots = post.screenshots || [];
          updates.screenshots = currentScreenshots.filter(url => url !== slideToDelete);
        }
        
        await updatePost(post.id, updates);
        setNotification({
          title: 'Slide Deleted',
          message: 'Successfully removed slide.',
          type: 'success'
        });
      }
    });
  };

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/social', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!res.ok) throw new Error(`Failed to load social posts (Status: ${res.status})`);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load social posts');
      // Fallback: try loading from local JSON
      try {
        const res = await fetch('/social/bervos_social_queue.json');
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
          setError(null);
        }
      } catch (e) {
        console.error('[Social] Fallback load failed:', e);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Garbage-collect orphaned images from localStorage when posts change
  useEffect(() => {
    if (posts.length === 0) return;
    setGeneratedImages(prev => {
      const postIds = new Set(posts.map(p => p.id));
      const next: Record<string, string> = {};
      let changed = false;
      for (const [id, value] of Object.entries(prev)) {
        if (postIds.has(id)) {
          next[id] = value;
        } else {
          changed = true;
        }
      }
      if (changed) {
        try {
          localStorage.setItem('bervos_social_generated_images', JSON.stringify(next));
        } catch (e) {
          console.error('[Social] Failed to save garbage-collected images:', e);
        }
        return next;
      }
      return prev;
    });
  }, [posts]);

  const handleDeletePost = (post: SocialPost) => {
    showConfirm({
      title: 'Delete Post',
      message: `Are you sure you want to permanently delete "${post.hook}"? This action cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: async () => {
        setSaving(true);
        try {
          const idToken = await user.getIdToken();
          const res = await fetch(`/api/social/${post.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          if (!res.ok) {
            let errMsg = `Failed to delete post (Status: ${res.status})`;
            try {
              const errData = await res.json();
              if (errData && errData.error) errMsg = errData.error;
            } catch (_) { }
            throw new Error(errMsg);
          }
          // Remove from local state
          setPosts(prev => prev.filter(p => p.id !== post.id));
          // Clean up generated image
          deleteGeneratedImage(post.id);
          // Close detail panel
          setSelectedPost(null);
          setNotification({ title: 'Post Deleted', message: `"${post.hook}" has been permanently removed.`, type: 'success' });
        } catch (err: any) {
          console.error('[Social] Delete failed:', err);
          setNotification({ title: 'Delete Failed', message: err.message || 'Unknown error', type: 'error' });
        } finally {
          setSaving(false);
        }
      }
    });
  };


  const updatePost = useCallback(async (postId: string, updates: Partial<SocialPost>) => {
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/social/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        let errMsg = `Failed to update post (Status: ${res.status})`;
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) { }
        throw new Error(errMsg);
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch (_) { }

      const mergedUpdates = data.updatedFields ? { ...updates, ...data.updatedFields } : updates;

      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, ...mergedUpdates, updated_at: new Date().toISOString() } : p
      ));
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => prev ? { ...prev, ...mergedUpdates, updated_at: new Date().toISOString() } : null);
      }
    } catch (err: any) {
      console.error('[Social] Update failed:', err);
      setNotification({
        title: 'Update Failed',
        message: `Failed to save changes: ${err.message || 'Unknown network error'}`,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  }, [user, selectedPost]);

  const splitTitleToLines = (text: string, maxLen = 32): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length <= maxLen) {
        current = (current + ' ' + w).trim();
      } else {
        if (current) lines.push(current);
        current = w;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const downloadSvg = (post: SocialPost) => {
    const dataUrl = generateBrandedSvg(post, showGrid, showHud);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `bervos-post-${post.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPng = (post: SocialPost) => {
    const svgDataUrl = generateBrandedSvg(post, showGrid, showHud);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2160;
      canvas.height = 2160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#080b12';
        ctx.fillRect(0, 0, 2160, 2160);
        ctx.drawImage(img, 0, 0, 2160, 2160);
        try {
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `bervos-post-${post.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          console.error('PNG conversion failed:', e);
        }
      }
    };
    img.src = svgDataUrl;
  };

  const generateBrandedSvg = (post: SocialPost, gridEnabled: boolean = showGrid, hudEnabled: boolean = showHud): string => {
    const bg = '#080b12';
    const accentIndigo = '#6366f1';
    const accentCyan = '#06b6d4';
    const textPrimary = '#f1f5f9';
    const textSecondary = '#94a3b8';

    let diagramContent = '';
    const proj = post.project.toLowerCase();

    // Parse list of steps from visual_instruction text
    const parseVisualInstructionSteps = (text: string): string[] => {
      if (!text) return [];

      // Check if it describes a multi-slide carousel on a single line
      if (text.toLowerCase().includes('slide 1') || text.toLowerCase().includes('step 1')) {
        const parts = text.split(/(?:slide|step)\s*\d+\s*(?:[:\-–—]|\bslide\b|\bstep\b)/i);
        if (parts.length > 1) {
          const cleanSteps = parts.slice(1).map(p => {
            let cleaned = p.trim();
            // Remove ending label if it matches "Label '//...'" or "Label: '//...'"
            cleaned = cleaned.replace(/label\s*['"\u201c\u201d]?\/\/.*$/i, '');
            // Remove ending punctuation
            cleaned = cleaned.replace(/[\.\,\;\:]\s*$/, '');
            return cleaned.trim();
          }).filter(Boolean);
          
          if (cleanSteps.length > 0) {
            return cleanSteps;
          }
        }
      }

      const lines = text.split('\n');
      const steps: string[] = [];
      const stepRegex = /^(?:slide\s*\d+\s*[:\-]|step\s*\d+\s*[:\-]|\d+\s*[\.\-]|[\-\*]\s*)(.+)$/i;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        // Skip matching stepRegex if it's just "3-slide carousel" or "4-slide carousel" at the very beginning of text
        // (to prevent it from matching "3-slide" and making the whole string one step)
        if (/^\d+\-slide/i.test(trimmed) || /^\d+\-step/i.test(trimmed)) {
          continue;
        }

        const match = trimmed.match(stepRegex);
        if (match) {
          steps.push(match[1].trim());
        } else if (trimmed.includes('→') || trimmed.includes('->')) {
          // Extract only the bracketed items if present in the line (e.g. [Home] -> [Server])
          const bracketMatches = [...trimmed.matchAll(/\[([^\]]+)\]/g)].map(m => m[1].trim());
          if (bracketMatches.length > 1) {
            return bracketMatches;
          }
          
          const parts = trimmed.split(/\s*(?:→|->)\s*/);
          if (parts.length > 1) {
            return parts.map(p => p.trim());
          }
        }
      }
      
      if (steps.length === 0) {
        if (text.includes(',') && !text.includes('.')) {
          const parts = text.split(',');
          if (parts.length > 1 && parts.length <= 6 && parts.every(p => p.trim().length < 30)) {
            return parts.map(p => p.trim());
          }
        }
      }
      
      return steps;
    };

    const parsedSteps = parseVisualInstructionSteps(post.visual_instruction);

    if (parsedSteps.length > 0) {
      const N = parsedSteps.length;
      let stepsHtml = '';
      
      if (N <= 4) {
        // Horizontal flow
        const cardWidth = Math.min(220, (900 - (N - 1) * 40) / N);
        const startX = 540 - ((N * cardWidth + (N - 1) * 40) / 2);
        const y = 460;
        const height = 240;
        
        for (let i = 0; i < N; i++) {
          const x = startX + i * (cardWidth + 40);
          const labelLines = splitTitleToLines(parsedSteps[i], 16);
          let linesHtml = '';
          const lineCount = labelLines.length;
          const startTextY = (height / 2) + 20 - ((lineCount - 1) * 8);
          
          for (let j = 0; j < lineCount; j++) {
            linesHtml += `
              <text x="${cardWidth / 2}" y="${startTextY + j * 16}" font-family="-apple-system, sans-serif" font-size="12" fill="#f8fafc" font-weight="bold" text-anchor="middle">
                ${labelLines[j]}
              </text>
            `;
          }
          
          stepsHtml += `
            <g transform="translate(${x}, ${y})">
              <!-- Glow shadow -->
              <rect x="-4" y="-4" width="${cardWidth + 8}" height="${height + 8}" rx="20" fill="url(#glowGrad)" opacity="0.4" />
              <!-- Card body -->
              <rect x="0" y="0" width="${cardWidth}" height="${height}" rx="16" fill="url(#cardGrad)" stroke="${i === 0 ? accentCyan : (i === N - 1 ? '#10b981' : accentIndigo)}" stroke-width="2" />
              <!-- Top indicator badge -->
              <rect x="12" y="12" width="55" height="18" rx="9" fill="rgba(255,255,255,0.03)" stroke="${i === 0 ? accentCyan : (i === N - 1 ? '#10b981' : accentIndigo)}" stroke-width="1" />
              <text x="39.5" y="24" font-family="'JetBrains Mono', monospace" font-size="8" fill="#94a3b8" text-anchor="middle" font-weight="bold">0${i + 1}</text>
              ${linesHtml}
            </g>
          `;
          
          if (i < N - 1) {
            const arrowX = x + cardWidth;
            const arrowY = y + height / 2;
            stepsHtml += `
              <g>
                <path d="M ${arrowX} ${arrowY} L ${arrowX + 40} ${arrowY}" stroke="url(#arrowGrad)" stroke-width="2" stroke-dasharray="4 2"/>
                <circle cx="${arrowX + 20}" cy="${arrowY}" r="4" fill="${accentCyan}" stroke="#080b12" stroke-width="1.5" />
                <polygon points="${arrowX + 40},${arrowY - 4} ${arrowX + 40},${arrowY + 4} ${arrowX + 44},${arrowY}" fill="${accentCyan}" />
              </g>
            `;
          }
        }
      } else {
        // Vertical flow for more steps
        const cardWidth = 380;
        const cardHeight = 70;
        const startX = 540 - cardWidth / 2;
        const startY = 400;
        const gap = 20;
        
        for (let i = 0; i < N; i++) {
          const x = startX;
          const y = startY + i * (cardHeight + gap);
          const labelLines = splitTitleToLines(parsedSteps[i], 28);
          let linesHtml = '';
          const lineCount = labelLines.length;
          const startTextY = (cardHeight / 2) + 4 - ((lineCount - 1) * 7);
          
          for (let j = 0; j < lineCount; j++) {
            linesHtml += `
              <text x="220" y="${startTextY + j * 14}" font-family="-apple-system, sans-serif" font-size="12" fill="#f8fafc" font-weight="bold" text-anchor="middle">
                ${labelLines[j]}
              </text>
            `;
          }
          
          stepsHtml += `
            <g transform="translate(${x}, ${y})">
              <!-- Glow shadow -->
              <rect x="-4" y="-4" width="${cardWidth + 8}" height="${cardHeight + 8}" rx="16" fill="url(#glowGrad)" opacity="0.4" />
              <!-- Card body -->
              <rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#cardGrad)" stroke="${i === 0 ? accentCyan : (i === N - 1 ? '#10b981' : accentIndigo)}" stroke-width="2" />
              <!-- Round step indicator -->
              <rect x="12" y="16" width="36" height="36" rx="18" fill="rgba(255,255,255,0.03)" stroke="${i === 0 ? accentCyan : (i === N - 1 ? '#10b981' : accentIndigo)}" stroke-width="1" />
              <text x="30" y="38" font-family="'JetBrains Mono', monospace" font-size="11" fill="#94a3b8" text-anchor="middle" font-weight="bold">0${i + 1}</text>
              ${linesHtml}
            </g>
          `;
          
          if (i < N - 1) {
            const arrowX = x + cardWidth / 2;
            const arrowY = y + cardHeight;
            stepsHtml += `
              <g>
                <path d="M ${arrowX} ${arrowY} L ${arrowX} ${arrowY + gap}" stroke="url(#arrowGrad)" stroke-width="2" stroke-dasharray="4 2"/>
                <circle cx="${arrowX}" cy="${arrowY + gap / 2}" r="4" fill="${accentCyan}" stroke="#080b12" stroke-width="1.5" />
                <polygon points="${arrowX - 4},${arrowY + gap} ${arrowX + 4},${arrowY + gap} ${arrowX},${arrowY + gap + 4}" fill="${accentCyan}" />
              </g>
            `;
          }
        }
      }
      
      diagramContent = stepsHtml;
    } else if (proj === 'billio') {
      diagramContent = `
        <!-- Connection 1 -->
        <g>
          <path d="M 370 575 L 430 575" stroke="url(#accentGrad)" stroke-width="3" stroke-dasharray="6 3"/>
          <circle cx="400" cy="575" r="4" fill="${accentCyan}"/>
          <text x="400" y="555" font-family="monospace" font-size="9" fill="${accentCyan}" text-anchor="middle" font-weight="bold">STDIO</text>
        </g>

        <!-- Connection 2 -->
        <g>
          <path d="M 680 575 L 740 575" stroke="url(#accentGrad)" stroke-width="3"/>
          <circle cx="710" cy="575" r="4" fill="${accentIndigo}"/>
          <text x="710" y="555" font-family="monospace" font-size="9" fill="${accentIndigo}" text-anchor="middle" font-weight="bold">HTTPS/SSL</text>
        </g>

        <!-- LOCAL AI Card -->
        <g transform="translate(110, 480)">
          <rect width="260" height="190" rx="16" fill="#0c121d" fill-opacity="0.8" stroke="rgba(99, 102, 241, 0.25)" stroke-width="2"/>
          <circle cx="30" cy="30" r="5" fill="#10b981"/>
          <text x="45" y="34" font-family="monospace" font-size="10" fill="#94a3b8" font-weight="bold">NODE_01 // OLLAMA</text>
          <path d="M 115 85 C 105 75, 95 80, 95 95 C 95 105, 105 110, 115 120 C 125 110, 135 105, 135 95 C 135 80, 125 75, 115 85 Z" fill="none" stroke="${accentIndigo}" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M 145 85 C 155 75, 165 80, 165 95 C 165 105, 155 110, 145 120 C 135 110, 125 105, 125 95 C 125 80, 135 75, 145 85 Z" fill="none" stroke="${accentIndigo}" stroke-width="2.5" stroke-linejoin="round"/>
          <text x="130" y="150" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" fill="#f8fafc" font-weight="900" text-anchor="middle" letter-spacing="1">LOCAL AI</text>
          <text x="130" y="170" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">llama3:8b (local)</text>
        </g>

        <!-- MCP BRIDGE Card -->
        <g transform="translate(420, 480)">
          <rect width="260" height="190" rx="16" fill="#0c121d" fill-opacity="0.8" stroke="rgba(6, 182, 212, 0.3)" stroke-width="2"/>
          <circle cx="30" cy="30" r="5" fill="#10b981"/>
          <text x="45" y="34" font-family="monospace" font-size="10" fill="#94a3b8" font-weight="bold">NODE_02 // PROT</text>
          <rect x="115" y="80" width="30" height="20" rx="4" fill="none" stroke="${accentCyan}" stroke-width="2"/>
          <path d="M 125 100 L 125 115 M 135 100 L 135 115" stroke="${accentCyan}" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M 130 70 L 130 80" stroke="${accentCyan}" stroke-width="2.5" stroke-linecap="round"/>
          <text x="130" y="150" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" fill="#f8fafc" font-weight="900" text-anchor="middle" letter-spacing="1">MCP BRIDGE</text>
          <text x="130" y="170" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">ollama_mcp_client.js</text>
        </g>

        <!-- CLOUD API Card -->
        <g transform="translate(730, 480)">
          <rect width="260" height="190" rx="16" fill="#0c121d" fill-opacity="0.8" stroke="rgba(99, 102, 241, 0.25)" stroke-width="2"/>
          <circle cx="30" cy="30" r="5" fill="#10b981"/>
          <text x="45" y="34" font-family="monospace" font-size="10" fill="#94a3b8" font-weight="bold">NODE_03 // DATA</text>
          <path d="M 120 100 A 10 10 0 0 1 130 90 A 15 15 0 0 1 155 83 A 11 11 0 0 1 165 100 Z" fill="none" stroke="${accentIndigo}" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="115" y1="100" x2="170" y2="100" stroke="${accentIndigo}" stroke-width="2.5" stroke-linecap="round"/>
          <text x="130" y="150" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" fill="#f8fafc" font-weight="900" text-anchor="middle" letter-spacing="1">CLOUD DB</text>
          <text x="130" y="170" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">Firestore (online)</text>
        </g>
      `;
    } else if (proj === 'bervos' || proj === 'hub') {
      if (post.hook.toLowerCase().includes('llm') || post.hook.toLowerCase().includes('recommend') || post.hook.toLowerCase().includes('seo')) {
        diagramContent = `
          <!-- Central Python Script Node -->
          <g transform="translate(420, 520)">
            <rect width="240" height="90" rx="12" fill="#0c121d" stroke="${accentCyan}" stroke-width="2" />
            <text x="120" y="40" font-family="monospace" font-size="11" fill="${accentCyan}" font-weight="bold" text-anchor="middle">generate_ai_metadata.py</text>
            <text x="120" y="60" font-family="monospace" font-size="9" fill="${textSecondary}" text-anchor="middle">Python CLI Tool</text>
          </g>

          <!-- Branch Connections -->
          <path d="M 420 565 L 280 450 M 420 565 L 280 670 M 660 565 L 800 450 M 660 565 L 800 670" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" stroke-dasharray="4 4" />

          <!-- Out Nodes -->
          <g transform="translate(100, 400)">
            <rect width="180" height="70" rx="8" fill="#0c121d" stroke="${accentIndigo}" stroke-width="1.5" />
            <text x="90" y="32" font-family="monospace" font-size="11" fill="#f8fafc" font-weight="bold" text-anchor="middle">JSON-LD SCHEMA</text>
            <text x="90" y="50" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="middle">index.html injection</text>
          </g>

          <g transform="translate(100, 620)">
            <rect width="180" height="70" rx="8" fill="#0c121d" stroke="${accentIndigo}" stroke-width="1.5" />
            <text x="90" y="32" font-family="monospace" font-size="11" fill="#f8fafc" font-weight="bold" text-anchor="middle">LLMS.TXT</text>
            <text x="90" y="50" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="middle">AI Documentation</text>
          </g>

          <g transform="translate(800, 400)">
            <rect width="180" height="70" rx="8" fill="#0c121d" stroke="${accentIndigo}" stroke-width="1.5" />
            <text x="90" y="32" font-family="monospace" font-size="11" fill="#f8fafc" font-weight="bold" text-anchor="middle">SITEMAP.XML</text>
            <text x="90" y="50" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="middle">Dynamic SEO Index</text>
          </g>

          <g transform="translate(800, 620)">
            <rect width="180" height="70" rx="8" fill="#0c121d" stroke="${accentIndigo}" stroke-width="1.5" />
            <text x="90" y="32" font-family="monospace" font-size="11" fill="#f8fafc" font-weight="bold" text-anchor="middle">ROBOTS.TXT</text>
            <text x="90" y="50" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="middle">Sitemap Pointer</text>
          </g>
        `;
      } else {
        diagramContent = `
          <!-- Top Row: Floating open tabs -->
          <g opacity="0.4">
            <rect x="150" y="380" width="100" height="24" rx="4" fill="#0c121d" stroke="rgba(239, 68, 68, 0.4)" stroke-width="1"/>
            <text x="200" y="395" font-family="monospace" font-size="9" fill="#ef4444" text-anchor="middle">Tab 1</text>

            <rect x="270" y="380" width="100" height="24" rx="4" fill="#0c121d" stroke="rgba(239, 68, 68, 0.4)" stroke-width="1"/>
            <text x="320" y="395" font-family="monospace" font-size="9" fill="#ef4444" text-anchor="middle">Tab 2</text>

            <rect x="390" y="380" width="100" height="24" rx="4" fill="#0c121d" stroke="rgba(239, 68, 68, 0.4)" stroke-width="1"/>
            <text x="440" y="395" font-family="monospace" font-size="9" fill="#ef4444" text-anchor="middle">Tab 3</text>

            <text x="530" y="395" font-family="monospace" font-size="12" fill="#94a3b8">...</text>

            <rect x="580" y="380" width="100" height="24" rx="4" fill="#0c121d" stroke="rgba(239, 68, 68, 0.4)" stroke-width="1"/>
            <text x="630" y="395" font-family="monospace" font-size="9" fill="#ef4444" text-anchor="middle">Tab 10</text>
          </g>

          <g transform="translate(490, 420)">
            <path d="M 50 10 L 50 70" fill="none" stroke="${accentCyan}" stroke-width="3" stroke-dasharray="4 4" />
            <path d="M 40 60 L 50 75 L 60 60" fill="none" stroke="${accentCyan}" stroke-width="3" stroke-linejoin="round" />
            <rect x="-10" y="25" width="120" height="20" rx="4" fill="#080b12" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
            <text x="50" y="38" font-family="monospace" font-size="8" fill="${accentCyan}" text-anchor="middle" font-weight="bold">CONSOLIDATE</text>
          </g>

          <!-- Consolidated Hub Dashboard -->
          <g transform="translate(180, 520)">
            <rect width="720" height="380" rx="16" fill="#0c121d" stroke="${accentCyan}" stroke-width="2" fill-opacity="0.9"/>
            
            <!-- Window header -->
            <rect width="720" height="30" rx="16" fill="rgba(255,255,255,0.02)"/>
            <circle cx="20" cy="15" r="4" fill="#ef4444" />
            <circle cx="35" cy="15" r="4" fill="#f59e0b" />
            <circle cx="50" cy="15" r="4" fill="#10b981" />
            <text x="360" y="19" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">bervos.org/hub</text>

            <!-- Dashboard mock grid -->
            <g transform="translate(40, 60)">
              <rect x="0" y="0" width="180" height="120" rx="8" fill="#080b12" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
              <text x="15" y="25" font-family="monospace" font-size="9" fill="${accentCyan}" font-weight="bold">BILLIO</text>
              <text x="15" y="55" font-family="-apple-system, sans-serif" font-size="20" fill="#f8fafc" font-weight="900">$1,482</text>
              <text x="15" y="80" font-family="monospace" font-size="8" fill="#94a3b8">Active Ledger</text>
              <rect x="15" y="95" width="150" height="6" rx="3" fill="rgba(6, 182, 212, 0.1)"/>
              <rect x="15" y="95" width="110" height="6" rx="3" fill="${accentCyan}"/>

              <rect x="220" y="0" width="180" height="120" rx="8" fill="#080b12" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
              <text x="235" y="25" font-family="monospace" font-size="9" fill="${accentCyan}" font-weight="bold">PINMAGE</text>
              <text x="235" y="55" font-family="-apple-system, sans-serif" font-size="20" fill="#f8fafc" font-weight="900">85% GPS</text>
              <text x="235" y="80" font-family="monospace" font-size="8" fill="#94a3b8">Geocoded Albums</text>
              <rect x="235" y="95" width="150" height="6" rx="3" fill="rgba(6, 182, 212, 0.1)"/>
              <rect x="235" y="95" width="130" height="6" rx="3" fill="${accentCyan}"/>

              <rect x="440" y="0" width="180" height="120" rx="8" fill="#080b12" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
              <text x="455" y="25" font-family="monospace" font-size="9" fill="${accentCyan}" font-weight="bold">AURA</text>
              <text x="455" y="55" font-family="-apple-system, sans-serif" font-size="20" fill="#f8fafc" font-weight="900">Time Tour</text>
              <text x="455" y="80" font-family="monospace" font-size="8" fill="#94a3b8">550ms transitions</text>
              <rect x="455" y="95" width="150" height="6" rx="3" fill="rgba(6, 182, 212, 0.1)"/>
              <rect x="455" y="95" width="90" height="6" rx="3" fill="${accentCyan}"/>

              <!-- Bottom Row dashboard metrics -->
              <g transform="translate(0, 140)">
                <rect x="0" y="0" width="300" height="120" rx="8" fill="#080b12" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
                <text x="15" y="25" font-family="monospace" font-size="9" fill="${accentIndigo}" font-weight="bold">LATEST COMMIT HISTORY</text>
                <text x="15" y="55" font-family="monospace" font-size="8" fill="#f8fafc">fe82a1d: fix scroll flicker on map view</text>
                <text x="15" y="75" font-family="monospace" font-size="8" fill="#94a3b8">0a1bc92: add morse catalog renderer</text>
                <text x="15" y="95" font-family="monospace" font-size="8" fill="#94a3b8">9b821a8: setup mcp auth token check</text>
              </g>

              <g transform="translate(320, 140)">
                <rect x="0" y="0" width="300" height="120" rx="8" fill="#080b12" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
                <text x="15" y="25" font-family="monospace" font-size="9" fill="${accentIndigo}" font-weight="bold">INTELLIGENT SWR CACHING</text>
                <rect x="15" y="45" width="270" height="55" rx="6" fill="#0c121d" stroke="rgba(6, 182, 212, 0.15)"/>
                <circle cx="40" cy="72" r="6" fill="#10b981" />
                <text x="60" y="76" font-family="monospace" font-size="11" fill="#f8fafc" font-weight="bold">CACHE HIT (STALE)</text>
              </g>
            </g>
          </g>
        `;
      }
    } else if (proj === 'pinmage') {
      diagramContent = `
        <!-- Funnel Background Grid -->
        <g opacity="0.3">
          <line x1="540" y1="360" x2="540" y2="920" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="4 4" />
        </g>

        <!-- Vertical Cascade Funnel -->
        <g transform="translate(340, 370)">
          <!-- Layer 1 -->
          <rect width="400" height="90" rx="12" fill="#0c121d" stroke="${accentIndigo}" stroke-width="1.5" />
          <circle cx="40" cy="45" r="16" fill="rgba(99, 102, 241, 0.1)" stroke="${accentIndigo}" stroke-width="1" />
          <circle cx="40" cy="45" r="5" fill="${accentIndigo}"/>
          <path d="M 30 45 Q 40 37 50 45 Q 40 53 30 45" fill="none" stroke="${accentIndigo}" stroke-width="1.5"/>
          <text x="75" y="38" font-family="monospace" font-size="11" fill="${accentIndigo}" font-weight="bold">LAYER 01 // AI VISION CASCADE</text>
          <text x="75" y="58" font-family="-apple-system, sans-serif" font-size="14" fill="#f8fafc" font-weight="bold">Extract landmark visual clues</text>
          <text x="75" y="74" font-family="monospace" font-size="9" fill="#94a3b8">Gemini vision API fallbacks</text>
          
          <!-- Layer 2 -->
          <g transform="translate(0, 140)">
            <rect width="400" height="90" rx="12" fill="#0c121d" stroke="${accentCyan}" stroke-width="1.5" />
            <circle cx="40" cy="45" r="16" fill="rgba(6, 182, 212, 0.1)" stroke="${accentCyan}" stroke-width="1" />
            <circle cx="40" cy="45" r="8" fill="none" stroke="${accentCyan}" stroke-width="1.5"/>
            <line x1="32" y1="45" x2="48" y2="45" stroke="${accentCyan}" stroke-width="1"/>
            <text x="75" y="38" font-family="monospace" font-size="11" fill="${accentCyan}" font-weight="bold">LAYER 02 // OSM NOMINATIM</text>
            <text x="75" y="58" font-family="-apple-system, sans-serif" font-size="14" fill="#f8fafc" font-weight="bold">Primary OSM Geocoder</text>
            <text x="75" y="74" font-family="monospace" font-size="9" fill="#94a3b8">Rate limited to 1 request/second</text>
          </g>

          <!-- Layer 3 -->
          <g transform="translate(0, 280)">
            <rect width="400" height="90" rx="12" fill="#0c121d" stroke="${accentIndigo}" stroke-width="1.5" opacity="0.8" />
            <circle cx="40" cy="45" r="16" fill="rgba(99, 102, 241, 0.05)" stroke="${accentIndigo}" stroke-width="1" />
            <path d="M 40 37 A 4 4 0 0 1 44 41 C 44 47, 40 53, 40 53 C 40 53, 36 47, 36 41 A 4 4 0 0 1 40 37" fill="none" stroke="${accentIndigo}" stroke-width="1.5" />
            <text x="75" y="38" font-family="monospace" font-size="11" fill="${accentIndigo}" font-weight="bold">LAYER 03 // APPLE CLGEOCODER</text>
            <text x="75" y="58" font-family="-apple-system, sans-serif" font-size="14" fill="#f8fafc" font-weight="bold">Apple Native Fallback API</text>
            <text x="75" y="74" font-family="monospace" font-size="9" fill="#94a3b8">Coordinates derived regionally</text>
          </g>

          <!-- Layer 4 -->
          <g transform="translate(0, 420)">
            <rect width="400" height="90" rx="12" fill="#0c121d" stroke="#f59e0b" stroke-width="1.5" opacity="0.6" />
            <circle cx="40" cy="45" r="16" fill="rgba(245, 158, 11, 0.05)" stroke="#f59e0b" stroke-width="1" />
            <text x="40" y="49" font-family="monospace" font-size="11" fill="#f59e0b" font-weight="bold" text-anchor="middle">&gt;_</text>
            <text x="75" y="38" font-family="monospace" font-size="11" fill="#f59e0b" font-weight="bold">LAYER 04 // AI COORDS FALLBACK</text>
            <text x="75" y="58" font-family="-apple-system, sans-serif" font-size="14" fill="#f8fafc" font-weight="bold">Raw Lat/Lon coordinates fallback</text>
            <text x="75" y="74" font-family="monospace" font-size="9" fill="#94a3b8">Validated via isValidCoordinate()</text>
          </g>
        </g>
      `;
    } else if (proj === 'aura') {
      diagramContent = `
        <!-- World map grid lines layout -->
        <g opacity="0.08">
          <line x1="100" y1="600" x2="980" y2="600" stroke="#ffffff" stroke-width="1"/>
          <line x1="540" y1="360" x2="540" y2="840" stroke="#ffffff" stroke-width="1"/>
          <circle cx="540" cy="600" r="150" fill="none" stroke="#ffffff" stroke-width="1"/>
          <circle cx="540" cy="600" r="280" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="8 4"/>
        </g>

        <!-- Continent vector shapes (abstract blocks) -->
        <g fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)" stroke-width="1">
          <path d="M 180 430 L 320 400 L 280 520 L 220 540 Z"/>
          <path d="M 280 580 L 340 600 L 310 740 L 260 760 Z"/>
          <path d="M 460 380 L 680 360 L 820 420 L 740 650 L 600 700 L 480 620 L 440 450 Z"/>
          <path d="M 780 680 L 860 690 L 840 760 L 760 740 Z"/>
        </g>

        <!-- Glowing map clusters -->
        <g transform="translate(240, 470)">
          <circle cx="0" cy="0" r="20" fill="${accentIndigo}" opacity="0.15"/>
          <circle cx="0" cy="0" r="8" fill="${accentIndigo}"/>
          <text x="12" y="4" font-family="monospace" font-size="10" fill="#f8fafc" font-weight="bold">SF [142]</text>
        </g>

        <g transform="translate(520, 440)">
          <circle cx="0" cy="0" r="28" fill="${accentCyan}" opacity="0.15"/>
          <circle cx="0" cy="0" r="10" fill="${accentCyan}"/>
          <text x="15" y="4" font-family="monospace" font-size="10" fill="#f8fafc" font-weight="bold">PARIS [524]</text>
        </g>

        <g transform="translate(780, 460)">
          <circle cx="0" cy="0" r="24" fill="${accentIndigo}" opacity="0.15"/>
          <circle cx="0" cy="0" r="9" fill="${accentIndigo}"/>
          <text x="12" y="4" font-family="monospace" font-size="10" fill="#f8fafc" font-weight="bold">TOKYO [312]</text>
        </g>

        <g transform="translate(820, 720)">
          <circle cx="0" cy="0" r="16" fill="${accentCyan}" opacity="0.15"/>
          <circle cx="0" cy="0" r="6" fill="${accentCyan}"/>
          <text x="12" y="4" font-family="monospace" font-size="10" fill="#f8fafc" font-weight="bold">SYD [84]</text>
        </g>

        <!-- Curved Flight Paths -->
        <path d="M 240 470 Q 380 360 520 440" fill="none" stroke="${accentCyan}" stroke-width="2.5" stroke-dasharray="4 2" />
        <path d="M 520 440 Q 650 380 780 460" fill="none" stroke="url(#accentGrad)" stroke-width="3" />
        <path d="M 780 460 Q 800 590 820 720" fill="none" stroke="${accentCyan}" stroke-width="2" stroke-dasharray="3 3" />

        <!-- Timeline HUD Slider at bottom -->
        <g transform="translate(180, 810)">
          <rect width="720" height="60" rx="12" fill="#0c121d" stroke="rgba(6, 182, 212, 0.2)" stroke-width="1" />
          <circle cx="40" cy="30" r="12" fill="rgba(6, 182, 212, 0.1)" stroke="${accentCyan}" stroke-width="1"/>
          <polygon points="37,25 37,35 46,30" fill="${accentCyan}" />
          
          <line x1="80" y1="30" x2="600" y2="30" stroke="rgba(255,255,255,0.06)" stroke-width="4" stroke-linecap="round" />
          <line x1="80" y1="30" x2="380" y2="30" stroke="${accentCyan}" stroke-width="4" stroke-linecap="round" />
          <circle cx="380" cy="30" r="7" fill="${accentCyan}" stroke="#080b12" stroke-width="2"/>
          
          <text x="615" y="34" font-family="monospace" font-size="10" fill="${textSecondary}">2016 - 2026</text>
        </g>
      `;
    } else if (proj === 'scribo') {
      diagramContent = `
        <!-- Writing systems comparison -->
        <g transform="translate(80, 420)">
          <!-- Arabic Card -->
          <rect x="0" y="0" width="210" height="360" rx="16" fill="#0c121d" stroke="rgba(99, 102, 241, 0.25)" stroke-width="2" />
          <rect x="0" y="0" width="210" height="30" rx="16" fill="rgba(255,255,255,0.02)"/>
          <text x="15" y="19" font-family="monospace" font-size="9" fill="${accentIndigo}" font-weight="bold">CATALOG // ARABIC</text>
          <text x="105" y="180" font-family="Arial, sans-serif" font-size="72" fill="#f8fafc" text-anchor="middle">ض</text>
          <text x="105" y="270" font-family="-apple-system, sans-serif" font-size="16" fill="#f8fafc" font-weight="bold" text-anchor="middle">Arabic Glyph</text>
          <text x="105" y="295" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">Unicode text rendering</text>

          <!-- Japanese Card -->
          <g transform="translate(240, 0)">
            <rect x="0" y="0" width="210" height="360" rx="16" fill="#0c121d" stroke="rgba(6, 182, 212, 0.3)" stroke-width="2" />
            <rect x="0" y="0" width="210" height="30" rx="16" fill="rgba(255,255,255,0.02)"/>
            <text x="15" y="19" font-family="monospace" font-size="9" fill="${accentCyan}" font-weight="bold">CATALOG // KANA</text>
            <text x="105" y="180" font-family="sans-serif" font-size="72" fill="#f8fafc" text-anchor="middle">あ</text>
            <text x="105" y="270" font-family="-apple-system, sans-serif" font-size="16" fill="#f8fafc" font-weight="bold" text-anchor="middle">Hiragana</text>
            <text x="105" y="295" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">Unicode text rendering</text>
          </g>

          <!-- Elvish Card -->
          <g transform="translate(480, 0)">
            <rect x="0" y="0" width="210" height="360" rx="16" fill="#0c121d" stroke="rgba(99, 102, 241, 0.25)" stroke-width="2" />
            <rect x="0" y="0" width="210" height="30" rx="16" fill="rgba(255,255,255,0.02)"/>
            <text x="15" y="19" font-family="monospace" font-size="9" fill="${accentIndigo}" font-weight="bold">CATALOG // TENGWAR</text>
            <text x="105" y="180" font-family="Times New Roman, serif" font-style="italic" font-size="72" fill="#f8fafc" text-anchor="middle">λ</text>
            <text x="105" y="270" font-family="-apple-system, sans-serif" font-size="16" fill="#f8fafc" font-weight="bold" text-anchor="middle">Tengwar</text>
            <text x="105" y="295" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">Custom Web Font layer</text>
          </g>

          <!-- Morse Code Card -->
          <g transform="translate(720, 0)">
            <rect x="0" y="0" width="210" height="360" rx="16" fill="#0c121d" stroke="#f59e0b" stroke-width="2" />
            <rect x="0" y="0" width="210" height="30" rx="16" fill="rgba(255,255,255,0.02)"/>
            <text x="15" y="19" font-family="monospace" font-size="9" fill="#f59e0b" font-weight="bold">CATALOG // MORSE</text>
            
            <g transform="translate(45, 120)" fill="#f59e0b">
              <rect x="0" y="0" width="40" height="15" rx="5"/>
              <circle cx="60" cy="7.5" r="7.5"/>
              <circle cx="85" cy="7.5" r="7.5"/>

              <circle cx="20" cy="50" r="7.5"/>
              <circle cx="45" cy="50" r="7.5"/>

              <circle cx="20" cy="90" r="7.5"/>
              <circle cx="45" cy="90" r="7.5"/>
              <circle cx="70" cy="90" r="7.5"/>
              <rect x="90" y="82.5" width="40" height="15" rx="5"/>
            </g>

            <text x="105" y="270" font-family="-apple-system, sans-serif" font-size="16" fill="#f8fafc" font-weight="bold" text-anchor="middle">Morse Code</text>
            <text x="105" y="295" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle">MorseDisplay SVG node</text>
          </g>
        </g>
      `;
    } else if (proj === 'yt2mp3') {
      diagramContent = `
        <!-- Horizontal Connection Pipeline lines -->
        <g opacity="0.2">
          <line x1="180" y1="580" x2="900" y2="580" stroke="url(#accentGrad)" stroke-width="4" stroke-dasharray="8 4"/>
        </g>

        <!-- 5 Horizontal Stages -->
        <g transform="translate(60, 480)">
          <rect x="0" y="0" width="160" height="200" rx="14" fill="#0c121d" stroke="${accentIndigo}" stroke-width="1.5"/>
          <text x="80" y="30" font-family="monospace" font-size="10" fill="${accentIndigo}" font-weight="bold" text-anchor="middle">STAGE 01</text>
          <circle cx="80" cy="90" r="25" fill="none" stroke="${accentIndigo}" stroke-width="2"/>
          <circle cx="80" cy="90" r="10" fill="none" stroke="${accentIndigo}" stroke-width="1.5"/>
          <text x="80" y="145" font-family="-apple-system, sans-serif" font-size="13" fill="#f8fafc" font-weight="bold" text-anchor="middle">Extension</text>
          <text x="80" y="165" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="middle">URL Capture</text>

          <g transform="translate(195, 0)">
            <rect x="0" y="0" width="160" height="200" rx="14" fill="#0c121d" stroke="${accentCyan}" stroke-width="1.5"/>
            <text x="80" y="30" font-family="monospace" font-size="10" fill="${accentCyan}" font-weight="bold" text-anchor="middle">STAGE 02</text>
            <rect x="55" y="65" width="50" height="45" rx="4" fill="none" stroke="${accentCyan}" stroke-width="2"/>
            <line x1="55" y1="80" x2="105" y2="80" stroke="${accentCyan}" stroke-width="1.5"/>
            <line x1="55" y1="95" x2="105" y2="95" stroke="${accentCyan}" stroke-width="1.5"/>
            <text x="80" y="145" font-family="-apple-system, sans-serif" font-size="13" fill="#f8fafc" font-weight="bold" text-anchor="middle">Node.js API</text>
            <text x="80" y="165" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="middle">Localhost server</text>
          </g>

          <g transform="translate(390, 0)">
            <rect x="0" y="0" width="160" height="200" rx="14" fill="#0c121d" stroke="${accentIndigo}" stroke-width="1.5"/>
            <text x="80" y="30" font-family="monospace" font-size="10" fill="${accentIndigo}" font-weight="bold" text-anchor="middle">STAGE 03</text>
            <circle cx="80" cy="85" r="22" fill="none" stroke="${accentIndigo}" stroke-width="2" stroke-dasharray="10 4"/>
            <text x="80" y="145" font-family="-apple-system, sans-serif" font-size="13" fill="#f8fafc" font-weight="bold" text-anchor="middle">yt-dlp Engine</text>
            <text x="80" y="165" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="middle">Split streams / MP3</text>
          </g>

          <g transform="translate(585, 0)">
            <rect x="0" y="0" width="160" height="200" rx="14" fill="#0c121d" stroke="${accentCyan}" stroke-width="1.5"/>
            <text x="80" y="30" font-family="monospace" font-size="10" fill="${accentCyan}" font-weight="bold" text-anchor="middle">STAGE 04</text>
            <path d="M 75 90 L 75 70 L 95 65 L 95 85" fill="none" stroke="${accentCyan}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="70" cy="90" r="5" fill="${accentCyan}"/>
            <circle cx="90" cy="85" r="5" fill="${accentCyan}"/>
            <text x="80" y="145" font-family="-apple-system, sans-serif" font-size="13" fill="#f8fafc" font-weight="bold" text-anchor="middle">iTunes Tagging</text>
            <text x="80" y="165" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="middle">Artwork &amp; Metadata</text>
          </g>

          <g transform="translate(780, 0)">
            <rect x="0" y="0" width="160" height="200" rx="14" fill="#0c121d" stroke="#10b981" stroke-width="1.5"/>
            <text x="80" y="30" font-family="monospace" font-size="10" fill="#10b981" font-weight="bold" text-anchor="middle">STAGE 05</text>
            <rect x="65" y="65" width="30" height="40" rx="2" fill="none" stroke="#10b981" stroke-width="1.5"/>
            <line x1="70" y1="75" x2="85" y2="75" stroke="#10b981" stroke-width="1.5"/>
            <line x1="70" y1="85" x2="85" y2="85" stroke="#10b981" stroke-width="1.5"/>
            <line x1="70" y1="95" x2="80" y2="95" stroke="#10b981" stroke-width="1.5"/>
            <text x="80" y="145" font-family="-apple-system, sans-serif" font-size="13" fill="#f8fafc" font-weight="bold" text-anchor="middle">LRCLIB Lyrics</text>
            <text x="80" y="165" font-family="monospace" font-size="8" fill="#94a3b8" text-anchor="middle">Regex stripped lyrics</text>
          </g>
        </g>
      `;
    } else if (proj === 'tripitdown') {
      diagramContent = `
        <g transform="translate(80, 420)">
          <!-- Sidebar -->
          <rect x="0" y="0" width="260" height="360" rx="16" fill="#0c121d" stroke="rgba(255,255,255,0.04)" stroke-width="1.5" />
          <rect x="0" y="0" width="260" height="40" rx="16" fill="rgba(255,255,255,0.02)"/>
          <text x="20" y="24" font-family="monospace" font-size="11" fill="${accentCyan}" font-weight="bold">// TRIP_THREADS</text>
          
          <g transform="translate(15, 60)">
            <rect x="0" y="0" width="230" height="45" rx="8" fill="rgba(6, 182, 212, 0.08)" stroke="${accentCyan}" stroke-width="1" />
            <circle cx="20" cy="22" r="4" fill="${accentCyan}" />
            <text x="35" y="26" font-family="-apple-system, sans-serif" font-size="12" fill="#f8fafc" font-weight="bold">France Culinary Tour</text>
            <text x="215" y="26" font-family="monospace" font-size="9" fill="${accentCyan}" text-anchor="end">&gt;</text>

            <rect x="0" y="55" width="230" height="45" rx="8" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
            <circle cx="20" cy="77" r="4" fill="#94a3b8" opacity="0.4" />
            <text x="35" y="81" font-family="-apple-system, sans-serif" font-size="12" fill="#94a3b8">Tokyo Logistics Grid</text>

            <rect x="0" y="110" width="230" height="45" rx="8" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
            <circle cx="20" cy="132" r="4" fill="#94a3b8" opacity="0.4" />
            <text x="35" y="136" font-family="-apple-system, sans-serif" font-size="12" fill="#94a3b8">Hotel &amp; Train Bookings</text>
          </g>

          <rect x="15" y="300" width="230" height="40" rx="10" fill="none" stroke="${accentIndigo}" stroke-width="1.5" stroke-dasharray="4 2"/>
          <text x="130" y="324" font-family="monospace" font-size="11" fill="${accentIndigo}" font-weight="bold" text-anchor="middle">+ NEW CONVERSATION</text>
        </g>

        <g transform="translate(370, 420)">
          <rect x="0" y="0" width="630" height="360" rx="16" fill="#0c121d" stroke="rgba(255,255,255,0.04)" stroke-width="1.5" />
          <rect x="0" y="0" width="630" height="40" rx="16" fill="rgba(255,255,255,0.02)"/>
          <text x="20" y="24" font-family="monospace" font-size="11" fill="${textSecondary}">ACTIVE_THREAD // France Culinary Tour</text>

          <g transform="translate(20, 60)">
            <rect width="590" height="60" rx="12" fill="rgba(255,255,255,0.02)" />
            <text x="15" y="25" font-family="monospace" font-size="9" fill="${accentCyan}">USER_REQUEST</text>
            <text x="15" y="44" font-family="-apple-system, sans-serif" font-size="12" fill="#f8fafc">Suggest 3 top Michelin star restaurants in central Paris for dinner.</text>
          </g>

          <g transform="translate(20, 135)">
            <rect width="590" height="40" rx="10" fill="rgba(239, 68, 68, 0.05)" stroke="rgba(239, 68, 68, 0.15)" stroke-width="1" />
            <circle cx="20" cy="20" r="5" fill="#ef4444" />
            <text x="35" y="24" font-family="monospace" font-size="10" fill="#fca5a5" font-weight="bold">PRIMARY MODEL: GEMINI 2.5 PRO (HTTP 503 ERROR) — ACTIVATING FALLBACK...</text>
          </g>

          <g transform="translate(20, 190)">
            <rect width="590" height="150" rx="12" fill="rgba(16, 185, 129, 0.03)" stroke="rgba(16, 185, 129, 0.15)" stroke-width="1.5" />
            <text x="15" y="25" font-family="monospace" font-size="9" fill="#10b981">FALLBACK_RESPONSE // GEMINI 3.5 FLASH (ACTIVE)</text>
            <text x="15" y="50" font-family="-apple-system, sans-serif" font-size="12" fill="#f8fafc">1. L'Ambroisie — Exquisite traditional French haute cuisine on Place des Vosges.</text>
            <text x="15" y="75" font-family="-apple-system, sans-serif" font-size="12" fill="#f8fafc">2. Guy Savoy — Modern interpretations with exceptional service near Seine.</text>
            <text x="15" y="100" font-family="-apple-system, sans-serif" font-size="12" fill="#f8fafc">3. Arpège — Chef Alain Passard's vegetable-forward culinary masterpiece.</text>
          </g>
        </g>
      `;
    } else if (proj === 'chessverse') {
      diagramContent = `
        <g transform="translate(160, 400)">
          <!-- Chess Board 6x6 -->
          ${Array.from({length: 6}, (_, r) =>
            Array.from({length: 6}, (_, c) => {
              const dark = (r + c) % 2 === 1;
              const x = c * 120;
              const y = r * 55;
              return `<rect x="${x}" y="${y}" width="120" height="55" fill="${dark ? '#1e1b4b' : '#0c121d'}" stroke="rgba(99,102,241,0.15)" stroke-width="0.5"/>`;
            }).join('')
          ).join('')}
          
          <!-- Coordinate labels -->
          ${['a','b','c','d','e','f'].map((l, i) =>
            `<text x="${i * 120 + 60}" y="350" font-family="monospace" font-size="11" fill="${accentIndigo}" text-anchor="middle" opacity="0.6">${l}</text>`
          ).join('')}
          ${['6','5','4','3','2','1'].map((n, i) =>
            `<text x="-15" y="${i * 55 + 32}" font-family="monospace" font-size="11" fill="${accentIndigo}" text-anchor="middle" opacity="0.6">${n}</text>`
          ).join('')}
          
          <!-- Pieces -->
          <text x="300" y="90" font-size="36" text-anchor="middle" fill="${accentCyan}">♞</text>
          <text x="180" y="145" font-size="36" text-anchor="middle" fill="${accentCyan}">♜</text>
          <text x="420" y="200" font-size="36" text-anchor="middle" fill="#f1f5f9">♔</text>
          <text x="60" y="255" font-size="36" text-anchor="middle" fill="#f1f5f9">♟</text>
          <text x="540" y="310" font-size="36" text-anchor="middle" fill="${accentCyan}">♛</text>
          
          <!-- Attack arrow -->
          <path d="M 300 95 L 420 190" stroke="${accentCyan}" stroke-width="2" stroke-dasharray="6 3" opacity="0.6"/>
          <circle cx="420" cy="190" r="20" fill="none" stroke="#ef4444" stroke-width="2" opacity="0.5"/>
        </g>
      `;
    } else if (proj === 'tonaly') {
      diagramContent = `
        <g transform="translate(540, 600)">
          <!-- Circle of Fifths -->
          <circle cx="0" cy="0" r="200" fill="none" stroke="rgba(99,102,241,0.15)" stroke-width="1.5"/>
          <circle cx="0" cy="0" r="160" fill="none" stroke="rgba(6,182,212,0.1)" stroke-width="1"/>
          <circle cx="0" cy="0" r="120" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
          
          <!-- Note positions around the circle -->
          ${['C','G','D','A','E','B','F♯','D♭','A♭','E♭','B♭','F'].map((note, i) => {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const x = Math.cos(angle) * 200;
            const y = Math.sin(angle) * 200;
            const isHighlighted = ['C','G','D','A','E'].includes(note);
            return `
              <circle cx="${x}" cy="${y}" r="${isHighlighted ? 22 : 16}" fill="${isHighlighted ? (note === 'C' ? accentCyan : accentIndigo) : '#0c121d'}" stroke="${isHighlighted ? (note === 'C' ? accentCyan : accentIndigo) : 'rgba(255,255,255,0.1)'}" stroke-width="${isHighlighted ? 2 : 1}" opacity="${isHighlighted ? 1 : 0.5}"/>
              <text x="${x}" y="${y + 4}" font-family="-apple-system, sans-serif" font-size="${isHighlighted ? 12 : 10}" fill="${isHighlighted ? '#fff' : '#94a3b8'}" text-anchor="middle" font-weight="${isHighlighted ? 'bold' : 'normal'}">${note}</text>
            `;
          }).join('')}
          
          <!-- Active key indicator -->
          <text x="0" y="-5" font-family="monospace" font-size="14" fill="${accentCyan}" text-anchor="middle" font-weight="bold">KEY: C MAJOR</text>
          <text x="0" y="15" font-family="monospace" font-size="10" fill="${textSecondary}" text-anchor="middle">I → V → ii → IV</text>
        </g>
      `;
    } else if (proj === 'laresdj') {
      diagramContent = `
        <g transform="translate(130, 420)">
          <!-- Mixer Channels -->
          ${[0, 1, 2, 3].map(ch => {
            const x = ch * 200;
            const labels = ['DECK A', 'DECK B', 'FX BUS', 'MASTER'];
            const levels = [0.7, 0.55, 0.4, 0.85];
            return `
              <g transform="translate(${x}, 0)">
                <rect x="0" y="0" width="170" height="340" rx="12" fill="#0c121d" stroke="rgba(255,255,255,0.04)" stroke-width="1.5"/>
                <text x="85" y="25" font-family="monospace" font-size="10" fill="${ch === 3 ? accentCyan : textSecondary}" text-anchor="middle" font-weight="bold">${labels[ch]}</text>
                
                <!-- Fader track -->
                <rect x="75" y="50" width="20" height="220" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
                <!-- Fader fill -->
                <rect x="75" y="${50 + 220 * (1 - levels[ch])}" width="20" height="${220 * levels[ch]}" rx="10" fill="url(#accentGrad)" opacity="0.3"/>
                <!-- Fader knob -->
                <rect x="70" y="${50 + 220 * (1 - levels[ch]) - 8}" width="30" height="16" rx="4" fill="${ch === 3 ? accentCyan : accentIndigo}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
                
                <!-- Level meter -->
                <rect x="25" y="50" width="8" height="220" rx="4" fill="rgba(255,255,255,0.03)"/>
                <rect x="25" y="${50 + 220 * (1 - levels[ch])}" width="8" height="${220 * levels[ch]}" rx="4" fill="${levels[ch] > 0.8 ? '#ef4444' : accentCyan}"/>
                
                <!-- BPM -->
                <text x="85" y="300" font-family="monospace" font-size="18" fill="${textPrimary}" text-anchor="middle" font-weight="bold">${ch < 2 ? (ch === 0 ? '128.0' : '127.8') : ''}</text>
                ${ch < 2 ? `<text x="85" y="320" font-family="monospace" font-size="9" fill="${accentCyan}" text-anchor="middle">BPM</text>` : ''}
              </g>
            `;
          }).join('')}
        </g>
      `;
    } else {
      diagramContent = `
        <!-- Coordinate Axes -->
        <g opacity="0.8">
          <path d="M 160 400 L 160 740 M 140 720 L 920 720" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
          <path d="M 155 410 L 160 400 L 165 410" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 910 715 L 920 720 L 910 725" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          
          <text x="130" y="440" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="end">100%</text>
          <text x="130" y="580" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="end">50%</text>
          <text x="130" y="725" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="end">0%</text>

          <text x="350" y="755" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="middle">BEFORE</text>
          <text x="750" y="755" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="middle">AFTER</text>
        </g>

        <!-- Curve -->
        <path d="M 160 460 C 350 460, 500 700, 750 700" fill="none" stroke="url(#accentGrad)" stroke-width="6" stroke-linecap="round"/>
        
        <!-- Glowing Points & Values -->
        <g>
          <circle cx="160" cy="460" r="10" fill="#ef4444" opacity="0.2"/>
          <circle cx="160" cy="460" r="5" fill="#ef4444"/>
          <text x="180" y="455" font-family="monospace" font-size="12" fill="#ef4444" font-weight="bold">1200ms</text>
        </g>
        
        <g>
          <circle cx="750" cy="700" r="10" fill="${accentCyan}" opacity="0.2"/>
          <circle cx="750" cy="700" r="5" fill="${accentCyan}"/>
          <text x="770" y="695" font-family="monospace" font-size="12" fill="${accentCyan}" font-weight="bold">85ms (14x Fast)</text>
        </g>

        <!-- Optimization annotation badge -->
        <g transform="translate(420, 480)">
          <rect width="240" height="50" rx="12" fill="#0c121d" fill-opacity="0.85" stroke="rgba(6, 182, 212, 0.3)" stroke-width="1.5"/>
          <text x="120" y="30" font-family="monospace" font-size="12" fill="${accentCyan}" font-weight="bold" text-anchor="middle" letter-spacing="1">OPTIMIZATION INBOUND</text>
        </g>
      `;
    }

    const titleLines = splitTitleToLines(post.hook, 36);
    const titleLinesHtml = titleLines.map((line, i) => `
      <text x="60" y="${175 + i * 56}" class="title-text" font-size="48" font-weight="900" fill="${textPrimary}" letter-spacing="-0.5px">
        ${line.toUpperCase()}
      </text>
    `).join('');

    const gridPattern = gridEnabled ? `
      <rect width="1080" height="1080" fill="url(#grid)" />
      <circle cx="540" cy="540" r="400" fill="url(#accentGrad)" opacity="0.04" filter="blur(80px)" />
    ` : '';

    const hudDecorations = hudEnabled ? `
      <!-- Sleek HUD Frame & Corner Brackets -->
      <rect x="50" y="50" width="980" height="980" rx="16" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.5" />
      
      <path d="M 80 50 L 50 50 L 50 80" fill="none" stroke="${accentIndigo}" stroke-width="3.5" stroke-linecap="round" />
      <path d="M 1000 50 L 1030 50 L 1030 80" fill="none" stroke="${accentIndigo}" stroke-width="3.5" stroke-linecap="round" />
      <path d="M 50 1000 L 50 1030 L 80 1030" fill="none" stroke="${accentCyan}" stroke-width="3.5" stroke-linecap="round" />
      <path d="M 1030 1000 L 1030 1030 L 1000 1030" fill="none" stroke="${accentCyan}" stroke-width="3.5" stroke-linecap="round" />
      
      <!-- Top labels -->
      <text x="75" y="115" class="mono-text" font-size="20" fill="${accentCyan}" letter-spacing="3" font-weight="bold">// SYSTEM_PIPELINE // ${post.project.toUpperCase()}</text>
      <text x="1005" y="115" class="mono-text" font-size="14" fill="${textSecondary}" text-anchor="end" letter-spacing="2">// ${post.post_type.toUpperCase()}</text>
    ` : `
      <!-- Simplified Header -->
      <text x="60" y="100" class="mono-text" font-size="22" fill="${accentCyan}" letter-spacing="3" font-weight="bold">${post.project.toUpperCase()}</text>
    `;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080" style="background-color: ${bg};">
        <defs>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${accentIndigo}" />
            <stop offset="100%" stop-color="${accentCyan}" />
          </linearGradient>
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0c121d" />
            <stop offset="100%" stop-color="#070b12" />
          </linearGradient>
          <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${accentIndigo}" stop-opacity="0.12" />
            <stop offset="100%" stop-color="${accentCyan}" stop-opacity="0.12" />
          </linearGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>
          </pattern>
          <linearGradient id="beforeGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#ef4444" stop-opacity="0.0" />
          </linearGradient>
          <linearGradient id="afterGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0" />
          </linearGradient>
          <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="${accentCyan}" />
          </linearGradient>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&amp;family=Outfit:wght@500;800;900&amp;display=swap');
            .title-text {
              font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            }
            .mono-text {
              font-family: 'JetBrains Mono', monospace;
            }
          </style>
        </defs>
        
        ${gridPattern}
        ${hudDecorations}
        ${titleLinesHtml}
        
        ${diagramContent}
        
        <line x1="60" y1="965" x2="1020" y2="965" stroke="rgba(255,255,255,0.05)" stroke-width="1.5"/>
        <text x="75" y="1005" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="18" fill="${textSecondary}" font-weight="500">bervos.org</text>
        <g transform="translate(970, 982) scale(0.065)" fill="rgba(255,255,255,0.8)">
          <path d="M 418.50 562.30 C403.08,560.26 385.97,548.85 379.78,536.49 C373.30,523.57 371.69,508.98 375.38,496.62 C383.35,469.89 410.57,454.86 438.91,461.54 C464.42,467.55 481.19,492.64 477.16,518.75 C472.81,546.93 447.01,566.08 418.50,562.30 ZM 435.59 540.17 C442.16,537.90 446.06,534.71 449.81,528.50 C459.94,511.76 452.94,488.26 436.13,482.53 C430.72,480.68 419.85,480.61 414.90,482.37 C408.95,484.50 403.23,489.86 399.99,496.33 C397.45,501.42 397.00,503.47 397.00,509.98 C397.00,521.35 399.11,527.24 405.45,533.58 C413.52,541.65 424.43,544.03 435.59,540.17 ZM 510.58 561.93 C501.97,560.94 491.12,555.79 485.53,550.04 L 481.56 545.96 L 488.66 538.86 L 495.76 531.76 L 501.19 535.86 C510.27,542.71 520.57,544.88 528.45,541.58 C533.53,539.46 535.47,535.96 534.02,531.55 C532.52,527.03 529.33,524.82 517.84,520.39 C494.57,511.40 488.78,505.21 488.78,489.34 C488.78,472.32 499.98,461.78 519.70,460.27 C532.30,459.30 544.98,463.24 554.00,470.91 L 557.50 473.89 L 551.50 480.02 C543.07,488.62 542.90,488.68 537.58,484.61 C527.05,476.58 511.00,478.50 511.00,487.80 C511.00,491.73 515.89,495.42 526.50,499.48 C541.39,505.19 545.26,507.38 550.26,512.94 C555.67,518.97 557.48,525.04 556.78,534.86 C555.98,545.99 550.63,553.51 540.06,558.39 C537.06,559.77 532.11,561.17 529.06,561.49 C526.00,561.82 522.15,562.23 520.50,562.41 C518.85,562.59 514.38,562.37 510.58,561.93 ZM 20.00 511.71 L 20.00 462.27 L 29.75 461.83 C35.11,461.59 47.38,461.65 57.00,461.95 C73.84,462.49 74.68,462.62 79.23,465.28 C85.55,468.99 89.66,473.57 91.49,478.93 C94.65,488.20 92.93,496.95 86.65,503.51 L 82.42 507.92 L 86.82 511.61 C93.00,516.77 95.98,523.57 95.99,532.55 C96.01,544.61 90.82,552.34 79.00,557.91 C73.58,560.46 73.13,560.50 46.75,560.82 L 20.00 561.15 L 20.00 511.71 ZM 68.39 540.91 C75.94,534.97 75.60,524.78 67.70,519.96 C65.05,518.34 62.65,518.01 53.75,518.00 L 43.00 518.00 L 43.00 530.50 L 43.00 543.00 L 54.37 543.00 C64.38,543.00 66.05,542.75 68.39,540.91 ZM 65.72 498.65 C69.49,496.70 71.06,492.32 69.88,487.03 C68.58,481.15 63.50,479.01 50.82,479.01 L 43.14 479.00 L 42.82 488.39 C42.35,502.31 41.56,501.34 52.85,500.79 C59.11,500.48 63.63,499.73 65.72,498.65 ZM 110.00 511.59 L 110.00 462.15 L 118.75 461.82 C123.56,461.65 139.54,461.66 154.25,461.85 L 181.00 462.19 L 181.00 471.60 L 181.00 481.00 L 157.00 481.00 L 133.00 481.00 L 133.00 491.00 L 133.00 501.00 L 155.04 501.00 L 177.08 501.00 L 176.79 510.25 L 176.50 519.50 L 154.82 519.77 L 133.15 520.04 L 132.82 528.27 C132.27,542.46 129.36,540.92 157.32,541.23 L 181.50 541.50 L 181.50 551.00 L 181.50 560.50 L 145.75 560.76 L 110.00 561.03 L 110.00 511.59 ZM 196.00 511.50 L 196.00 462.00 L 204.25 461.84 C208.79,461.75 219.93,461.80 229.00,461.95 C247.50,462.26 251.73,463.20 259.20,468.66 C267.54,474.76 271.94,488.07 269.11,498.61 C266.74,507.41 258.76,515.49 249.79,518.18 C247.39,518.90 246.10,519.82 246.40,520.60 C246.66,521.29 253.43,530.39 261.44,540.82 C269.45,551.25 276.00,560.06 276.00,560.39 C276.00,560.73 270.04,560.98 262.75,560.97 L 249.50 560.93 L 235.50 541.40 C227.80,530.66 220.94,521.40 220.25,520.81 C219.26,519.97 219.00,523.98 219.00,540.38 L 219.00 561.00 L 207.50 561.00 L 196.00 561.00 L 196.00 511.50 ZM 243.60 499.60 C246.39,496.81 247.00,495.44 247.00,492.00 C247.00,482.72 241.42,479.00 227.48,479.00 L 219.00 479.00 L 219.00 491.00 L 219.00 503.00 L 229.60 503.00 L 240.20 503.00 L 243.60 499.60 ZM 294.69 512.28 C284.38,485.45 275.96,463.16 275.98,462.75 C275.99,462.34 281.33,462.00 287.84,462.00 L 299.67 462.00 L 310.96 493.25 C317.17,510.44 322.55,525.06 322.91,525.73 C323.27,526.41 327.57,516.06 332.46,502.73 C337.36,489.41 342.73,474.79 344.40,470.25 L 347.43 462.00 L 359.21 462.00 C365.70,462.00 370.99,462.34 370.99,462.75 C370.98,463.16 362.46,485.33 352.06,512.00 L 333.14 560.50 L 323.28 560.78 L 313.42 561.07 L 294.69 512.28 ZM 264.53 426.50 C252.05,413.85 234.89,396.49 226.39,387.93 L 210.94 372.37 L 219.95 368.68 C224.90,366.66 230.06,365.00 231.42,365.00 C234.27,365.00 250.54,374.89 259.99,382.37 C263.56,385.19 270.96,391.66 276.45,396.75 C281.93,401.84 286.77,406.00 287.21,406.00 C288.13,406.00 305.00,388.91 305.00,387.97 C305.00,387.25 300.13,385.02 284.44,378.54 C257.79,367.54 232.23,347.35 213.17,322.24 L 206.90 313.98 L 211.33 308.24 C213.76,305.08 216.65,301.70 217.74,300.72 C219.67,298.99 219.82,299.03 222.62,302.29 C224.20,304.14 228.38,309.35 231.90,313.86 C245.48,331.29 268.14,350.21 286.50,359.45 C304.99,368.75 318.84,371.94 344.75,372.88 L 362.00 373.50 L 324.61 411.50 L 287.22 449.50 L 264.53 426.50 ZM 128.00 387.87 C128.00,386.27 146.33,350.47 154.04,337.00 C165.08,317.73 182.44,292.09 196.04,275.00 C209.21,258.43 248.82,217.68 252.64,216.76 C256.55,215.82 257.51,217.33 262.06,231.51 C266.30,244.75 270.86,254.50 277.16,263.76 C280.05,268.02 282.49,271.63 282.58,271.79 C283.09,272.68 296.59,263.64 308.78,254.26 C357.25,216.96 403.29,162.88 438.84,101.50 C443.30,93.80 448.34,85.25 450.04,82.50 L 453.12 77.50 L 452.58 81.50 C451.86,86.83 443.92,110.79 438.35,124.50 C429.89,145.29 417.13,167.46 401.53,188.50 C377.43,220.99 339.40,257.59 307.54,278.97 C301.74,282.86 297.00,286.44 297.00,286.93 C297.00,288.24 306.65,296.68 313.37,301.25 C326.64,310.27 347.99,318.58 364.40,321.13 C374.07,322.63 387.30,321.78 393.50,319.26 L 398.50 317.24 L 394.78 315.68 C392.74,314.83 383.63,312.23 374.53,309.92 C365.44,307.60 358.01,305.44 358.03,305.10 C358.05,304.77 360.17,302.92 362.75,301.00 C379.06,288.80 394.13,269.28 396.31,257.50 C396.61,255.85 397.20,253.62 397.61,252.55 C398.03,251.48 392.09,256.29 384.43,263.23 C366.38,279.58 344.10,297.85 341.29,298.60 C338.59,299.33 322.50,291.12 322.50,289.02 C322.50,287.64 325.96,284.58 344.56,269.50 C358.30,258.36 390.75,225.89 402.50,211.50 C416.74,194.07 416.98,193.96 419.92,203.47 C423.04,213.59 424.23,225.71 423.85,243.56 C423.66,252.60 423.85,260.00 424.27,260.00 C424.69,260.00 433.69,251.47 444.27,241.05 L 463.50 222.11 L 444.25 202.79 C433.66,192.17 425.00,183.09 425.00,182.62 C425.00,182.15 428.70,175.95 433.21,168.85 L 441.42 155.93 L 474.46 189.01 L 507.50 222.09 L 479.50 249.80 C419.32,309.38 402.15,323.67 383.86,329.47 C362.42,336.27 340.52,334.43 318.10,323.92 C289.96,310.74 268.30,289.39 253.52,260.25 C250.08,253.47 247.22,249.00 246.32,249.00 C245.49,249.00 241.15,252.73 236.66,257.28 C214.48,279.79 181.48,323.89 171.96,343.77 C169.78,348.32 168.00,352.21 168.00,352.42 C168.00,353.36 182.60,348.33 194.22,343.39 L 206.94 337.98 L 210.95 342.33 C216.42,348.26 219.31,352.02 218.80,352.53 C217.23,354.11 168.45,374.54 148.97,381.78 C132.71,387.82 128.00,389.19 128.00,387.87 ZM 122.40 360.00 C124.22,347.42 135.19,317.27 145.06,297.73 C158.20,271.71 169.48,255.40 192.57,229.01 C206.79,212.75 232.18,189.45 246.66,179.38 C251.46,176.04 252.07,175.87 255.27,176.92 C258.80,178.09 267.00,184.46 267.00,186.04 C267.00,186.53 259.91,192.87 251.25,200.12 C223.15,223.67 192.66,255.89 172.85,283.00 C157.17,304.46 147.36,320.02 134.05,344.52 C128.98,353.86 124.14,362.17 123.29,363.00 C121.91,364.35 121.82,364.04 122.40,360.00 ZM 322.00 357.57 C307.28,354.48 293.93,348.52 277.95,337.90 C265.12,329.39 245.60,309.80 236.69,296.50 C233.01,291.00 229.99,286.00 229.99,285.38 C230.00,283.99 241.70,272.50 243.11,272.50 C243.68,272.50 245.50,274.98 247.16,278.00 C256.78,295.52 283.21,321.33 303.29,332.82 C316.44,340.34 343.73,348.01 357.30,348.00 C369.00,347.99 391.60,342.76 401.32,337.83 C408.21,334.33 407.51,336.51 400.18,341.38 C391.68,347.03 377.90,353.18 367.20,356.10 C357.25,358.81 331.84,359.64 322.00,357.57 ZM 99.01 254.51 L 66.53 222.02 L 73.02 215.40 C89.82,198.25 133.47,156.96 142.46,149.72 C152.77,141.43 162.47,136.17 175.50,131.83 C182.07,129.64 184.00,129.50 207.00,129.50 C231.20,129.50 231.60,129.53 239.50,132.28 C243.90,133.81 252.90,137.74 259.50,141.01 C281.97,152.16 297.76,166.49 315.38,191.75 C318.55,196.29 321.46,200.00 321.86,200.00 C322.70,200.00 341.63,179.98 351.64,168.50 C376.70,139.76 403.93,100.66 403.99,93.33 C404.00,91.76 393.71,95.00 374.00,102.78 C353.04,111.05 354.30,110.88 348.42,106.23 C338.94,98.72 338.92,97.59 348.14,93.84 C376.91,82.17 432.89,59.87 438.75,57.75 C445.73,55.22 446.00,55.19 446.00,57.09 C446.00,59.57 441.04,69.47 430.41,88.18 C414.53,116.17 396.04,143.57 376.62,167.92 C353.60,196.78 316.68,234.46 315.32,230.48 C315.13,229.94 312.06,224.10 308.49,217.50 C288.60,180.71 258.18,154.77 223.58,145.06 C217.57,143.38 212.15,142.00 211.54,142.00 C209.92,142.00 193.96,157.90 188.61,164.86 C183.40,171.63 176.00,186.22 176.00,189.72 C176.00,191.84 176.55,191.59 182.32,186.77 C185.80,183.87 193.73,176.91 199.93,171.29 C213.18,159.31 215.85,158.07 223.31,160.49 C230.77,162.92 238.00,166.12 238.00,167.00 C238.00,167.42 234.74,170.23 230.75,173.24 C213.50,186.28 180.50,218.94 163.52,239.75 C160.26,243.74 157.26,247.00 156.84,247.00 C155.90,247.00 152.57,236.37 150.97,228.27 C150.21,224.41 149.91,215.32 150.15,203.11 C150.35,192.60 150.16,184.00 149.74,184.00 C149.31,184.00 140.31,192.50 129.74,202.90 L 110.51 221.79 L 126.02 237.65 C134.55,246.37 142.79,255.15 144.33,257.18 C147.08,260.79 147.10,260.92 145.46,264.18 C142.57,269.95 132.52,286.96 131.99,286.98 C131.72,286.99 116.87,272.38 99.01,254.51 ZM 319.58 173.55 C314.60,166.33 295.74,148.16 284.50,139.78 C273.57,131.62 259.07,124.24 245.00,119.67 C229.24,114.56 222.34,113.50 205.00,113.53 C188.90,113.56 183.43,114.36 169.69,118.67 C165.39,120.02 161.34,120.92 160.69,120.67 C159.09,120.07 180.64,109.78 190.31,106.53 C203.57,102.08 219.62,100.96 240.14,103.06 C265.94,105.69 296.63,121.72 319.49,144.50 C329.59,154.57 335.00,162.05 335.00,165.96 C335.00,167.78 333.42,170.13 329.72,173.78 C326.81,176.65 324.19,179.00 323.88,179.00 C323.58,179.00 321.64,176.55 319.58,173.55 ZM 330.50 137.56 C313.31,119.93 302.38,111.46 286.00,103.09 C266.47,93.11 252.43,89.50 227.22,87.98 C218.11,87.43 210.50,86.84 210.32,86.66 C209.49,85.83 286.34,11.00 288.02,11.00 C289.20,11.00 351.46,73.79 351.79,75.31 C352.15,76.97 333.59,85.98 328.33,86.68 C324.95,87.14 323.83,86.68 318.89,82.84 C315.80,80.45 307.53,72.98 300.51,66.24 C293.49,59.51 287.31,54.00 286.78,54.00 C285.44,54.00 266.94,72.31 267.27,73.31 C267.42,73.76 273.44,76.74 280.65,79.92 C312.27,93.88 330.76,106.67 351.30,128.79 C355.54,133.35 359.00,137.43 359.00,137.86 C359.00,138.92 347.07,153.01 346.20,152.98 C345.82,152.96 338.75,146.03 330.50,137.56 Z" fill="rgba(255,255,255,1)"/>
        </g>
      </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const generateImageWithGemini = async (post: SocialPost) => {
    setGeneratingId(post.id);
    const steps = [
      'Initializing gemini-3.1-flash-lite-image agent...',
      'Parsing brand visual guidelines & palettes...',
      'Analyzing caption hooks and post context...',
      'Synthesizing diagram layer vectors...',
      'Composing HUD borders and alignment nodes...',
      'Rendering final 1080x1080px frame...',
      'Saving generated output to memory...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setGenerationStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    const dataUrl = generateBrandedSvg(post, showGrid, showHud);
    setGeneratedImages(prev => {
      const next = { ...prev, [post.id]: dataUrl };
      try {
        localStorage.setItem('bervos_social_generated_images', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      return next;
    });

    setGeneratingId(null);
    setGenerationStep('');
  };

  const deleteGeneratedImage = (postId: string) => {
    setGeneratedImages(prev => {
      const next = { ...prev };
      delete next[postId];
      try {
        localStorage.setItem('bervos_social_generated_images', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      return next;
    });
  };

  const generateCustomDraft = async () => {
    if (!createPrompt.trim()) return;
    setGeneratingCustomDraft(true);
    setCustomDraft(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/social/custom-draft', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project: createProject,
          prompt: createPrompt,
          postType: createPostType
        })
      });
      if (!res.ok) throw new Error(`Draft generation failed (Status: ${res.status})`);
      const data = await res.json();
      setCustomDraft(data.draft);
    } catch (err: any) {
      console.error('[Social] Custom draft generation failed:', err);
      setNotification({
        title: 'Generation Failed',
        message: err.message || 'Failed to generate post draft. Please check your API key.',
        type: 'error'
      });
    } finally {
      setGeneratingCustomDraft(false);
    }
  };

  const saveCustomPost = async () => {
    if (!customDraft) return;
    setSavingCustomPost(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customDraft)
      });
      if (!res.ok) throw new Error(`Saving post failed (Status: ${res.status})`);
      await fetchPosts();
      setNotification({
        title: 'Post Created',
        message: 'Successfully generated and added a custom post draft to the queue.',
        type: 'success'
      });
      setShowCreateModal(false);
      setCreatePrompt('');
      setCreateProject('None');
      setCustomDraft(null);
    } catch (err: any) {
      console.error('[Social] Saving post failed:', err);
      setNotification({
        title: 'Save Failed',
        message: err.message || 'Failed to save post to the queue.',
        type: 'error'
      });
    } finally {
      setSavingCustomPost(false);
    }
  };

  const runGenerationPipeline = async () => {
    setGeneratingPipeline(true);
    setGenerationStatusText('Connecting to content pipeline...');
    try {
      const idToken = await user.getIdToken();

      const steps = [
        'Fetching existing queue items...',
        'Checking ecosystem representation...',
        'Filtering out duplicate project posts...',
        'Running generation algorithm...',
        'Saving generated posts to Firestore...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setGenerationStatusText(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error(`Generation pipeline failed (Status: ${res.status})`);
      const data = await res.json();

      if (data.generated > 0) {
        setGenerationStatusText(`Generated ${data.generated} new posts!`);
        await fetchPosts();
      } else {
        setGenerationStatusText('Ecosystem up-to-date. No new posts needed.');
      }

      setTimeout(() => {
        setGeneratingPipeline(false);
        setGenerationStatusText('');
      }, 2000);
    } catch (err) {
      console.error('[Social] Generation failed:', err);
      setGenerationStatusText('Generation failed. Please try again.');
      setTimeout(() => {
        setGeneratingPipeline(false);
        setGenerationStatusText('');
      }, 3000);
    }
  };

  const handleApprove = (post: SocialPost) => {
    updatePost(post.id, { status: 'Approved' });
  };

  const handleUnapprove = (post: SocialPost) => {
    updatePost(post.id, { status: 'Draft' });
  };

  const handlePublish = (post: SocialPost) => {
    updatePost(post.id, { status: 'Published' });
  };

  const getPngDataUrl = (post: SocialPost): Promise<string> => {
    return new Promise((resolve, reject) => {
      const svgDataUrl = generateBrandedSvg(post, showGrid, showHud);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 2160;
        canvas.height = 2160;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#080b12';
          ctx.fillRect(0, 0, 2160, 2160);
          ctx.drawImage(img, 0, 0, 2160, 2160);
          try {
            const pngUrl = canvas.toDataURL('image/png');
            resolve(pngUrl);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error('Canvas 2D context not available'));
        }
      };
      img.onerror = (err) => reject(err);
      img.src = svgDataUrl;
    });
  };

  const handlePublishToInstagram = async (post: SocialPost, forceImmediate = false) => {
    setPublishingInstagram(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const imageData = await getPngDataUrl(post);
      const idToken = await user.getIdToken();

      const payload: Record<string, any> = { imageData };

      if (!forceImmediate && post.scheduled_at) {
        payload.scheduled_at = post.scheduled_at;
      }

      const res = await fetch(`/api/social/${post.id}/instagram`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to send to Instagram');
        throw new Error(errMsg);
      }

      if (data.success) {
        if (data.scheduled) {
          // Scheduled successfully
          setNotification({
            title: 'Schedule Success',
            message: `Post scheduled for ${data.scheduledDate}`,
            type: 'success'
          });
          setPosts(prev => prev.map(p =>
            p.id === post.id ? { ...p, status: 'Scheduled', scheduled_at: data.scheduled_at, suggested_date: data.scheduledDate } : p
          ));
          setSelectedPost(prev => prev ? { ...prev, status: 'Scheduled', scheduled_at: data.scheduled_at, suggested_date: data.scheduledDate } : null);
        } else {
          // Published immediately
          setNotification({
            title: 'Publish Success',
            message: 'Successfully published your branded post to Instagram!',
            type: 'success',
            ...(data.permalink ? { link: { url: data.permalink, label: 'Visit Post' } } : {})
          });
          setPosts(prev => prev.map(p =>
            p.id === post.id ? { ...p, status: 'Published', published_at: new Date().toISOString(), suggested_date: todayStr, scheduled_at: null, instagram_permalink: data.permalink || null } : p
          ));
          setSelectedPost(prev => prev ? { ...prev, status: 'Published', published_at: new Date().toISOString(), suggested_date: todayStr, scheduled_at: null, instagram_permalink: data.permalink || null } : null);
        }
      } else if (data.warning) {
        setNotification({
          title: 'Instagram Warning',
          message: `${data.warning}\n\nGenerated public image URL:\n${data.imageUrl}\n\nDetails:\n${data.details}`,
          type: 'warning'
        });
      }
    } catch (err: any) {
      console.error('[Instagram] Publish failed:', err);
      setNotification({
        title: 'Publish Failed',
        message: err.message,
        type: 'error'
      });
    } finally {
      setPublishingInstagram(false);
    }
  };

  const handleCancelSchedule = async (post: SocialPost) => {
    setPublishingInstagram(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/social/${post.id}/instagram/schedule`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to cancel schedule');
        throw new Error(errMsg);
      }

      if (data.success) {
        setNotification({
          title: 'Schedule Cancelled',
          message: 'Successfully cancelled the scheduled Instagram post',
          type: 'success'
        });
        setPosts(prev => prev.map(p =>
          p.id === post.id ? { ...p, status: 'Approved', instagram_scheduled_id: null, scheduled_at: null } : p
        ));
        setSelectedPost(prev => prev ? { ...prev, status: 'Approved', instagram_scheduled_id: null, scheduled_at: null } : null);
      } else if (data.warning) {
        setNotification({
          title: 'Instagram Warning',
          message: data.warning,
          type: 'warning'
        });
      }
    } catch (err: any) {
      console.error('[Instagram] Cancel schedule failed:', err);
      setNotification({
        title: 'Cancel Failed',
        message: err.message,
        type: 'error'
      });
    } finally {
      setPublishingInstagram(false);
    }
  };

  const [regeneratingCaptionId, setRegeneratingCaptionId] = useState<string | null>(null);

  const handleRegenerateCaption = async (post: SocialPost) => {
    setRegeneratingCaptionId(post.id);
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/social/${post.id}/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to regenerate caption');
      }

      setPosts(prev => prev.map(p =>
        p.id === post.id ? { ...p, caption_english: data.caption_english, caption_spanish: data.caption_spanish, updated_at: new Date().toISOString() } : p
      ));
      setSelectedPost(prev => prev ? { ...prev, caption_english: data.caption_english, caption_spanish: data.caption_spanish, updated_at: new Date().toISOString() } : null);
      
      setEditedCaptionEn(data.caption_english);
      setEditedCaptionEs(data.caption_spanish);

      setNotification({
        title: 'Regeneration Success',
        message: 'Successfully rewritten caption and summary using Gemini AI!',
        type: 'success'
      });
    } catch (err: any) {
      console.error('[AI] Caption regeneration failed:', err);
      setNotification({
        title: 'Regeneration Failed',
        message: err.message || 'Unknown error occurred.',
        type: 'error'
      });
    } finally {
      setRegeneratingCaptionId(null);
      setSaving(false);
    }
  };

  const handleRequestRevision = (post: SocialPost) => {
    if (!feedbackText.trim()) return;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newNote = `[${timestamp}] ${feedbackText.trim()}`;
    const updatedFeedback = post.user_feedback 
      ? `${post.user_feedback}\n${newNote}` 
      : newNote;

    updatePost(post.id, {
      status: 'Needs AI Revision',
      user_feedback: updatedFeedback
    });
    setFeedbackText('');
    setShowFeedbackInput(false);
  };

  const handleSaveCaption = (post: SocialPost) => {
    updatePost(post.id, {
      caption_english: editedCaptionEn,
      caption_spanish: editedCaptionEs,
    });
    setEditingCaption(false);
  };

  const handleSaveVisual = (post: SocialPost) => {
    updatePost(post.id, {
      visual_instruction: editedVisualInstruction,
    });
    setEditingVisual(false);
  };

  const filteredPosts = posts
    .filter(p => {
      const matchesStatus = selectedStatuses.includes(p.status);
      const matchesSearch = !search ||
        p.hook.toLowerCase().includes(search.toLowerCase()) ||
        p.project.toLowerCase().includes(search.toLowerCase()) ||
        p.caption_english.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          if (!a.suggested_date) return 1;
          if (!b.suggested_date) return -1;
          return a.suggested_date.localeCompare(b.suggested_date);
        case 'date_desc':
          if (!a.suggested_date) return 1;
          if (!b.suggested_date) return -1;
          return b.suggested_date.localeCompare(a.suggested_date);
        case 'project': {
          const projCmp = a.project.localeCompare(b.project);
          if (projCmp !== 0) return projCmp;
          if (!a.suggested_date) return 1;
          if (!b.suggested_date) return -1;
          return a.suggested_date.localeCompare(b.suggested_date);
        }
        case 'status': {
          const order = ['Draft', 'Needs AI Revision', 'Approved', 'Scheduled', 'Published'];
          const statusCmp = order.indexOf(a.status) - order.indexOf(b.status);
          if (statusCmp !== 0) return statusCmp;
          if (!a.suggested_date) return 1;
          if (!b.suggested_date) return -1;
          return a.suggested_date.localeCompare(b.suggested_date);
        }
        case 'updated': return b.updated_at.localeCompare(a.updated_at);
        default: return 0;
      }
    });

  const handlePrevPost = useCallback(() => {
    if (!selectedPost) return;
    const currentIndex = filteredPosts.findIndex(p => p.id === selectedPost.id);
    if (currentIndex > 0) {
      const prevPost = filteredPosts[currentIndex - 1];
      setSelectedPost(prevPost);
      setEditedCaptionEn(prevPost.caption_english);
      setEditedCaptionEs(prevPost.caption_spanish);
      setEditingCaption(false);
      setEditingDate(false);
      setShowFeedbackInput(false);
      setFeedbackText('');
    }
  }, [selectedPost, filteredPosts]);

  const handleNextPost = useCallback(() => {
    if (!selectedPost) return;
    const currentIndex = filteredPosts.findIndex(p => p.id === selectedPost.id);
    if (currentIndex >= 0 && currentIndex < filteredPosts.length - 1) {
      const nextPost = filteredPosts[currentIndex + 1];
      setSelectedPost(nextPost);
      setEditedCaptionEn(nextPost.caption_english);
      setEditedCaptionEs(nextPost.caption_spanish);
      setEditingCaption(false);
      setEditingDate(false);
      setShowFeedbackInput(false);
      setFeedbackText('');
    }
  }, [selectedPost, filteredPosts]);

  // Keyboard navigation for post detail and lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        if (e.key === 'Escape') {
          setLightboxIndex(null);
        } else if (e.key === 'ArrowLeft') {
          setLightboxIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev);
        } else if (e.key === 'ArrowRight') {
          const slidesCount = selectedPost ? (selectedPost.slides || ['__generated__', ...(selectedPost.screenshots || [])]).length : 0;
          setLightboxIndex(prev => prev !== null && prev < slidesCount - 1 ? prev + 1 : prev);
        }
        return;
      }
      if (selectedPost && !editingCaption && !editingDate && !showFeedbackInput) {
        if (e.key === 'ArrowLeft') {
          handlePrevPost();
        } else if (e.key === 'ArrowRight') {
          handleNextPost();
        } else if (e.key === 'Escape') {
          setSelectedPost(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPost, editingCaption, editingDate, showFeedbackInput, lightboxIndex, handlePrevPost, handleNextPost]);

  const statusCounts = {
    Draft: posts.filter(p => p.status === 'Draft').length,
    Approved: posts.filter(p => p.status === 'Approved').length,
    Scheduled: posts.filter(p => p.status === 'Scheduled').length,
    Published: posts.filter(p => p.status === 'Published').length,
    'Needs AI Revision': posts.filter(p => p.status === 'Needs AI Revision').length,
  };

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-indigo-400 font-mono text-sm">
          <Loader2 size={16} className="animate-spin" />
          <span>Loading social queue...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="tech-card p-6 h-48 bg-white/[0.01] border-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="tech-card border-red-500/20 p-8 text-center">
        <span className="mono-label !text-red-400 block mb-2">// SOCIAL_QUEUE_ERROR</span>
        <p className="text-slate-400 text-sm font-mono">{error}</p>
        <button
          onClick={fetchPosts}
          className="mt-4 px-4 py-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg text-xs font-mono uppercase text-white cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Stats & Run Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <span className="mono-label !text-indigo-400 mb-1 block">Content_Pipeline // Social</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter glow-text">Social Queue</h2>
          <p className="text-slate-500 text-xs font-mono mt-1">{posts.filter(p => p.status !== 'Published').length} posts in pipeline · {posts.filter(p => p.status === 'Published').length} published</p>
        </div>

        {/* Stats & Generator Button */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Stats Boxes */}
          <div className="grid grid-cols-3 gap-3 bg-white/[0.02] border border-white/5 px-2 py-1.5 rounded-xl">
            <div className="px-3 py-1 text-center min-w-[80px]">
              <span className="block text-[9px] font-mono text-slate-500 uppercase">Total</span>
              <span className="text-sm font-bold text-white font-mono">{posts.length}</span>
            </div>
            <div className="px-3 py-1 text-center border-l border-white/5 min-w-[80px]">
              <span className="block text-[9px] font-mono text-slate-500 uppercase">Approved</span>
              <span className="text-sm font-bold text-green-400 font-mono">
                {posts.filter(p => p.status === 'Approved').length}
              </span>
            </div>
            <a href="https://www.instagram.com/bervosorg" target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-center border-l border-white/5 min-w-[80px] hover:bg-white/[0.03] rounded-lg transition-all group">
              <span className="block text-[9px] font-mono text-slate-500 uppercase group-hover:text-slate-400 transition-colors">Published</span>
              <span className="text-sm font-bold text-slate-400 font-mono group-hover:text-white transition-colors">
                {posts.filter(p => p.status === 'Published').length}
              </span>
            </a>
          </div>

          {/* Trigger Button */}
          <div className="flex items-center gap-2">
            {generatingPipeline ? (
              <button
                disabled
                className="flex items-center gap-2 px-5 py-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-mono uppercase tracking-widest cursor-not-allowed"
              >
                <Loader2 size={14} className="animate-spin" />
                <span>{generationStatusText}</span>
              </button>
            ) : (
              <button
                onClick={runGenerationPipeline}
                className="flex items-center gap-2 px-5 py-4 bg-indigo-500 border border-indigo-600 hover:bg-indigo-600 text-white rounded-xl text-xs font-mono uppercase tracking-widest transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02]"
              >
                <Sparkles size={14} />
                Run Pipeline
              </button>
            )}

            <button
              onClick={() => {
                setShowCreateModal(true);
                setCustomDraft(null);
              }}
              className="flex items-center justify-center p-4 bg-slate-800 border border-slate-700 hover:bg-slate-750 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer shadow-lg hover:scale-[1.02]"
              title="Create Custom Post"
            >
              <Plus size={16} />
            </button>

            <button
              onClick={() => setShowQueue(true)}
              className="flex items-center gap-2 px-4 py-4 bg-slate-800 border border-slate-700 hover:bg-slate-750 hover:border-slate-600 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-mono uppercase tracking-widest transition-all cursor-pointer shadow-lg hover:scale-[1.02]"
              title="View Scheduled Queue"
            >
              <Calendar size={16} />
              <span>Queue ({posts.filter(p => p.status === 'Scheduled').length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search posts by hook, project, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono"
          />
          <Search className="absolute left-3.5 top-3 text-slate-500 w-4 h-4" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-3 text-slate-500 hover:text-white transition-colors cursor-pointer">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 gap-1 overflow-x-auto max-w-full">
          {(['Draft', 'Approved', 'Scheduled', 'Published', 'Needs AI Revision'] as const).filter(status => statusCounts[status] > 0).length > 1 && (
            <button
              onClick={() => {
                const activeStatuses = (['Draft', 'Approved', 'Scheduled', 'Published', 'Needs AI Revision'] as const).filter(status => statusCounts[status] > 0);
                if (selectedStatuses.length === activeStatuses.length) {
                  setSelectedStatuses(activeStatuses.filter(s => s !== 'Published'));
                } else {
                  setSelectedStatuses(activeStatuses);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedStatuses.length === (['Draft', 'Approved', 'Scheduled', 'Published', 'Needs AI Revision'] as const).filter(status => statusCounts[status] > 0).length
                  ? 'bg-indigo-500 text-white font-bold animate-pulse'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ALL ({posts.length})
            </button>
          )}
          {(['Draft', 'Approved', 'Scheduled', 'Published', 'Needs AI Revision'] as const).filter(status => statusCounts[status] > 0).map((status) => {
            const isSelected = selectedStatuses.includes(status);
            return (
              <button
                key={status}
                onClick={() => {
                  setSelectedStatuses(prev => {
                    if (prev.includes(status)) {
                      return prev.filter(s => s !== status);
                    } else {
                      return [...prev, status];
                    }
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-500 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status === 'Needs AI Revision' ? 'Revision' : status} ({statusCounts[status]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort Bar */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
        <ArrowUpDown size={12} className="text-slate-600" />
        <span className="text-slate-600 mr-1">Sort:</span>
        {[
          { key: 'date_asc' as const, label: 'Date', icon: <ArrowUp size={10} /> },
          { key: 'date_desc' as const, label: 'Date', icon: <ArrowDown size={10} /> },
          { key: 'project' as const, label: 'Project', icon: null },
          { key: 'status' as const, label: 'Status', icon: null },
          { key: 'updated' as const, label: 'Recent', icon: null },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              sortBy === opt.key
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 font-bold'
                : 'bg-white/[0.02] text-slate-500 border border-white/5 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {opt.label}{opt.icon && <span className="inline-flex">{opt.icon}</span>}
          </button>
        ))}
      </div>

      {/* Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => {
          const statusConf = STATUS_CONFIG[post.status] || STATUS_CONFIG['Draft'];
          const typeConf = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG['under_the_hood'];

          return (
            <button
              key={post.id}
              onClick={() => {
                setSelectedPost(post);
                setEditedCaptionEn(post.caption_english);
                setEditedCaptionEs(post.caption_spanish);
                setEditingCaption(false);
                setEditingDate(false);
                setShowFeedbackInput(false);
                setFeedbackText('');
              }}
              className="text-left group relative bg-[#080b12] p-6 hover:bg-[#0c121d] transition-all duration-300 overflow-hidden border border-white/5 hover:border-indigo-500/30 rounded-2xl cursor-pointer flex flex-col justify-between min-h-[240px]"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase ${statusConf.bg} ${statusConf.text} ${statusConf.border} border`}>
                  {statusConf.label}
                </span>
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${typeConf.color}`}>
                  {typeConf.label}
                </span>
              </div>

              {/* Hook */}
              <div className="flex-1 flex gap-4 items-start">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white leading-snug mb-3 group-hover:text-indigo-300 transition-colors line-clamp-3">
                    {post.hook}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                      {post.project}
                    </span>
                    {generatedImages[post.id] && (
                      <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 flex items-center gap-1 font-bold animate-pulse">
                        <Sparkles size={8} /> IMG_READY
                      </span>
                    )}
                  </div>
                </div>
                {generatedImages[post.id] && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-slate-950/40 relative">
                    <img src={generatedImages[post.id]} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Bottom bar */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-slate-500">
                {post.status !== 'Draft' && post.status !== 'Needs AI Revision' && post.suggested_date ? (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={10} />
                    <span>{post.suggested_date}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 opacity-40 select-none">
                    <Calendar size={10} />
                    <span>No date set</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {post.user_feedback && (
                    <span className="text-amber-400 flex items-center gap-1">
                      <MessageSquare size={10} />
                      Feedback
                    </span>
                  )}
                  {post.status === 'Published' && (
                    <a
                      href={post.instagram_permalink || 'https://www.instagram.com/bervosorg'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all cursor-pointer flex items-center justify-center border border-indigo-500/20"
                      title="Open on Instagram"
                    >
                      <FaInstagram size={10} />
                    </a>
                  )}
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute bottom-0 left-0 w-16 h-px bg-indigo-500/0 group-hover:bg-indigo-500/40 transition-all duration-700" />
              <div className="absolute bottom-0 left-0 w-px h-16 bg-indigo-500/0 group-hover:bg-indigo-500/40 transition-all duration-700" />
            </button>
          );
        })}
      </div>

      {filteredPosts.length === 0 && (
        <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <span className="mono-label !text-slate-500 block mb-2">// NO_POSTS_FOUND</span>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Queue Empty</h3>
          <p className="text-slate-400 font-mono text-xs">No posts match your current filter. Try adjusting the status filter or search query.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#080b12]/90 backdrop-blur-md"
          onClick={() => setSelectedPost(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="tech-card p-0 max-w-4xl w-full max-h-[90vh] overflow-hidden relative flex flex-col"
          >
            {/* Modal header */}
            <div className="p-6 border-b border-white/5 flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase ${STATUS_CONFIG[selectedPost.status]?.bg} ${STATUS_CONFIG[selectedPost.status]?.text} ${STATUS_CONFIG[selectedPost.status]?.border} border`}>
                    {STATUS_CONFIG[selectedPost.status]?.label}
                  </span>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${POST_TYPE_CONFIG[selectedPost.post_type]?.color}`}>
                    {POST_TYPE_CONFIG[selectedPost.post_type]?.label}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {selectedPost.project}
                  </span>
                  {selectedPost.status === 'Published' && (
                    <a
                      href={selectedPost.instagram_permalink || 'https://www.instagram.com/bervosorg'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 border border-indigo-500/20 transition-all cursor-pointer"
                    >
                      <FaInstagram size={10} /> Visit Post
                    </a>
                  )}
                  {editingDate && selectedPost.status !== 'Published' ? (
                    <span className="flex items-center gap-1.5">
                      <input
                        type="datetime-local"
                        value={editedScheduledAt}
                        onChange={(e) => setEditedScheduledAt(e.target.value)}
                        className="bg-white/5 border border-indigo-500/30 rounded-md px-2 py-0.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-indigo-500/60 transition-colors [color-scheme:dark]"
                      />
                      <button
                        onClick={async () => {
                          if (editedScheduledAt) {
                            const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                            if (editedScheduledAt < localNow) {
                              setNotification({
                                title: 'Invalid Date',
                                message: 'Cannot schedule a post in the past. Please select a future date and time.',
                                type: 'error'
                              });
                              return;
                            }
                          }
                          const updates: Partial<SocialPost> = {
                            scheduled_at: editedScheduledAt || null,
                            suggested_date: editedScheduledAt ? editedScheduledAt.split('T')[0] : ''
                          };
                          await updatePost(selectedPost.id, updates);
                          setEditingDate(false);
                        }}
                        className="p-1 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors cursor-pointer"
                      >
                        <Check size={10} />
                      </button>
                      <button
                        onClick={() => setEditingDate(false)}
                        className="p-1 rounded-md bg-white/5 text-slate-400 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ) : (
                    selectedPost.status === 'Published' ? (
                      <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                        <Calendar size={10} /> {selectedPost.suggested_date || 'No Date'}
                      </span>
                    ) : selectedPost.status === 'Draft' || selectedPost.status === 'Needs AI Revision' ? (
                      <span className="text-[9px] font-mono text-slate-500/40 flex items-center gap-1 select-none">
                        <Calendar size={10} /> No date set
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          const defaultDt = selectedPost.scheduled_at || (selectedPost.suggested_date ? `${selectedPost.suggested_date}T09:00` : '');
                          setEditedScheduledAt(defaultDt);
                          setEditingDate(true);
                        }}
                        className="text-[9px] font-mono text-slate-500 flex items-center gap-1 hover:text-indigo-400 transition-colors cursor-pointer group/date"
                        title="Click to edit schedule"
                      >
                        <Calendar size={10} /> {selectedPost.scheduled_at ? new Date(selectedPost.scheduled_at).toLocaleString() : (selectedPost.suggested_date || 'No date set')}
                        <Edit3 size={8} className="opacity-0 group-hover/date:opacity-100 transition-opacity" />
                      </button>
                    )
                  )}
                </div>
                <h2 className="text-xl font-black text-white leading-snug">{selectedPost.hook}</h2>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  disabled={filteredPosts.findIndex(p => p.id === selectedPost.id) <= 0}
                  onClick={handlePrevPost}
                  title="Previous Post (Left Arrow)"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-slate-400 hover:text-white"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  disabled={filteredPosts.findIndex(p => p.id === selectedPost.id) >= filteredPosts.length - 1}
                  onClick={handleNextPost}
                  title="Next Post (Right Arrow)"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-slate-400 hover:text-white mr-1"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="mono-label !text-indigo-400">// Caption (English)</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRegenerateCaption(selectedPost)}
                      disabled={saving || regeneratingCaptionId === selectedPost.id}
                      className="flex items-center gap-1 text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50"
                      title="Re-generate caption using Gemini"
                    >
                      {regeneratingCaptionId === selectedPost.id ? (
                        <><Loader2 size={10} className="animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles size={10} /> Re-Generate</>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (editingCaption) {
                          handleSaveCaption(selectedPost);
                        } else {
                          setEditedCaptionEn(selectedPost.caption_english);
                          setEditedCaptionEs(selectedPost.caption_spanish);
                          setEditingCaption(true);
                        }
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      {editingCaption ? <><Check size={12} /> Save</> : <><Edit3 size={12} /> Edit</>}
                    </button>
                  </div>
                </div>
                {editingCaption ? (
                  <textarea
                    value={editedCaptionEn}
                    onChange={(e) => setEditedCaptionEn(e.target.value)}
                    rows={10}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500/40 resize-none"
                  />
                ) : (
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedPost.caption_english}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div>
                <span className="mono-label !text-cyan-400 block mb-2">// Summary</span>
                {editingCaption ? (
                  <textarea
                    value={editedCaptionEs}
                    onChange={(e) => setEditedCaptionEs(e.target.value)}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500/40 resize-none"
                  />
                ) : (
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-sm text-slate-400 italic">
                    {selectedPost.caption_spanish}
                  </div>
                )}
              </div>

              {/* Visual Instruction & Image Generation Option */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="mono-label !text-slate-500">// Visual Direction</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        const projectKey = selectedPost.project.toLowerCase();
                        const defaultText = ORIGINAL_VISUAL_DIRECTIONS[projectKey] || 'Show a simplified flow: [Step 1] -> [Step 2] -> [Step 3]';
                        if (editingVisual) {
                          setEditedVisualInstruction(defaultText);
                        } else {
                          await updatePost(selectedPost.id, { visual_instruction: defaultText });
                        }
                        setNotification({
                          title: 'Reset Success',
                          message: 'Visual Direction reset to clean flowchart template.',
                          type: 'success'
                        });
                      }}
                      className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
                      title="Reset to default clean template"
                    >
                      <RotateCcw size={10} /> Reset
                    </button>
                    <button
                      onClick={() => {
                        if (editingVisual) {
                          handleSaveVisual(selectedPost);
                        } else {
                          setEditedVisualInstruction(selectedPost.visual_instruction);
                          setEditingVisual(true);
                        }
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {editingVisual ? <><Check size={12} /> Save</> : <><Edit3 size={12} /> Edit</>}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-xs text-slate-500 font-mono leading-relaxed flex flex-col justify-between">
                    <div>
                      {editingVisual ? (
                        <textarea
                          value={editedVisualInstruction}
                          onChange={(e) => setEditedVisualInstruction(e.target.value)}
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500/40 resize-none mb-4"
                        />
                      ) : (
                        <p className="mb-4">{selectedPost.visual_instruction}</p>
                      )}
                    </div>

                    {/* Visual Controls */}
                    <div className="py-3 border-t border-white/5 flex gap-4 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors">
                        <input
                          type="checkbox"
                          checked={showGrid}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setShowGrid(val);
                            if (generatedImages[selectedPost.id]) {
                              const dataUrl = generateBrandedSvg(selectedPost, val, showHud);
                              setGeneratedImages(prev => ({ ...prev, [selectedPost.id]: dataUrl }));
                            }
                          }}
                          className="rounded border-white/15 bg-black/40 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <span>Show Grid</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors">
                        <input
                          type="checkbox"
                          checked={showHud}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setShowHud(val);
                            if (generatedImages[selectedPost.id]) {
                              const dataUrl = generateBrandedSvg(selectedPost, showGrid, val);
                              setGeneratedImages(prev => ({ ...prev, [selectedPost.id]: dataUrl }));
                            }
                          }}
                          className="rounded border-white/15 bg-black/40 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <span>HUD Borders</span>
                      </label>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      {generatingId === selectedPost.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                            <Loader2 size={14} className="animate-spin" />
                            <span>{generationStep}</span>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full animate-pulse w-2/3" />
                          </div>
                        </div>
                      ) : (
                        generatedImages[selectedPost.id] ? (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => generateImageWithGemini(selectedPost)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer font-bold"
                            >
                              <Sparkles size={12} />
                              Re-Generate
                            </button>
                            <button
                              onClick={() => deleteGeneratedImage(selectedPost.id)}
                              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                              title="Delete Image"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => generateImageWithGemini(selectedPost)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer font-bold"
                          >
                            <Sparkles size={12} />
                            Generate Image (Gemini)
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Image Preview Box */}
                  <div className="bg-[#0c121d] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden group/preview">
                    {generatedImages[selectedPost.id] ? (
                      <>
                        <img
                          src={generateBrandedSvg(selectedPost, showGrid, showHud)}
                          alt="Gemini generated visual"
                          className="max-h-[220px] w-auto rounded-lg shadow-lg border border-white/10 cursor-pointer transition-transform hover:scale-[1.02]"
                          onClick={() => {
                            const activeSlides = selectedPost.slides || ['__generated__', ...(selectedPost.screenshots || [])];
                            const mainIdx = activeSlides.indexOf('__generated__');
                            if (mainIdx !== -1) setLightboxIndex(mainIdx);
                          }}
                        />
                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover/preview:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              const activeSlides = selectedPost.slides || ['__generated__', ...(selectedPost.screenshots || [])];
                              const mainIdx = activeSlides.indexOf('__generated__');
                              if (mainIdx !== -1) setLightboxIndex(mainIdx);
                            }}
                            title="View Fullsize"
                            className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                          >
                            <Maximize2 size={14} />
                          </button>
                          <button
                            onClick={() => downloadPng(selectedPost)}
                            title="Download PNG"
                            className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => deleteGeneratedImage(selectedPost.id)}
                            title="Delete Image"
                            className="p-2 bg-red-950/80 backdrop-blur-md border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900 transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <Share2 size={24} className="text-slate-600 mx-auto" />
                        <p className="text-xs font-mono text-slate-500">No image generated yet.</p>
                        <p className="text-[10px] font-mono text-slate-600">Click the button to simulate Gemini image synthesis.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Slides & Screenshots (Carousel Option) */}
              <div className="space-y-4">
                <span className="mono-label !text-slate-500 block mb-2">// Slides & Screenshots</span>
                <div 
                  className={`bg-[#0c121d] border rounded-xl p-6 transition-all ${
                    dragActive 
                      ? 'border-cyan-500/50 bg-cyan-950/10' 
                      : 'border-white/5 bg-[#0c121d]'
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {(() => {
                      const activeSlides = selectedPost.slides || ['__generated__', ...(selectedPost.screenshots || [])];
                      return activeSlides.map((slide: string, idx: number) => {
                        const isGenerated = slide === '__generated__';
                        const imgSrc = isGenerated 
                          ? (generatedImages[selectedPost.id] ? generateBrandedSvg(selectedPost, showGrid, showHud) : null)
                          : slide;

                        return (
                          <div key={idx} className="relative border border-white/10 rounded-xl overflow-hidden aspect-square flex flex-col justify-between p-3 bg-white/[0.02] group/slide">
                            <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider block mb-2">
                              {isGenerated ? `// SLIDE 0${idx + 1} (MAIN)` : `// SLIDE 0${idx + 1}`}
                            </span>
                            
                            <div className="relative group/slide-thumb w-full aspect-square rounded-lg overflow-hidden border border-white/5 bg-black/40 flex items-center justify-center">
                              {imgSrc ? (
                                <>
                                  <img 
                                    src={imgSrc} 
                                    alt={`Slide ${idx + 1}`} 
                                    className="w-full h-full object-contain"
                                  />
                                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/slide-thumb:opacity-100 flex items-center justify-center gap-1.5 transition-all">
                                    <button
                                      onClick={() => setLightboxIndex(idx)}
                                      className="p-1.5 bg-white/10 rounded-md text-slate-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                                      title="Zoom"
                                    >
                                      <Eye size={12} />
                                    </button>
                                    
                                    {idx > 0 && (
                                      <button
                                        onClick={() => handleMoveSlide(selectedPost, idx, 'left')}
                                        className="p-1.5 bg-white/10 rounded-md text-slate-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                                        title="Move Left"
                                      >
                                        <ChevronLeft size={12} />
                                      </button>
                                    )}
                                    
                                    {idx < activeSlides.length - 1 && (
                                      <button
                                        onClick={() => handleMoveSlide(selectedPost, idx, 'right')}
                                        className="p-1.5 bg-white/10 rounded-md text-slate-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                                        title="Move Right"
                                      >
                                        <ChevronRight size={12} />
                                      </button>
                                    )}
                                    
                                    {activeSlides.length > 1 && (
                                      <button
                                        onClick={() => handleDeleteSlide(selectedPost, idx)}
                                        className="p-1.5 bg-red-500/20 border border-red-500/30 rounded-md text-red-400 hover:bg-red-500/40 transition-all cursor-pointer"
                                        title="Delete"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="text-[10px] font-mono text-slate-600 italic">
                                  Not generated
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* Add screenshot button / drag zone */}
                    {(!selectedPost.screenshots || selectedPost.screenshots.length < 9) && (
                      <label className="border border-dashed border-white/10 hover:border-cyan-500/30 rounded-xl aspect-square flex flex-col items-center justify-center p-4 bg-white/[0.01] hover:bg-white/[0.02] cursor-pointer transition-all relative">
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={handleFileSelect} 
                          className="hidden" 
                          disabled={processingScreenshot}
                        />
                        {processingScreenshot ? (
                          <div className="text-center space-y-2">
                            <Loader2 size={20} className="animate-spin text-cyan-400 mx-auto" />
                            <span className="text-[10px] font-mono text-slate-500 block">Processing...</span>
                          </div>
                        ) : (
                          <div className="text-center space-y-2">
                            <Upload size={20} className="text-slate-500 mx-auto group-hover:text-cyan-400 transition-colors" />
                            <span className="text-[10px] font-mono text-slate-400 block font-semibold">Upload Slide</span>
                            <span className="text-[8px] font-mono text-slate-600 block">Drag & drop or click</span>
                          </div>
                        )}
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Mermaid Code */}
              {selectedPost.mermaid_code && (
                <details className="group border border-white/5 bg-[#0c121d] rounded-xl overflow-hidden transition-all">
                  <summary className="flex items-center justify-between px-4 py-3 text-xs font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer select-none">
                    <span>// Mermaid Diagram</span>
                    <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-4 pb-4 border-t border-white/5 pt-3">
                    <pre className="text-[11px] text-indigo-300 font-mono overflow-x-auto whitespace-pre">
                      {selectedPost.mermaid_code}
                    </pre>
                  </div>
                </details>
              )}

              {/* Notes */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="mono-label !text-amber-400">// Notes</span>
                  {selectedPost.user_feedback && (
                    <button
                      onClick={() => updatePost(selectedPost.id, { user_feedback: '' })}
                      className="text-[10px] font-mono text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                {selectedPost.user_feedback ? (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {selectedPost.user_feedback.split('\n').filter(Boolean).map((note, index) => {
                      const match = note.match(/^\[([^\]]+)\]\s*(.*)$/);
                      const timestamp = match ? match[1] : '';
                      const content = match ? match[2] : note;
                      return (
                        <div key={index} className="flex items-start justify-between gap-3 text-xs bg-white/[0.01] border border-white/5 rounded-lg p-2.5 leading-relaxed">
                          <div className="flex-1">
                            {timestamp && <span className="font-mono text-amber-500/80 mr-2">[{timestamp}]</span>}
                            <span className="text-slate-300">{content}</span>
                          </div>
                          <button
                            onClick={() => {
                              const notes = selectedPost.user_feedback.split('\n').filter(Boolean);
                              const updatedNotes = notes.filter((_, i) => i !== index).join('\n');
                              updatePost(selectedPost.id, { user_feedback: updatedNotes });
                            }}
                            className="text-slate-600 hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                            title="Delete note"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-slate-500 italic">No notes added yet.</p>
                )}
              </div>
            </div>

            {/* Modal actions */}
            <div className="p-6 border-t border-white/5 shrink-0 space-y-4">
              {showFeedbackInput && (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Add a note for revision..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500/40"
                    onKeyDown={(e) => e.key === 'Enter' && handleRequestRevision(selectedPost)}
                  />
                  <button
                    onClick={() => handleRequestRevision(selectedPost)}
                    disabled={!feedbackText.trim() || saving}
                    className="px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowFeedbackInput(false); setFeedbackText(''); }}
                    className="px-3 py-2.5 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {selectedPost.status !== 'Approved' && selectedPost.status !== 'Published' && selectedPost.status !== 'Scheduled' && (
                  <button
                    onClick={() => handleApprove(selectedPost)}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-green-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Check size={14} /> Approve
                  </button>
                )}

                {selectedPost.status === 'Approved' && (
                  <>
                    <button
                      onClick={() => handlePublish(selectedPost)}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Eye size={14} /> Mark Published
                    </button>
                    <button
                      onClick={() => handleUnapprove(selectedPost)}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <X size={14} /> Un-approve
                    </button>
                  </>
                )}

                {selectedPost.status !== 'Published' && !showFeedbackInput && (
                  <button
                    onClick={() => setShowFeedbackInput(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-amber-500/20 transition-all cursor-pointer"
                  >
                    <MessageSquare size={14} /> Add Note
                  </button>
                )}

                {selectedPost.status === 'Published' && (
                  <button
                    onClick={() => {
                      showConfirm({
                        title: 'Un-Publish Post',
                        message: "Are you sure you want to un-publish this post? This will revert its status to 'Approved' and clear all Instagram publication metadata so it can be re-published.",
                        confirmText: 'Un-Publish',
                        type: 'warning',
                        onConfirm: async () => {
                          await updatePost(selectedPost.id, {
                            status: 'Approved',
                            instagram_media_id: null,
                            published_at: null
                          });
                          setNotification({
                            title: 'Post Unpublished',
                            message: 'Successfully reverted post status to Approved and cleared publication metadata.',
                            type: 'success'
                          });
                        }
                      });
                    }}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw size={14} /> Un-Publish
                  </button>
                )}

                <button
                  onClick={() => handleDeletePost(selectedPost)}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={14} /> Delete
                </button>

                {selectedPost.status === 'Scheduled' && (
                  <button
                    onClick={() => handleCancelSchedule(selectedPost)}
                    disabled={publishingInstagram || saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ml-auto cursor-pointer"
                  >
                    <X size={14} /> Cancel Schedule
                  </button>
                )}

                {selectedPost.status === 'Approved' && (
                  <div className="flex items-center gap-3 ml-auto">
                    <button
                      onClick={() => handlePublishToInstagram(selectedPost, true)}
                      disabled={publishingInstagram || saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 border border-indigo-600 text-white rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                    >
                      {publishingInstagram ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                      Publish Now
                    </button>
                    <button
                      onClick={() => {
                        if (selectedPost.scheduled_at) {
                          const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                          if (selectedPost.scheduled_at < localNow) {
                            setNotification({
                              title: 'Invalid Date',
                              message: 'The scheduled time has already passed. Please update it to a future time before scheduling.',
                              type: 'error'
                            });
                            return;
                          }
                          handlePublishToInstagram(selectedPost, false);
                        } else {
                          const defaultDt = `${new Date().toISOString().split('T')[0]}T09:00`;
                          setEditedScheduledAt(defaultDt);
                          setEditingDate(true);
                        }
                      }}
                      disabled={publishingInstagram || saving}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                        selectedPost.scheduled_at
                          ? 'bg-blue-500 hover:bg-blue-600 border border-blue-600 text-white'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {publishingInstagram ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                      {selectedPost.scheduled_at ? 'Schedule Post' : 'Set Schedule Date'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && selectedPost && (() => {
        const activeSlides = selectedPost.slides || ['__generated__', ...(selectedPost.screenshots || [])];
        const slides = activeSlides.map(slide => 
          slide === '__generated__' 
            ? generateBrandedSvg(selectedPost, showGrid, showHud) 
            : slide
        );
        const currentSlideSrc = slides[lightboxIndex];
        const isGenerated = activeSlides[lightboxIndex] === '__generated__';

        return (
          <div
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 z-[100] bg-[#080b12]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-all duration-300 cursor-zoom-out"
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2.5 bg-white/5 border border-white/10 rounded-full cursor-pointer hover:bg-white/10 transition-all shadow-lg z-20"
            >
              <X size={20} />
            </button>

            {/* Slide Indicator */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-xs font-mono text-slate-400 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full select-none z-20">
              Slide {lightboxIndex + 1} of {slides.length}
            </div>

            {/* Main Carousel Wrapper */}
            <div className="relative max-w-[90vw] max-h-[75vh] w-full h-full flex items-center justify-center">
              {/* Prev Button */}
              {lightboxIndex > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev! - 1); }}
                  className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full cursor-pointer transition-all shadow-lg z-20"
                  title="Previous Slide"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Slide Content */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-full aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative bg-[#080b12] flex items-center justify-center cursor-default"
              >
                <img
                  src={currentSlideSrc}
                  alt={`Slide ${lightboxIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Next Button */}
              {lightboxIndex < slides.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev! + 1); }}
                  className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full cursor-pointer transition-all shadow-lg z-20"
                  title="Next Slide"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div onClick={(e) => e.stopPropagation()} className="mt-6 flex gap-4 z-20">
              {isGenerated ? (
                <>
                  <button
                    onClick={() => downloadPng(selectedPost)}
                    className="flex items-center gap-2 px-5 py-3 bg-cyan-500 text-black hover:bg-cyan-400 font-bold rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10"
                  >
                    <Download size={14} /> Download PNG
                  </button>
                  <button
                    onClick={() => downloadSvg(selectedPost)}
                    className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Share2 size={14} /> Download SVG
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = currentSlideSrc;
                    a.download = `${selectedPost.id}_slide_${lightboxIndex + 1}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-cyan-500 text-black hover:bg-cyan-400 font-bold rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10"
                >
                  <Download size={14} /> Download Screenshot
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Create Custom Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#080b12]/90 backdrop-blur-md">
          <div className="tech-card p-0 max-w-3xl w-full max-h-[90vh] overflow-hidden relative flex flex-col">
            {/* Modal header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <div>
                <span className="mono-label !text-slate-500 block mb-1">// DRAFT_ENGINE</span>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Build Custom Post</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0 custom-scrollbar">
              {!customDraft ? (
                // Input Form
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Select Project</label>
                      <select
                        value={createProject}
                        onChange={(e) => setCreateProject(e.target.value)}
                        className="w-full bg-[#080b12] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                      >
                        <option value="None">None (General Post)</option>
                        {ecosystemData.projects.map((proj) => (
                          <option key={proj.title} value={proj.title}>
                            {proj.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Post Type</label>
                      <select
                        value={createPostType}
                        onChange={(e) => setCreatePostType(e.target.value as any)}
                        className="w-full bg-[#080b12] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                      >
                        <option value="vibe_coding_reality">Vibe Coding</option>
                        <option value="under_the_hood">Under the Hood</option>
                        <option value="carousel_before_after">Before & After</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">What is this post about?</label>
                    <textarea
                      value={createPrompt}
                      onChange={(e) => setCreatePrompt(e.target.value)}
                      placeholder="e.g., I just refactored the router fallback to prevent blank pages during model failures, and it works perfectly."
                      rows={5}
                      className="w-full bg-[#080b12] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono resize-none"
                    />
                    <p className="mt-2 text-[10px] text-slate-500 font-mono leading-relaxed">
                      AI will analyze your description, look up project description, pull recent git commit messages, and draft a high-quality post.
                    </p>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={generateCustomDraft}
                      disabled={generatingCustomDraft || !createPrompt.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-mono rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/20"
                    >
                      {generatingCustomDraft ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Generating Draft...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Generate Draft</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // Draft Preview & Editing
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Project</span>
                      <span className="text-xs font-bold text-white font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 block">
                        {customDraft.project}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Post Type</span>
                      <span className="text-xs font-bold text-white font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 block">
                        {customDraft.post_type}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Hook (English)</label>
                    <input
                      type="text"
                      value={customDraft.hook}
                      onChange={(e) => setCustomDraft({ ...customDraft, hook: e.target.value })}
                      className="w-full bg-[#080b12] border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Caption (English)</label>
                    <textarea
                      value={customDraft.caption_english}
                      onChange={(e) => setCustomDraft({ ...customDraft, caption_english: e.target.value })}
                      rows={8}
                      className="w-full bg-[#080b12] border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Caption (Spanish)</label>
                    <textarea
                      value={customDraft.caption_spanish}
                      onChange={(e) => setCustomDraft({ ...customDraft, caption_spanish: e.target.value })}
                      rows={3}
                      className="w-full bg-[#080b12] border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Visual Prompt / Graphics Instruction</label>
                    <textarea
                      value={customDraft.visual_instruction}
                      onChange={(e) => setCustomDraft({ ...customDraft, visual_instruction: e.target.value })}
                      rows={3}
                      className="w-full bg-[#080b12] border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Mermaid Code (Optional)</label>
                    <textarea
                      value={customDraft.mermaid_code || ''}
                      onChange={(e) => setCustomDraft({ ...customDraft, mermaid_code: e.target.value || null })}
                      placeholder="graph TD..."
                      rows={4}
                      className="w-full bg-[#080b12] border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                    />
                  </div>

                  <div className="pt-4 flex justify-between gap-3">
                    <button
                      onClick={() => setCustomDraft(null)}
                      className="px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Back to Inputs
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={generateCustomDraft}
                        disabled={generatingCustomDraft}
                        className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-indigo-400 font-mono rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        {generatingCustomDraft ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Regenerate
                      </button>
                      <button
                        onClick={saveCustomPost}
                        disabled={savingCustomPost}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-mono rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/20"
                      >
                        {savingCustomPost ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Save Draft
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom HUD Notification Modal */}
      {notification && (
        <div className="fixed inset-0 z-[110] bg-[#080b12]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0c121d] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Type indicator glow */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${notification.type === 'success' ? 'bg-emerald-500' :
                notification.type === 'error' ? 'bg-rose-500' : 'bg-amber-500'
              }`} />

            <h3 className={`text-sm font-mono uppercase tracking-widest mb-3 font-bold ${notification.type === 'success' ? 'text-emerald-400' :
                notification.type === 'error' ? 'text-rose-400' : 'text-amber-400'
              }`}>
              // {notification.title}
            </h3>

            <div className="text-slate-300 text-xs font-mono mb-6 whitespace-pre-wrap leading-relaxed max-h-[40vh] overflow-y-auto bg-[#080b12] p-4 rounded-xl border border-white/5">
              {notification.message}
            </div>

            <div className="flex justify-end gap-3">
              {notification.link && (
                <a
                  href={notification.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white hover:bg-emerald-400 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-all font-bold border border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <Share2 size={14} /> {notification.link.label}
                </a>
              )}
              <button
                onClick={() => setNotification(null)}
                className={`px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-all ${notification.type === 'success' ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                    notification.type === 'error' ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20' :
                      'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20'
                  }`}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[120] bg-[#080b12]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c121d] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Type indicator glow */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
              confirmDialog.type === 'danger' ? 'bg-rose-500' :
              confirmDialog.type === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
            }`} />

            <h3 className={`text-sm font-mono uppercase tracking-widest mb-3 font-bold ${
              confirmDialog.type === 'danger' ? 'text-rose-400' :
              confirmDialog.type === 'warning' ? 'text-amber-400' : 'text-cyan-400'
            }`}>
              // {confirmDialog.title}
            </h3>

            <p className="text-slate-300 text-xs font-mono mb-6 leading-relaxed bg-[#080b12] p-4 rounded-xl border border-white/5">
              {confirmDialog.message}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-all"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                onClick={async () => {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  try {
                    await confirmDialog.onConfirm();
                  } catch (err: any) {
                    console.error('[Confirm] Action failed:', err);
                    setNotification({
                      title: 'Action Failed',
                      message: err.message || 'Unknown error occurred during confirmation action.',
                      type: 'error'
                    });
                  }
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-all font-bold ${
                  confirmDialog.type === 'danger' ? 'bg-rose-500 text-white hover:bg-rose-600 border border-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.3)]' :
                  confirmDialog.type === 'warning' ? 'bg-amber-500 text-black hover:bg-amber-400 border border-amber-600' :
                  'bg-cyan-500 text-black hover:bg-cyan-400 border border-cyan-600'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Scheduled Queue Drawer */}
      {showQueue && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-[#080b12]/80 backdrop-blur-md"
          onClick={() => setShowQueue(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-[#0c121d] border-l border-white/5 flex flex-col relative shadow-2xl animate-in slide-in-from-right duration-300"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <span className="mono-label !text-indigo-400 mb-0.5 block">// QUEUE</span>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Scheduled Posts</h3>
              </div>
              <button
                onClick={() => setShowQueue(false)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {posts.filter(p => p.status === 'Scheduled').length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Calendar size={32} className="text-slate-700 mb-3" />
                  <p className="text-xs font-mono">No posts scheduled in the queue.</p>
                </div>
              ) : (
                posts
                  .filter(p => p.status === 'Scheduled')
                  .sort((a, b) => (a.scheduled_at || '').localeCompare(b.scheduled_at || ''))
                  .map(post => {
                    const timeLeft = getRelativeTime(post.scheduled_at);
                    return (
                      <div
                        key={post.id}
                        onClick={() => {
                          setSelectedPost(post);
                          setEditedCaptionEn(post.caption_english);
                          setEditedCaptionEs(post.caption_spanish);
                          setEditingCaption(false);
                          setEditingDate(false);
                          setShowFeedbackInput(false);
                          setFeedbackText('');
                          setShowQueue(false);
                        }}
                        className="p-4 bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all rounded-xl cursor-pointer group space-y-3 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                            {post.project}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                            {timeLeft}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-indigo-300 transition-colors">
                          {post.hook}
                        </h4>
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] font-mono text-slate-500 font-bold">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : 'Date missing'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelSchedule(post);
                            }}
                            className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getRelativeTime(timestamp: string | null | undefined): string {
  if (!timestamp) return 'No time';
  const target = new Date(timestamp).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return 'due now';
  }

  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `in ${days}d ${remainingHours}h`;
  }
  if (hours > 0) {
    const remainingMins = mins % 60;
    return `in ${hours}h ${remainingMins}m`;
  }
  if (mins > 0) {
    return `in ${mins}m`;
  }
  return `in ${secs}s`;
}

