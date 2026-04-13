import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSocialActivities, createSocialActivity, updateSocialActivity, deleteSocialActivity,
  addSocialActivityImages, removeSocialActivityImage,
  getGalleryTreks, createGalleryTrek, updateGalleryTrek, deleteGalleryTrek,
  addGalleryTrekImages, removeGalleryTrekImage,
  toggleSocialActivity, toggleGalleryTrek,
} from "../services/api";
import { formatDate } from "../lib/utils";
import {
  Plus, Trash2, Image as ImageIcon, AlertCircle, Loader2, X,
  Edit2, Upload, Mountain, Users, AlertTriangle, CheckCircle2,
  Eye, EyeOff,
} from "lucide-react";
import Pagination from "../components/common/Pagination";

const CLOUD_BASE = import.meta.env.VITE_CLOUD_API_BASE || "https://dev-api.technootales.in/v1/cloud";
const PAGE_SIZE = 9;

const ACTIVITY_CATEGORIES = ["Education", "Environment", "Relief", "Conservation", "Adventure", "Other"];
const DIFFICULTY_OPTIONS  = ["Easy", "Moderate", "Hard", "Extreme"];

const inputCls = "w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.06] text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/40";
const labelCls = "block text-xs font-medium text-white/50 mb-1.5";

// ── Cloud image uploader ───────────────────────────────────────────────────────
async function uploadToCloud(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${CLOUD_BASE}/file`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  const result = await res.json();
  // API returns { file: { _id: "..." } } — construct URL from file ID
  if (result.file?._id) return `${CLOUD_BASE}/file/${result.file._id}`;
  // Fallback for other response shapes
  return result.url || result.data?.url || result.fileUrl || null;
}

// ── Image uploader widget ──────────────────────────────────────────────────────
function ImageUploader({ images = [], onAdd, onRemove, uploading, setUploading }) {
  const fileRef = useRef();

  const handleFiles = async (files) => {
    const arr = Array.from(files).slice(0, 10 - images.length);
    if (!arr.length) return;
    setUploading(true);
    try {
      for (const file of arr) {
        const url = await uploadToCloud(file);
        if (url) onAdd(url);
      }
    } catch {
      // silently fail per-file; partial success is fine
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className={labelCls}>Images</label>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-2">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-white/[0.06]">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {images.length < 10 && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/20 text-text-light hover:border-blue-500/40 hover:text-blue-400 text-sm transition-colors w-full justify-center disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading..." : "Upload Images"}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ── Delete confirm modal ───────────────────────────────────────────────────────
function DeleteModal({ item, label, onConfirm, onClose, loading }) {
  if (!item) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-[#0f1117] border border-white/10 rounded-2xl p-6 text-center shadow-2xl"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Delete {label}</h3>
          <p className="text-sm text-white/50 mb-4 truncate px-2">"{item.title}"</p>
          <p className="text-xs text-red-400/80 mb-6">This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:bg-white/[0.06] transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Activity form modal ────────────────────────────────────────────────────────
function ActivityModal({ item, onClose, onSave, saving }) {
  const isEdit = !!item?._id;
  const [title, setTitle]             = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [category, setCategory]       = useState(item?.category || "");
  const [date, setDate]               = useState(item?.date ? item.date.slice(0, 10) : "");
  const [location, setLocation]       = useState(item?.location || "");
  const [images, setImages]           = useState(
    (item?.images || []).map((img) => (typeof img === "string" ? img : img?.url)).filter(Boolean)
  );
  const [uploading, setUploading]     = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), category, date, location: location.trim(), images });
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0f1117] border-l border-white/10 z-50 flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">{isEdit ? "Edit Activity" : "New Social Activity"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Activity title" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              <option value="">-- Select category --</option>
              {ACTIVITY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Pune" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder="Brief description..." className={`${inputCls} resize-none`} />
          </div>
          <ImageUploader
            images={images}
            onAdd={(url) => setImages((p) => [...p, url])}
            onRemove={(i) => setImages((p) => p.filter((_, idx) => idx !== i))}
            uploading={uploading}
            setUploading={setUploading}
          />
        </form>
        <div className="px-6 py-4 border-t border-white/10 flex gap-3 flex-shrink-0">
          <button onClick={onClose} disabled={saving || uploading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:bg-white/[0.06] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || uploading || !title.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Gallery Trek form modal ────────────────────────────────────────────────────
function GalleryTrekModal({ item, onClose, onSave, saving }) {
  const isEdit = !!item?._id;
  const [title, setTitle]             = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [location, setLocation]       = useState(item?.location || "");
  const [difficulty, setDifficulty]   = useState(item?.difficulty || "");
  const [duration, setDuration]       = useState(item?.duration || "");
  const [date, setDate]               = useState(item?.date ? item.date.slice(0, 10) : "");
  const [images, setImages]           = useState(
    (item?.images || []).map((img) => (typeof img === "string" ? img : img?.url)).filter(Boolean)
  );
  const [uploading, setUploading]     = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), location: location.trim(), difficulty, duration: duration.trim(), date, images });
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0f1117] border-l border-white/10 z-50 flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">{isEdit ? "Edit Gallery Trek" : "New Gallery Trek"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Trek name" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Maharashtra" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputCls}>
                <option value="">-- Select --</option>
                {DIFFICULTY_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Duration</label>
              <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 2 Days 1 Night" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder="Brief description..." className={`${inputCls} resize-none`} />
          </div>
          <ImageUploader
            images={images}
            onAdd={(url) => setImages((p) => [...p, url])}
            onRemove={(i) => setImages((p) => p.filter((_, idx) => idx !== i))}
            uploading={uploading}
            setUploading={setUploading}
          />
        </form>
        <div className="px-6 py-4 border-t border-white/10 flex gap-3 flex-shrink-0">
          <button onClick={onClose} disabled={saving || uploading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:bg-white/[0.06] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || uploading || !title.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Card component ─────────────────────────────────────────────────────────────
function ItemCard({ item, onEdit, onDelete, onToggle, isActive, badge }) {
  const id = item._id || item.id;
  const images = item.images || [];

  return (
    <div className="glass-card rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Image strip */}
      {images.length > 0 ? (
        <div className={`relative grid gap-0.5 h-36 overflow-hidden bg-white/[0.06] ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {images.slice(0, 3).map((img, i) => (
            <img key={i} src={typeof img === "string" ? img : img.url} alt=""
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }} />
          ))}
          {!isActive && (
            <span className="absolute top-0 left-0 bg-amber-500/80 text-white text-xs px-2 py-0.5 rounded-br-lg">
              Hidden
            </span>
          )}
        </div>
      ) : (
        <div className="relative h-36 bg-white/[0.04] flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-white/15" />
          {!isActive && (
            <span className="absolute top-0 left-0 bg-amber-500/80 text-white text-xs px-2 py-0.5 rounded-br-lg">
              Hidden
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-medium text-text text-sm line-clamp-1 flex-1">{item.title || "Untitled"}</h3>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50 flex-shrink-0 capitalize">{badge}</span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-text-light line-clamp-2 mb-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-white/30">
            {item.date || item.createdAt
              ? <span>{formatDate(item.date || item.createdAt)}</span>
              : null}
            {images.length > 0 && <span>· {images.length} photo{images.length !== 1 ? "s" : ""}</span>}
            {item.location && <span>· {item.location}</span>}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors" title="Edit">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onToggle(item)}
              className={`p-1.5 rounded-lg transition-colors ${
                isActive
                  ? "hover:bg-white/10 text-white/40"
                  : "hover:bg-amber-500/10 text-amber-400"
              }`}
              title={isActive ? "Hide" : "Show"}>
              {isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function GalleryManagement() {
  const [activeTab, setActiveTab]         = useState("activities");

  // Activities
  const [activities, setActivities]       = useState([]);
  const [actLoading, setActLoading]       = useState(true);
  const [actError, setActError]           = useState(null);
  const [actPage, setActPage]             = useState(1);

  // Gallery Treks
  const [galleryTreks, setGalleryTreks]   = useState([]);
  const [trekLoading, setTrekLoading]     = useState(true);
  const [trekError, setTrekError]         = useState(null);
  const [trekPage, setTrekPage]           = useState(1);

  // Modals
  const [activityModal, setActivityModal] = useState(null); // null | {} (new) | item (edit)
  const [trekModal, setTrekModal]         = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null); // { item, type }
  const [savingId, setSavingId]           = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast]                 = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch
  const fetchActivities = async () => {
    setActLoading(true); setActError(null);
    try {
      const res = await getSocialActivities();
      const data = res.data?.data || res.data?.activities || res.data?.socialActivities || res.data || [];
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      setActError(err.response?.data?.message || "Failed to load activities");
    } finally {
      setActLoading(false);
    }
  };

  const fetchGalleryTreks = async () => {
    setTrekLoading(true); setTrekError(null);
    try {
      const res = await getGalleryTreks();
      const data = res.data?.data || res.data?.galleryTreks || res.data || [];
      setGalleryTreks(Array.isArray(data) ? data : []);
    } catch (err) {
      setTrekError(err.response?.data?.message || "Failed to load gallery treks");
    } finally {
      setTrekLoading(false);
    }
  };

  useEffect(() => { fetchActivities(); fetchGalleryTreks(); }, []);

  // Save activity
  const handleSaveActivity = async (data) => {
    const isEdit = !!activityModal?._id;
    const id = activityModal?._id;
    setSavingId("activity");
    try {
      if (isEdit) {
        const res = await updateSocialActivity(id, data);
        setActivities(prev => prev.map(a => a._id === id ? res.data.data : a));
      } else {
        const res = await createSocialActivity(data);
        setActivities(prev => [res.data.data, ...prev]);
      }
      setActivityModal(null);
      showToast("success", isEdit ? "Activity updated" : "Activity created");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to save activity");
    } finally {
      setSavingId(null);
    }
  };

  // Save gallery trek
  const handleSaveGalleryTrek = async (data) => {
    const isEdit = !!trekModal?._id;
    const id = trekModal?._id;
    setSavingId("trek");
    try {
      if (isEdit) {
        const res = await updateGalleryTrek(id, data);
        setGalleryTreks(prev => prev.map(t => t._id === id ? res.data.data : t));
      } else {
        const res = await createGalleryTrek(data);
        setGalleryTreks(prev => [res.data.data, ...prev]);
      }
      setTrekModal(null);
      showToast("success", isEdit ? "Trek updated" : "Trek created");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to save trek");
    } finally {
      setSavingId(null);
    }
  };

  // Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { item, type } = deleteTarget;
    const id = item._id || item.id;
    setDeleteLoading(true);
    try {
      if (type === "activity") {
        await deleteSocialActivity(id);
        setActivities(prev => prev.filter(a => (a._id || a.id) !== id));
      } else {
        await deleteGalleryTrek(id);
        setGalleryTreks(prev => prev.filter(t => (t._id || t.id) !== id));
      }
      setDeleteTarget(null);
      showToast("success", "Deleted successfully");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle visibility
  const handleToggleActivity = async (item) => {
    const id = item._id || item.id;
    try {
      const res = await toggleSocialActivity(id);
      setActivities(prev => prev.map(a => (a._id || a.id) === id ? res.data.data : a));
      showToast("success", res.data.data.isActive ? "Activity visible" : "Activity hidden");
    } catch {
      showToast("error", "Failed to toggle visibility");
    }
  };

  const handleToggleTrek = async (item) => {
    const id = item._id || item.id;
    try {
      const res = await toggleGalleryTrek(id);
      setGalleryTreks(prev => prev.map(t => (t._id || t.id) === id ? res.data.data : t));
      showToast("success", res.data.data.isActive ? "Trek visible" : "Trek hidden");
    } catch {
      showToast("error", "Failed to toggle visibility");
    }
  };

  // Pagination helpers
  const actPageCount  = Math.max(1, Math.ceil(activities.length   / PAGE_SIZE));
  const trekPageCount = Math.max(1, Math.ceil(galleryTreks.length / PAGE_SIZE));
  const paginatedActs  = activities.slice((actPage - 1)  * PAGE_SIZE, actPage  * PAGE_SIZE);
  const paginatedTreks = galleryTreks.slice((trekPage - 1) * PAGE_SIZE, trekPage * PAGE_SIZE);

  const TABS = [
    { key: "activities", label: "Social Activities", icon: Users, count: activities.length },
    { key: "treks",      label: "Gallery Treks",     icon: Mountain, count: galleryTreks.length },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-text">Gallery Management</h1>
        <button
          onClick={() => activeTab === "activities" ? setActivityModal({}) : setTrekModal({})}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          {activeTab === "activities" ? "Add Activity" : "Add Trek"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-6 w-fit">
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-blue-500 text-white"
                : "text-text-light hover:text-text hover:bg-white/[0.06]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === key ? "bg-white/20" : "bg-white/10"}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Social Activities Tab ── */}
      {activeTab === "activities" && (
        <>
          {actLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-36 bg-white/5" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-full bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : actError ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-text-light mb-3">{actError}</p>
              <button onClick={fetchActivities} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Retry</button>
            </div>
          ) : paginatedActs.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Users className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-text-light">No social activities yet.</p>
              <button onClick={() => setActivityModal({})}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Add First Activity</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedActs.map((act) => (
                <ItemCard
                  key={act._id || act.id}
                  item={act}
                  badge={act.category}
                  onEdit={(item) => setActivityModal(item)}
                  onDelete={(item) => setDeleteTarget({ item, type: "activity" })}
                  onToggle={handleToggleActivity}
                  isActive={act.isActive !== false}
                />
              ))}
            </div>
          )}
          <Pagination page={actPage} totalPages={actPageCount} onPageChange={setActPage}
            totalItems={activities.length} pageSize={PAGE_SIZE} label="activities" />
        </>
      )}

      {/* ── Gallery Treks Tab ── */}
      {activeTab === "treks" && (
        <>
          {trekLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-36 bg-white/5" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-full bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : trekError ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-text-light mb-3">{trekError}</p>
              <button onClick={fetchGalleryTreks} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Retry</button>
            </div>
          ) : paginatedTreks.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Mountain className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-text-light">No gallery treks yet.</p>
              <button onClick={() => setTrekModal({})}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Add First Trek</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedTreks.map((trek) => (
                <ItemCard
                  key={trek._id || trek.id}
                  item={trek}
                  badge={trek.difficulty}
                  onEdit={(item) => setTrekModal(item)}
                  onDelete={(item) => setDeleteTarget({ item, type: "trek" })}
                  onToggle={handleToggleTrek}
                  isActive={trek.isActive !== false}
                />
              ))}
            </div>
          )}
          <Pagination page={trekPage} totalPages={trekPageCount} onPageChange={setTrekPage}
            totalItems={galleryTreks.length} pageSize={PAGE_SIZE} label="treks" />
        </>
      )}

      {/* Modals */}
      {activityModal !== null && (
        <ActivityModal
          item={activityModal}
          onClose={() => setActivityModal(null)}
          onSave={handleSaveActivity}
          saving={savingId === "activity"}
        />
      )}
      {trekModal !== null && (
        <GalleryTrekModal
          item={trekModal}
          onClose={() => setTrekModal(null)}
          onSave={handleSaveGalleryTrek}
          saving={savingId === "trek"}
        />
      )}
      <DeleteModal
        item={deleteTarget?.item}
        label={deleteTarget?.type === "activity" ? "Activity" : "Trek"}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm shadow-xl ${
              toast.type === "success"
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/20 border-red-500/30 text-red-300"
            }`}>
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
