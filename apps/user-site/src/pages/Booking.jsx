import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getTrekById, createEnrollment } from "../services/api";
import {
  User, Phone, Mail, MapPin, Calendar, IndianRupee, Plus, Trash2,
  ChevronDown, ChevronUp, Loader2, CheckCircle2, AlertCircle,
  Users, Heart, Utensils, Droplets, ArrowLeft, Clock,
} from "lucide-react";

/* ─── constants ─── */
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const FOOD_PREFS   = ["Veg", "Non-veg"];
const GENDERS      = ["Male", "Female", "Other"];

const BLANK_PARTICIPANT = {
  fullName: "", age: "", gender: "", bloodGroup: "", address: "",
  mobile: "", email: "", pickupPoint: "", foodPreference: "Veg",
  medicalCondition: "No", medicalConditionDetails: "",
  emergencyName: "", emerContactNumber: "", emergencyRelation: "",
};

/* ─── helpers ─── */
const inputCls  = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-text text-sm placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-colors";
const labelCls  = "block text-xs font-semibold text-text-light uppercase tracking-wide mb-1";
const selectCls = `${inputCls} cursor-pointer`;

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function slotsLeft(trek) {
  if (!trek?.maxParticipants) return null;
  return trek.maxParticipants - (trek.currentParticipants || 0);
}

/* ─── ParticipantCard ─── */
function ParticipantCard({ index, data, onChange, onRemove, pickupPoints, canRemove, expanded, onToggle }) {
  const set = (field, val) => onChange(index, field, val);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-sm">{index + 1}</span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-text text-sm">{data.fullName || `Participant ${index + 1}`}</p>
            {data.gender && data.age && (
              <p className="text-xs text-text-light">{data.gender}, {data.age} yrs</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(index); }}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-text-light" /> : <ChevronDown className="w-4 h-4 text-text-light" />}
        </div>
      </button>

      {/* body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-slate-100">

              {/* Personal */}
              <div className="pt-4">
                <p className="text-xs font-bold text-text-light uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Personal Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Full Name *</label>
                    <input required type="text" value={data.fullName} onChange={e => set("fullName", e.target.value)} placeholder="As on ID proof" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Age *</label>
                    <input required type="number" min="5" max="80" value={data.age} onChange={e => set("age", e.target.value)} placeholder="Years" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Gender *</label>
                    <select required value={data.gender} onChange={e => set("gender", e.target.value)} className={selectCls}>
                      <option value="">Select</option>
                      {GENDERS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Blood Group *</label>
                    <select required value={data.bloodGroup} onChange={e => set("bloodGroup", e.target.value)} className={selectCls}>
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Food Preference *</label>
                    <select required value={data.foodPreference} onChange={e => set("foodPreference", e.target.value)} className={selectCls}>
                      {FOOD_PREFS.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-xs font-bold text-text-light uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Contact Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Mobile *</label>
                    <input required type="tel" value={data.mobile} onChange={e => set("mobile", e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={data.email} onChange={e => set("email", e.target.value)} placeholder="optional" className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Address *</label>
                    <input required type="text" value={data.address} onChange={e => set("address", e.target.value)} placeholder="City, State" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Trek */}
              {pickupPoints?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-text-light uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Pickup Point
                  </p>
                  <select value={data.pickupPoint} onChange={e => set("pickupPoint", e.target.value)} className={selectCls}>
                    <option value="">Not selected</option>
                    {pickupPoints.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              )}

              {/* Medical */}
              <div>
                <p className="text-xs font-bold text-text-light uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" /> Medical
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Any Medical Condition?</label>
                    <div className="flex gap-3">
                      {["No", "Yes"].map(v => (
                        <button key={v} type="button" onClick={() => set("medicalCondition", v)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                            data.medicalCondition === v
                              ? "bg-primary text-white border-primary"
                              : "border-slate-200 text-text hover:border-primary/40"
                          }`}
                        >{v}</button>
                      ))}
                    </div>
                  </div>
                  {data.medicalCondition === "Yes" && (
                    <div>
                      <label className={labelCls}>Details *</label>
                      <textarea required rows={2} value={data.medicalConditionDetails} onChange={e => set("medicalConditionDetails", e.target.value)} placeholder="Describe medical condition..." className={`${inputCls} resize-none`} />
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency */}
              <div>
                <p className="text-xs font-bold text-text-light uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Emergency Contact
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Name *</label>
                    <input required type="text" value={data.emergencyName} onChange={e => set("emergencyName", e.target.value)} placeholder="Contact person" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Mobile *</label>
                    <input required type="tel" value={data.emerContactNumber} onChange={e => set("emerContactNumber", e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Relation *</label>
                    <input required type="text" value={data.emergencyRelation} onChange={e => set("emergencyRelation", e.target.value)} placeholder="Parent / Spouse…" className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trek,         setTrek]         = useState(null);
  const [trekLoading,  setTrekLoading]  = useState(true);
  const [trekError,    setTrekError]    = useState(null);

  const [primary, setPrimary] = useState({ fullName: "", email: "", mobile: "" });
  const [participants, setParticipants] = useState([{ ...BLANK_PARTICIPANT }]);
  const [expanded, setExpanded] = useState([0]);

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null); // { bookingId, count }

  useEffect(() => {
    getTrekById(id)
      .then(r => setTrek(r.data?.data || r.data))
      .catch(() => setTrekError("Trek not found."))
      .finally(() => setTrekLoading(false));
  }, [id]);

  /* participant helpers */
  const addParticipant = () => {
    const next = participants.length;
    setParticipants(p => [...p, { ...BLANK_PARTICIPANT }]);
    setExpanded(e => [...e, next]);
  };

  const removeParticipant = (i) => {
    setParticipants(p => p.filter((_, idx) => idx !== i));
    setExpanded(e => e.filter(x => x !== i).map(x => x > i ? x - 1 : x));
  };

  const updateParticipant = (i, field, val) => {
    setParticipants(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };

  const toggleExpand = (i) => {
    setExpanded(e => e.includes(i) ? e.filter(x => x !== i) : [...e, i]);
  };

  /* submission */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const left = slotsLeft(trek);
    if (left !== null && participants.length > left) {
      setError(`Only ${left} slot(s) available for this trek.`);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        trekId: id,
        primaryContact: primary,
        participants,
      };
      const res = await createEnrollment(payload);
      const data = res.data?.data;
      setSuccess({ bookingId: String(data?.bookingId || ""), count: data?.count || participants.length });
    } catch (err) {
      setError(err.response?.data?.error || "Enrollment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* slots check */
  const slots = slotsLeft(trek);
  const totalPrice = (trek?.price || 0) * participants.length;

  /* ── loading / error states ── */
  if (trekLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (trekError || !trek) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-text-light">{trekError || "Trek not found"}</p>
        <Link to="/treks" className="text-primary font-semibold text-sm hover:underline">Browse Treks</Link>
      </div>
    );
  }

  /* ── success screen ── */
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white rounded-3xl shadow-lg border border-slate-100 p-10 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-text mb-2">Booking Confirmed!</h2>
          <p className="text-text-light text-sm mb-6">
            {success.count > 1 ? `${success.count} participants enrolled` : "You're enrolled"} in <span className="font-semibold text-text">{trek.title}</span>.
            We'll be in touch with further details.
          </p>
          {success.bookingId && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 mb-7 inline-block">
              <p className="text-xs text-text-light font-medium uppercase tracking-wide mb-0.5">Booking ID</p>
              <p className="font-mono font-bold text-text text-sm">{success.bookingId}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/treks" className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-colors">
              Explore More Treks
            </Link>
            <Link to="/" className="px-6 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-text font-semibold text-sm transition-colors">
              Go Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── main form ── */
  return (
    <div className="min-h-screen bg-background">

      {/* breadcrumb */}
      <div className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-text-light">
          <Link to="/treks" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Treks
          </Link>
          <span>/</span>
          <Link to={`/treks/${trek._id}`} className="hover:text-primary transition-colors truncate max-w-[200px]">{trek.title}</Link>
          <span>/</span>
          <span className="text-text font-medium">Enroll</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── LEFT: Form ── */}
          <div className="lg:col-span-2 space-y-6">

            <div>
              <h1 className="text-2xl font-heading font-bold text-text mb-0.5">Enroll in Trek</h1>
              <p className="text-text-light text-sm">{trek.title}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Primary Contact */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <h2 className="text-base font-heading font-bold text-text mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  Primary Contact
                </h2>
                <p className="text-xs text-text-light mb-4">We'll use this to send your booking confirmation.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input required type="text" value={primary.fullName}
                      onChange={e => setPrimary(p => ({ ...p, fullName: e.target.value }))}
                      placeholder="Your name" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input required type="email" value={primary.email}
                      onChange={e => setPrimary(p => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Mobile *</label>
                    <input required type="tel" value={primary.mobile}
                      onChange={e => setPrimary(p => ({ ...p, mobile: e.target.value }))}
                      placeholder="+91 98765 43210" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-heading font-bold text-text flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-primary" />
                    </div>
                    Participants
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {participants.length}
                    </span>
                  </h2>
                  {(slots === null || participants.length < slots) && (
                    <button type="button" onClick={addParticipant}
                      className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
                      <Plus className="w-4 h-4" /> Add Participant
                    </button>
                  )}
                </div>

                {participants.map((p, i) => (
                  <ParticipantCard
                    key={i}
                    index={i}
                    data={p}
                    onChange={updateParticipant}
                    onRemove={removeParticipant}
                    pickupPoints={trek.pickupPoints || []}
                    canRemove={participants.length > 1}
                    expanded={expanded.includes(i)}
                    onToggle={() => toggleExpand(i)}
                  />
                ))}
              </div>

              {/* Submit (mobile) */}
              <div className="lg:hidden bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-text-light">{participants.length} × ₹{trek.price?.toLocaleString("en-IN") || 0}</span>
                  <span className="text-lg font-bold text-text">₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-light disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <IndianRupee className="w-5 h-5" />}
                  {submitting ? "Enrolling…" : "Confirm Enrollment"}
                </button>
              </div>
            </form>
          </div>

          {/* ── RIGHT: Summary ── */}
          <div className="lg:sticky lg:top-6 space-y-4">

            {/* Trek card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {trek.images?.[0] && (
                <div className="h-36 overflow-hidden">
                  <img src={trek.images[0].url || trek.images[0]} alt={trek.title}
                    className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-heading font-bold text-text text-base mb-3">{trek.title}</h3>
                <div className="space-y-2 text-sm">
                  {trek.location && (
                    <div className="flex items-center gap-2 text-text-light">
                      <MapPin className="w-4 h-4 shrink-0 text-primary" />
                      {trek.location}
                    </div>
                  )}
                  {trek.startDate && (
                    <div className="flex items-center gap-2 text-text-light">
                      <Calendar className="w-4 h-4 shrink-0 text-primary" />
                      {formatDate(trek.startDate)} {trek.endDate ? `→ ${formatDate(trek.endDate)}` : ""}
                    </div>
                  )}
                  {trek.duration && (
                    <div className="flex items-center gap-2 text-text-light">
                      <Clock className="w-4 h-4 shrink-0 text-primary" />
                      {trek.duration}
                    </div>
                  )}
                  {slots !== null && (
                    <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full w-fit mt-1 ${
                      slots < 5 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      <Users className="w-3 h-3" />
                      {slots} spot{slots !== 1 ? "s" : ""} left
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <h4 className="font-heading font-bold text-text text-sm mb-4">Price Summary</h4>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-text-light">
                  <span>Price per person</span>
                  <span className="font-medium text-text">₹{trek.price?.toLocaleString("en-IN") || 0}</span>
                </div>
                <div className="flex justify-between text-text-light">
                  <span>Participants</span>
                  <span className="font-medium text-text">× {participants.length}</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-text">
                  <span>Total</span>
                  <span className="text-lg">₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <p className="text-xs text-text-light bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                Payment is collected offline. Our team will contact you to confirm payment.
              </p>
            </div>

            {/* Submit (desktop) */}
            <button
              type="button"
              onClick={(e) => {
                document.querySelector("form")?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
              }}
              disabled={submitting}
              className="hidden lg:flex w-full items-center justify-center gap-2 bg-secondary hover:bg-secondary-light disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold transition-colors shadow-sm"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <IndianRupee className="w-5 h-5" />}
              {submitting ? "Enrolling…" : "Confirm Enrollment"}
            </button>

            <p className="text-xs text-text-light text-center">
              By enrolling you agree to our terms. Cancellation allowed up to 7 days before trek.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
