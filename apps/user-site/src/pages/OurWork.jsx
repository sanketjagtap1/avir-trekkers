import { useState, useEffect, useRef } from "react";
import { getSocialActivities, getSiteStats } from "../services/api";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Heart,
  GraduationCap,
  Bike,
  Users,
  HandHeart,
  ArrowRight,
  Camera,
  MapPin,
} from "lucide-react";

// TODO: Replace with admin-managed hero image
const HERO_BG =
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1920&q=80";

function AnimatedCounter({ target, suffix = "", duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

const FALLBACK_STATS = { schools: 20, cycles: 100, lives: 500, drives: 30 };

const INITIATIVES = [
  {
    icon: GraduationCap,
    bg: "bg-blue-50",
    color: "text-blue-700",
    tag: "Education",
    title: "School Support Program",
    description:
      "We provide essential school supplies, books, and educational materials to underprivileged schools in rural Maharashtra. Our trekkers visit these schools during treks, interacting with students and understanding their needs firsthand.",
  },
  {
    icon: Bike,
    bg: "bg-orange-50",
    color: "text-orange-500",
    tag: "Mobility",
    title: "Cycle Donation Drive",
    description:
      "Many students in rural areas walk several kilometres to reach school. We donate cycles to these students, making their journey to education easier and safer. Each cycle donated is a step towards a brighter future.",
  },
  {
    icon: HandHeart,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    tag: "Welfare",
    title: "Community Welfare",
    description:
      "From clothing drives to health camps, we organise various community welfare initiatives across villages we visit during our treks. Our goal is to leave every place we visit a little better than we found it.",
  },
];

function ActivitySkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
      <div className="h-52 skeleton" />
      <div className="p-5 space-y-3">
        <div className="h-5 skeleton rounded w-3/4" />
        <div className="h-4 skeleton rounded w-full" />
        <div className="h-4 skeleton rounded w-2/3" />
      </div>
    </div>
  );
}

function ActivityCard({ activity, index }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageUrl =
    typeof activity === "string"
      ? activity
      : activity.images?.[0]?.url ||
        activity.url || activity.image || activity.imageUrl || activity.src || "";
  const title =
    typeof activity === "string" ? "" : activity.title || activity.name || "";
  const description =
    typeof activity === "string"
      ? ""
      : activity.description || activity.caption || activity.text || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm group hover:-translate-y-1 transition-transform duration-300"
    >
      <div className="relative h-52 overflow-hidden">
        {imageUrl && !imgError ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={imageUrl}
              alt={title || `Activity ${index + 1}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/15 to-primary-dark/15 flex items-center justify-center">
            <Heart className="h-12 w-12 text-primary/30" />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-5">
        {title && (
          <h3 className="font-heading font-semibold text-text text-base mb-1.5">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-text-light text-sm leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function OurWork() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(FALLBACK_STATS);

  useEffect(() => {
    async function fetchData() {
      try {
        const [activitiesRes, statsRes] = await Promise.all([
          getSocialActivities(),
          getSiteStats(),
        ]);
        setActivities(
          activitiesRes.data?.activities ||
            activitiesRes.data?.data ||
            activitiesRes.data?.images ||
            activitiesRes.data ||
            []
        );
        if (statsRes.data?.data) {
          const s = statsRes.data.data;
          setStats({ schools: s.schools, cycles: s.cycles, lives: s.lives, drives: s.drives });
        }
      } catch (err) {
        console.error("Failed to fetch our work data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <section className="relative py-28 px-4 overflow-hidden">
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
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-sm font-medium mb-5">
              <Heart className="h-4 w-4 text-rose-300" />
              Adventure with Purpose
            </span>
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 drop-shadow-lg">
              Our Social Impact
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
              At Avir Trekkers, adventure and social responsibility go hand in hand.
              Every trek we organise is an opportunity to give back to the communities we visit.
            </p>
          </motion.div>

          {/* Inline quick-stats in hero */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap justify-center gap-3 mt-10"
          >
            {[
              { label: "Schools Supported", value: stats.schools },
              { label: "Cycles Donated",    value: stats.cycles },
              { label: "Lives Impacted",    value: stats.lives },
              { label: "Drives Organized",  value: stats.drives },
            ].map(({ label, value }) => (
              <div key={label} className="px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                <span className="text-white font-bold text-lg">{value}+</span>
                <span className="text-white/65 text-sm ml-1.5">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="py-10 bg-gradient-to-r from-primary-dark via-primary to-primary-dark">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: GraduationCap, label: "Schools Supported", value: stats.schools },
              { icon: Bike,          label: "Cycles Donated",    value: stats.cycles },
              { icon: Users,         label: "Lives Impacted",    value: stats.lives },
              { icon: HandHeart,     label: "Drives Organized",  value: stats.drives },
            ].map(({ icon: Icon, label, value }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-amber-300" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white tabular-nums">
                  <AnimatedCounter target={value} suffix="+" />
                </div>
                <div className="text-white/55 text-xs font-medium uppercase tracking-wide">
                  {label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INITIATIVES ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-bold uppercase tracking-widest mb-3">
              What We Do
            </span>
            <h2 className="text-3xl font-heading font-bold text-text mb-2">
              Our Initiatives
            </h2>
            <p className="text-text-light text-sm">
              Programs that create lasting positive change
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {INITIATIVES.map(({ icon: Icon, bg, color, tag, title, description }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-7 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${bg} ${color}`}>
                    {tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-text mb-2">{title}</h3>
                  <p className="text-text-light text-sm leading-relaxed">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT ACTIVITIES ── */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-bold uppercase tracking-widest mb-3">
              In Action
            </span>
            <h2 className="text-3xl font-heading font-bold text-text mb-2">
              Recent Activities
            </h2>
            <p className="text-text-light text-sm">
              Moments from our social impact work across Maharashtra
            </p>
          </motion.div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <ActivitySkeleton key={i} />)}
            </div>
          )}

          {!loading && activities.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-10 w-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-text mb-2">
                No activities yet
              </h3>
              <p className="text-text-light text-sm">
                Activity highlights from our social drives will appear here soon.
              </p>
            </div>
          )}

          {!loading && activities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity, index) => (
                <ActivityCard key={index} activity={activity} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 px-4 bg-gradient-to-r from-[#0B2545] to-[#1D3557] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3">
              Join the Movement
            </h2>
            <p className="text-white/60 mb-7 text-sm leading-relaxed max-w-xl mx-auto">
              Every trek you join helps us make a difference. Be part of a community
              that treks with purpose and creates positive change across Maharashtra.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/treks"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-7 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                <MapPin className="h-4 w-4" /> Join a Trek
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-7 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Get in Touch <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
