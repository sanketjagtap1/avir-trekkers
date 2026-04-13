import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  adminGetSiteStats, adminUpdateSiteStats,
  adminGetSiteSettings, adminUpdateSiteSettings,
  adminGetHeroSlides, adminCreateHeroSlide, adminUpdateHeroSlide, adminDeleteHeroSlide,
  adminGetTeam, adminCreateTeamMember, adminUpdateTeamMember, adminDeleteTeamMember,
} from "../services/api";
import {
  BarChart2, Settings2, Images, Users,
  Save, Loader2, Plus, Edit, Trash2, X, CheckCircle2, AlertCircle,
  GripVertical, ToggleLeft, ToggleRight, Upload, ImageIcon,
} from "lucide-react";

const CLOUD_BASE = import.meta.env.VITE_CLOUD_API_BASE || "https://dev-api.technootales.in/v1/cloud";

async function uploadToCloud(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${CLOUD_BASE}/file`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  const result = await res.json();
  if (result.file?._id) return `${CLOUD_BASE}/file/${result.file._id}`;
  return result.url || result.data?.url || result.fileUrl || null;
}

const TABS = [
  { key: "stats",    label: "Impact Stats",  icon: BarChart2 },
  { key: "settings", label: "Site Settings", icon: Settings2 },
  { key: "slides",   label: "Hero Slides",   icon: Images },
  { key: "team",     label: "Team Members",  icon: Users },
];

const inputCls = "w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.06] text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/40";
const labelCls = "block text-xs font-medium text-white/50 mb-1";

function Toast({ message, type, onClose }) {
  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm border mb-5 ${
        type === "success"
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-red-500/10 text-red-400 border-red-500/20"
      }`}
    >
      {type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-auto hover:opacity-70"><X className="w-4 h-4" /></button>
    </motion.div>
  );
}

/* ─────────────── STATS TAB ─────────────── */
const STAT_FIELDS = [
  { key: "trekkers", label: "Happy Trekkers" },
  { key: "treks",    label: "Treks Completed" },
  { key: "schools",  label: "Schools Supported" },
  { key: "cycles",   label: "Cycles Donated" },
  { key: "drives",   label: "Drives Organized" },
  { key: "lives",    label: "Lives Impacted" },
  { key: "forts",    label: "Historic Forts" },
];

function StatsTab() {
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    adminGetSiteStats()
      .then((r) => setForm(r.data?.data || {}))
      .catch(() => setToast({ type: "error", message: "Failed to load stats" }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminUpdateSiteStats(form);
      setToast({ type: "success", message: "Stats saved successfully" });
    } catch {
      setToast({ type: "error", message: "Failed to save stats" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>;

  return (
    <div>
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      <p className="text-sm text-white/40 mb-6">These numbers appear on the Home, About, and Our Work pages.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {STAT_FIELDS.map(({ key, label }) => (
          <div key={key} className="glass rounded-xl p-4">
            <label className={labelCls}>{label}</label>
            <input
              type="number"
              min="0"
              value={form[key] ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, [key]: Number(e.target.value) }))}
              className={inputCls}
            />
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving…" : "Save Stats"}
      </button>
    </div>
  );
}

/* ─────────────── SETTINGS TAB ─────────────── */
const SETTINGS_FIELDS = [
  { key: "phone",       label: "Phone",       type: "text",   placeholder: "+91 97663 69007" },
  { key: "whatsapp",    label: "WhatsApp",    type: "text",   placeholder: "+91 97663 69007" },
  { key: "email",       label: "Email",       type: "email",  placeholder: "contact@avirtrekkers.com" },
  { key: "address",     label: "Address",     type: "text",   placeholder: "Mumbai, Maharashtra, India" },
  { key: "instagram",   label: "Instagram URL", type: "url",  placeholder: "https://instagram.com/avirtrekkers" },
  { key: "facebook",    label: "Facebook URL",  type: "url",  placeholder: "https://facebook.com/avirtrekkers" },
  { key: "youtube",     label: "YouTube URL",   type: "url",  placeholder: "https://youtube.com/@avirtrekkers" },
  { key: "foundedYear", label: "Founded Year",  type: "number", placeholder: "2020" },
];

function SettingsTab() {
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    adminGetSiteSettings()
      .then((r) => setForm(r.data?.data || {}))
      .catch(() => setToast({ type: "error", message: "Failed to load settings" }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminUpdateSiteSettings(form);
      setToast({ type: "success", message: "Settings saved successfully" });
    } catch {
      setToast({ type: "error", message: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>;

  return (
    <div>
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      <p className="text-sm text-white/40 mb-6">Contact details and social links used across the website.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {SETTINGS_FIELDS.map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label className={labelCls}>{label}</label>
            <input
              type={type}
              value={form[key] ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
              placeholder={placeholder}
              className={inputCls}
            />
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}

/* ─────────────── HERO SLIDES TAB ─────────────── */
const BLANK_SLIDE = { image: "", headline: "", highlight: "", subtext: "", order: 0, isActive: true };

function HeroSlidesTab() {
  const [slides, setSlides]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [actionId, setActionId]   = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(BLANK_SLIDE);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef              = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadToCloud(file);
      if (url) setForm((p) => ({ ...p, image: url }));
      else throw new Error("No URL returned");
    } catch {
      setToast({ type: "error", message: "Image upload failed" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const fetch = () => {
    setLoading(true);
    adminGetHeroSlides()
      .then((r) => setSlides(r.data?.data || []))
      .catch(() => setToast({ type: "error", message: "Failed to load slides" }))
      .finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const openAdd = () => { setForm(BLANK_SLIDE); setEditId(null); setShowForm(true); };
  const openEdit = (s) => { setForm({ ...s }); setEditId(s._id); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editId) await adminUpdateHeroSlide(editId, form);
      else await adminCreateHeroSlide(form);
      setShowForm(false);
      setToast({ type: "success", message: editId ? "Slide updated" : "Slide created" });
      fetch();
    } catch {
      setToast({ type: "error", message: "Failed to save slide" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this hero slide?")) return;
    try {
      setActionId(id);
      await adminDeleteHeroSlide(id);
      setToast({ type: "success", message: "Slide deleted" });
      fetch();
    } catch {
      setToast({ type: "error", message: "Failed to delete slide" });
    } finally {
      setActionId(null);
    }
  };

  const handleToggle = async (s) => {
    try {
      setActionId(s._id);
      await adminUpdateHeroSlide(s._id, { isActive: !s.isActive });
      fetch();
    } catch {
      setToast({ type: "error", message: "Failed to update slide" });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-white/40">Hero carousel slides shown on the Home page.</p>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Slide
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="glass rounded-2xl p-5 mb-5 space-y-3">
          <h3 className="text-sm font-semibold text-white mb-1">{editId ? "Edit Slide" : "New Slide"}</h3>
          <div>
            <label className={labelCls}>Image *</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                placeholder="https://... or upload below"
                className={`${inputCls} flex-1`}
              />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Upload from device"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
            {form.image && (
              <div className="mt-2 w-24 h-14 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                <img src={form.image} alt="preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Headline *</label>
              <input required type="text" value={form.headline} onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))} placeholder="Explore Maharashtra's" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Highlight (amber text) *</label>
              <input required type="text" value={form.highlight} onChange={(e) => setForm((p) => ({ ...p, highlight: e.target.value }))} placeholder="Majestic Forts" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Subtext *</label>
            <textarea required rows={2} value={form.subtext} onChange={(e) => setForm((p) => ({ ...p, subtext: e.target.value }))} placeholder="Short description for this slide" className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Order</label>
              <input type="number" min="0" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
                <span className="text-sm text-white/60">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving || uploading || !form.image}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} disabled={uploading} className="px-3 py-2 rounded-lg border border-white/10 text-white/50 hover:bg-white/[0.06] text-sm transition-colors disabled:opacity-50">
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />)}</div>
        ) : slides.length === 0 ? (
          <div className="p-12 text-center">
            <Images className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No hero slides yet. Add your first slide.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {slides.map((s) => (
              <div key={s._id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors">
                <GripVertical className="w-4 h-4 text-white/20 shrink-0" />
                <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                  <img src={s.image} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.style.display = "none"; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.headline} <span className="text-amber-400">{s.highlight}</span></p>
                  <p className="text-xs text-white/35 truncate mt-0.5">{s.subtext}</p>
                </div>
                <span className="text-xs text-white/30 shrink-0">#{s.order}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${s.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-white/40"}`}>
                  {s.isActive ? "Active" : "Off"}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleToggle(s)} disabled={actionId === s._id} title={s.isActive ? "Deactivate" : "Activate"}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 transition-colors disabled:opacity-50">
                    {actionId === s._id ? <Loader2 className="w-4 h-4 animate-spin" /> : s.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s._id)} disabled={actionId === s._id}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── TEAM TAB ─────────────── */
const BLANK_MEMBER = { name: "", role: "", description: "", photo: "", order: 0, isActive: true };

function TeamTab() {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);
  const [actionId, setActionId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(BLANK_MEMBER);
  const [saving, setSaving]     = useState(false);

  const fetch = () => {
    setLoading(true);
    adminGetTeam()
      .then((r) => setMembers(r.data?.data || []))
      .catch(() => setToast({ type: "error", message: "Failed to load team" }))
      .finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const openAdd  = () => { setForm(BLANK_MEMBER); setEditId(null); setShowForm(true); };
  const openEdit = (m) => { setForm({ ...m }); setEditId(m._id); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editId) await adminUpdateTeamMember(editId, form);
      else await adminCreateTeamMember(form);
      setShowForm(false);
      setToast({ type: "success", message: editId ? "Member updated" : "Member added" });
      fetch();
    } catch {
      setToast({ type: "error", message: "Failed to save member" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from the team?`)) return;
    try {
      setActionId(id);
      await adminDeleteTeamMember(id);
      setToast({ type: "success", message: "Member removed" });
      fetch();
    } catch {
      setToast({ type: "error", message: "Failed to delete member" });
    } finally {
      setActionId(null);
    }
  };

  const handleToggle = async (m) => {
    try {
      setActionId(m._id);
      await adminUpdateTeamMember(m._id, { isActive: !m.isActive });
      fetch();
    } catch {
      setToast({ type: "error", message: "Failed to update member" });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-white/40">Team members shown on the About Us page.</p>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="glass rounded-2xl p-5 mb-5 space-y-3">
          <h3 className="text-sm font-semibold text-white mb-1">{editId ? "Edit Member" : "New Member"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Name *</label>
              <input required type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Role *</label>
              <input required type="text" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="Lead Trek Organizer" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea required rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Short bio..." className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Photo URL (optional)</label>
              <input type="url" value={form.photo} onChange={(e) => setForm((p) => ({ ...p, photo: e.target.value }))} placeholder="https://..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Order</label>
              <input type="number" min="0" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm text-white/60">Active (visible on site)</span>
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg border border-white/10 text-white/50 hover:bg-white/[0.06] text-sm transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-white/5 rounded animate-pulse" />)}</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No team members yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {members.map((m) => (
              <div key={m._id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500/20 flex items-center justify-center shrink-0">
                  {m.photo
                    ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.style.display = "none"; }} />
                    : <span className="text-sm font-bold text-blue-400">{(m.name || "?")[0].toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{m.name}</p>
                  <p className="text-xs text-white/40 truncate">{m.role}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${m.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-white/40"}`}>
                  {m.isActive ? "Active" : "Hidden"}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleToggle(m)} disabled={actionId === m._id} title={m.isActive ? "Hide" : "Show"}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 transition-colors disabled:opacity-50">
                    {actionId === m._id ? <Loader2 className="w-4 h-4 animate-spin" /> : m.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(m._id, m.name)} disabled={actionId === m._id}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── MAIN PAGE ─────────────── */
export default function SiteContent() {
  const [activeTab, setActiveTab] = useState("stats");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold font-heading text-text mb-6">Site Content</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1 mb-7 border border-white/[0.06] w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-blue-500 text-white shadow"
                : "text-white/50 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {activeTab === "stats"    && <StatsTab />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "slides"   && <HeroSlidesTab />}
          {activeTab === "team"     && <TeamTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
