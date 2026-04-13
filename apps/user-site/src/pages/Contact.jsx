import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getSiteSettings, submitContactForm } from "../services/api";
import {
  Send,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Loader2,
  CheckCircle,
  Camera,
  Globe,
  Video,
} from "lucide-react";

// TODO: Replace with admin-managed hero image
const HERO_BG =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80";

const FALLBACK_SETTINGS = {
  phone: "+91 97663 69007",
  whatsapp: "+91 97663 69007",
  email: "contact@avirtrekkers.com",
  address: "Mumbai, Maharashtra, India",
  instagram: "https://instagram.com/avirtrekkers",
  facebook: "https://facebook.com/avirtrekkers",
  youtube: "https://youtube.com/@avirtrekkers",
};


const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary focus:bg-white transition-colors text-sm";

export default function Contact() {
  const [siteSettings, setSiteSettings] = useState(FALLBACK_SETTINGS);

  useEffect(() => {
    getSiteSettings()
      .then((res) => { if (res.data?.data) setSiteSettings(res.data.data); })
      .catch(() => {});
  }, []);

  const CONTACT_ITEMS = [
    { icon: Phone,         label: "Phone",    value: siteSettings.phone,    href: `tel:${(siteSettings.phone || "").replace(/\s/g, "")}`,                        bg: "bg-blue-50",    color: "text-blue-700" },
    { icon: MessageCircle, label: "WhatsApp", value: siteSettings.whatsapp, href: `https://wa.me/${(siteSettings.whatsapp || "").replace(/[^0-9]/g, "")}`,       bg: "bg-emerald-50", color: "text-emerald-600", external: true },
    { icon: Mail,          label: "Email",    value: siteSettings.email,    href: `mailto:${siteSettings.email}`,                                                bg: "bg-orange-50",  color: "text-orange-500" },
    { icon: MapPin,        label: "Location", value: siteSettings.address,  href: null,                                                                          bg: "bg-purple-50",  color: "text-purple-600" },
  ];

  const SOCIAL_LINKS = [
    { icon: Camera, label: "Instagram", url: siteSettings.instagram },
    { icon: Globe,  label: "Facebook",  url: siteSettings.facebook },
    { icon: Video,  label: "YouTube",   url: siteSettings.youtube },
  ].filter((s) => s.url);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      await submitContactForm(form);
      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 6000);
    } catch (err) {
      setSubmitError(err.response?.data?.error || "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/80 via-primary/70 to-primary-dark/85" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-sm font-medium mb-5">
              <MessageCircle className="h-4 w-4 text-emerald-300" />
              We'd love to hear from you
            </span>
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 drop-shadow-lg">
              Contact Us
            </h1>
            <p className="text-white/80 text-lg max-w-xl mx-auto">
              Have questions about a trek? Want to partner with us? Reach out and
              we'll get back to you within a few hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FORM + SIDEBAR ── */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-7 md:p-9"
          >
            <div className="mb-7">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-bold uppercase tracking-widest mb-2">
                Send a Message
              </span>
              <h2 className="text-2xl font-heading font-bold text-text">
                Get in Touch
              </h2>
            </div>

            {submitted && (
              <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-semibold">
                  Message sent! We'll get back to you within 24 hours. Check your inbox for a confirmation.
                </p>
              </div>
            )}

            {submitError && (
              <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                <span className="h-5 w-5 flex-shrink-0 text-red-500">✕</span>
                <p className="text-sm font-semibold">{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={inputClass}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={inputClass}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className={inputClass}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => handleChange("subject", e.target.value)}
                    className={inputClass}
                    placeholder="What is this about?"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-1.5">
                  Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Type your message here..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </motion.div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">

            {/* Contact info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6"
            >
              <h3 className="text-base font-heading font-bold text-text mb-5">
                Reach Us Directly
              </h3>
              <div className="flex flex-col gap-4">
                {CONTACT_ITEMS.map(({ icon: Icon, label, value, href, bg, color, external }) => {
                  const inner = (
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-4.5 w-4.5 ${color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-light uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-medium text-text">{value}</p>
                      </div>
                    </div>
                  );

                  if (!href) return <div key={label}>{inner}</div>;
                  return (
                    <a
                      key={label}
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="hover:opacity-80 transition-opacity"
                    >
                      {inner}
                    </a>
                  );
                })}
              </div>
            </motion.div>

            {/* Social links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6"
            >
              <h3 className="text-base font-heading font-bold text-text mb-4">
                Follow Us
              </h3>
              <div className="flex gap-3">
                {SOCIAL_LINKS.map(({ icon: Icon, label, url }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-primary/10 hover:text-primary flex items-center justify-center text-slate-500 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </motion.div>

            {/* WhatsApp CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">Quick Response</p>
                  <p className="text-white/70 text-xs">Usually within a few hours</p>
                </div>
              </div>
              <p className="text-white/85 text-xs leading-relaxed mb-4">
                For trek bookings and urgent queries, WhatsApp is the fastest way to reach us.
              </p>
              <a
                href={`https://wa.me/${(siteSettings.whatsapp || "").replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-emerald-600 text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/90 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
