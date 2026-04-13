import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getInquiries, updateInquiryStatus, replyToInquiry } from "../services/api";
import {
  MessageCircle, Mail, Phone, Clock, Search, X,
  CheckCircle2, Circle, ChevronDown, ChevronUp, Inbox, Loader2, Send,
} from "lucide-react";

const REPLY_TEMPLATES = [
  {
    label: "General Response",
    text: `Thank you for reaching out to Avir Trekkers!\n\nWe've reviewed your inquiry and our team will get back to you with detailed information shortly. In the meantime, feel free to browse our upcoming treks at avirtrekkers.com.\n\nFor urgent queries, you can also reach us on WhatsApp at +91 97663 69007.\n\nWarm regards,\nTeam Avir Trekkers`,
  },
  {
    label: "Trek Availability",
    text: `Thank you for your interest in our trek!\n\nWe're happy to share that seats are available for the upcoming batch. To confirm your booking, please visit our website and fill out the enrollment form, or reply to this email with the number of participants and preferred date.\n\nOur team will share the complete itinerary, inclusions, and payment details once you confirm.\n\nLooking forward to trekking with you!\n\nWarm regards,\nTeam Avir Trekkers`,
  },
  {
    label: "Payment Details",
    text: `Thank you for your interest in joining us!\n\nHere are our payment details:\n\n• Bank: [Bank Name]\n• Account No: [Account Number]\n• IFSC: [IFSC Code]\n• Account Name: Avir Trekkers\n• UPI ID: [UPI ID]\n\nPlease share the payment screenshot after transfer and mention your Booking ID in the remarks.\n\nFor any payment-related queries, feel free to call or WhatsApp us at +91 97663 69007.\n\nWarm regards,\nTeam Avir Trekkers`,
  },
  {
    label: "Trek Full / Waitlist",
    text: `Thank you for showing interest in our trek!\n\nUnfortunately, the current batch is fully booked. However, we can add you to our waitlist and notify you immediately if a spot opens up — or confirm your seat in the next upcoming batch.\n\nWould you like us to add you to the waitlist or register you for the next batch? Please reply with your preference.\n\nWarm regards,\nTeam Avir Trekkers`,
  },
  {
    label: "Cancellation Policy",
    text: `Thank you for contacting us regarding the cancellation.\n\nOur cancellation policy is as follows:\n• Cancellation 15+ days before trek: 80% refund\n• Cancellation 7–14 days before trek: 50% refund\n• Cancellation within 7 days: No refund\n\nIf you'd like to proceed with the cancellation, please reply confirming your Booking ID and we'll process it within 24 hours.\n\nIf you'd prefer to reschedule instead, we're happy to transfer your booking to a future date at no extra charge.\n\nWarm regards,\nTeam Avir Trekkers`,
  },
  {
    label: "Custom / Blank",
    text: "",
  },
];

const STATUS_META = {
  new:     { label: "New",     cls: "bg-blue-500/15 text-blue-400",       dot: "bg-blue-400"     },
  read:    { label: "Read",    cls: "bg-white/10 text-white/50",           dot: "bg-white/30"     },
  replied: { label: "Replied", cls: "bg-emerald-500/15 text-emerald-400",  dot: "bg-emerald-400"  },
};

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [expandedId, setExpanded] = useState(null);
  const [actionId, setActionId]   = useState(null);

  // Reply drawer state
  const [replyId, setReplyId]         = useState(null);
  const [replyText, setReplyText]     = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError]   = useState("");
  const [replySuccess, setReplySuccess] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getInquiries()
      .then(r => setInquiries(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const patchStatus = async (id, status) => {
    setActionId(id);
    try {
      await updateInquiryStatus(id, status);
      setInquiries(prev => prev.map(q => q._id === id ? { ...q, status } : q));
    } catch {}
    setActionId(null);
  };

  const handleExpand = (id, currentStatus) => {
    const isOpening = expandedId !== id;
    setExpanded(isOpening ? id : null);
    if (isOpening && currentStatus === "new") patchStatus(id, "read");
    // Close reply drawer if switching inquiry
    if (replyId && replyId !== id) closeReply();
  };

  const openReply = (id) => {
    setReplyId(id);
    setReplyText("");
    setReplyError("");
    setReplySuccess(false);
  };

  const closeReply = () => {
    setReplyId(null);
    setReplyText("");
    setReplyError("");
    setReplySuccess(false);
  };

  const handleSendReply = async (inquiry) => {
    if (!replyText.trim()) return;
    setReplySending(true);
    setReplyError("");
    try {
      await replyToInquiry(inquiry._id, replyText.trim());
      setInquiries(prev => prev.map(q => q._id === inquiry._id ? { ...q, status: "replied" } : q));
      setReplySuccess(true);
      setReplyText("");
      setTimeout(closeReply, 1500);
    } catch (err) {
      setReplyError(err?.response?.data?.error || "Failed to send reply. Please try again.");
    } finally {
      setReplySending(false);
    }
  };

  const filtered = inquiries.filter(q => {
    const matchSearch = !search ||
      q.name.toLowerCase().includes(search.toLowerCase()) ||
      q.subject.toLowerCase().includes(search.toLowerCase()) ||
      q.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const newCount = inquiries.filter(q => q.status === "new").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-heading text-text">Inquiries</h1>
          {newCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
              {newCount} new
            </span>
          )}
        </div>
        <button onClick={load} className="text-xs text-white/40 hover:text-white/70 transition-colors">Refresh</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <input
            type="text"
            placeholder="Search by name, email or subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/10 bg-white/[0.06] text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.06] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
        {(search || statusFilter) && (
          <button onClick={() => { setSearch(""); setStatus(""); }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-text-light hover:bg-white/[0.06] transition-colors">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Inbox className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <p className="text-text-light text-sm">
            {inquiries.length === 0 ? "No inquiries yet. Contact form submissions will appear here." : "No inquiries match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inquiry => {
            const isExpanded = expandedId === inquiry._id;
            const meta = STATUS_META[inquiry.status] || STATUS_META.read;
            const busy = actionId === inquiry._id;
            const isReplying = replyId === inquiry._id;

            return (
              <motion.div key={inquiry._id} layout
                className={`glass-card rounded-2xl overflow-hidden transition-shadow ${inquiry.status === "new" ? "border border-blue-500/20" : ""}`}
              >
                {/* Header */}
                <div
                  className="flex items-start gap-4 p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => handleExpand(inquiry._id, inquiry.status)}
                >
                  <div className="mt-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${inquiry.status === "new" ? "bg-blue-400" : "bg-white/10"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`font-medium text-sm ${inquiry.status === "new" ? "text-white" : "text-text"}`}>
                        {inquiry.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <p className={`text-sm font-medium mb-0.5 ${inquiry.status === "new" ? "text-white/90" : "text-text-light"}`}>
                      {inquiry.subject}
                    </p>
                    <p className="text-xs text-white/30 line-clamp-1">{inquiry.message}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="flex items-center gap-1 text-xs text-white/30">
                      <Clock className="w-3 h-3" /> {relativeTime(inquiry.createdAt)}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                  </div>
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-white/[0.06]">
                        <div className="flex flex-wrap gap-4 py-3 mb-3">
                          <span className="flex items-center gap-1.5 text-xs text-text-light">
                            <Mail className="w-3.5 h-3.5" />
                            <a href={`mailto:${inquiry.email}`} className="hover:text-white transition-colors">{inquiry.email}</a>
                          </span>
                          {inquiry.phone && (
                            <span className="flex items-center gap-1.5 text-xs text-text-light">
                              <Phone className="w-3.5 h-3.5" /> {inquiry.phone}
                            </span>
                          )}
                        </div>
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 mb-4">
                          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 flex-wrap mb-0">
                          <button
                            onClick={() => isReplying ? closeReply() : openReply(inquiry._id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isReplying
                                ? "bg-white/10 text-white/50"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {isReplying ? "Cancel Reply" : "Reply via Email"}
                          </button>
                          {inquiry.status !== "replied" && (
                            <button disabled={busy} onClick={() => patchStatus(inquiry._id, "replied")}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-text-light hover:bg-white/[0.06] text-xs font-medium transition-colors disabled:opacity-50">
                              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Mark Replied
                            </button>
                          )}
                          {inquiry.status === "read" && (
                            <button disabled={busy} onClick={() => patchStatus(inquiry._id, "new")}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-text-light hover:bg-white/[0.06] text-xs font-medium transition-colors disabled:opacity-50">
                              <Circle className="w-3.5 h-3.5" /> Mark New
                            </button>
                          )}
                        </div>

                        {/* Reply Drawer */}
                        <AnimatePresence>
                          {isReplying && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Mail className="w-4 h-4 text-blue-400" />
                                  <div className="text-xs text-white/50">
                                    <span className="text-white/30">From:</span> contact@avirtrekkers.com
                                    &nbsp;&nbsp;
                                    <span className="text-white/30">To:</span> {inquiry.email}
                                  </div>
                                </div>

                                {/* Template chips */}
                                <div className="mb-3">
                                  <p className="text-xs text-white/30 mb-2">Quick templates</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {REPLY_TEMPLATES.map(t => (
                                      <button
                                        key={t.label}
                                        onClick={() => { setReplyText(t.text); setReplyError(""); }}
                                        className="px-2.5 py-1 rounded-full text-xs border border-white/10 text-white/50 hover:border-blue-500/40 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                                      >
                                        {t.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <textarea
                                  rows={6}
                                  value={replyText}
                                  onChange={e => { setReplyText(e.target.value); setReplyError(""); }}
                                  placeholder={`Write your reply to ${inquiry.name}...`}
                                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                                />
                                {replyError && (
                                  <p className="text-xs text-red-400 mt-2">{replyError}</p>
                                )}
                                {replySuccess && (
                                  <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Reply sent successfully!
                                  </p>
                                )}
                                <div className="flex justify-end mt-3">
                                  <button
                                    disabled={replySending || !replyText.trim()}
                                    onClick={() => handleSendReply(inquiry)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
                                  >
                                    {replySending
                                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                                      : <><Send className="w-3.5 h-3.5" /> Send Reply</>
                                    }
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-text-light mt-4">
          Showing {filtered.length} of {inquiries.length} inquir{inquiries.length !== 1 ? "ies" : "y"}
        </p>
      )}
    </motion.div>
  );
}
