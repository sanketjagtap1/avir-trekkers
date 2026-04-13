import { useState, useEffect, useRef } from "react";
import { getPublicTreks, getCategories } from "../services/api";
import { formatPrice, formatDate } from "../lib/utils";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Calendar,
  Mountain,
  ArrowRight,
  RefreshCw,
  X,
  Clock,
  Users,
  TrendingUp,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

const DIFFICULTY_OPTIONS = ["Easy", "Moderate", "Hard", "Expert"];

const DIFFICULTY_CONFIG = {
  Easy: { color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  Moderate: { color: "bg-amber-100 text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  Hard: { color: "bg-orange-100 text-orange-700", dot: "bg-orange-500", border: "border-orange-200" },
  Expert: { color: "bg-rose-100 text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
};

// TODO: Replace with admin-managed hero image
const HERO_BG = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80";

function TrekCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
      <div className="h-60 skeleton" />
      <div className="p-5 space-y-3">
        <div className="h-5 skeleton rounded w-3/4" />
        <div className="h-4 skeleton rounded w-1/2" />
        <div className="h-4 skeleton rounded w-full" />
        <div className="flex justify-between pt-2">
          <div className="h-6 skeleton rounded w-20" />
          <div className="h-9 skeleton rounded w-28" />
        </div>
      </div>
    </div>
  );
}

function SlotsBar({ current, max }) {
  const pct = Math.min(100, Math.round((current / max) * 100));
  const remaining = max - current;
  const isAlmostFull = remaining <= 5;
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-light">
          <span className={isAlmostFull ? "text-orange-600 font-semibold" : "text-text-light"}>
            {remaining} spots left
          </span>
        </span>
        <span className="text-text-light">{max} total</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 80 ? "bg-orange-500" : pct >= 50 ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Treks() {
  const [treks, setTreks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const filterRef = useRef(null);
  const sentinelRef = useRef(null);

  async function fetchTreks(params = {}) {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicTreks(params);
      setTreks(res.data?.treks || res.data?.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch treks:", err);
      setError("Failed to load treks. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data?.categories || res.data?.data || res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (difficulty) params.difficulty = difficulty;
    if (category) params.category = category;
    fetchTreks(params);
  }, [difficulty, category]);

  // Sticky filter observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-64px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const params = {};
    if (search) params.search = search;
    if (difficulty) params.difficulty = difficulty;
    if (category) params.category = category;
    fetchTreks(params);
  }

  function clearFilters() {
    setSearch("");
    setDifficulty("");
    setCategory("");
  }

  function removeFilter(key) {
    if (key === "search") setSearch("");
    if (key === "difficulty") setDifficulty("");
    if (key === "category") setCategory("");
  }

  const activeFilters = [
    search && { key: "search", label: `"${search}"` },
    difficulty && { key: "difficulty", label: difficulty },
    category && { key: "category", label: categories.find((c) => c._id === category)?.name || category },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* ── HERO ── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/80 via-primary/70 to-primary-dark/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-sm font-medium mb-5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              {treks.length > 0 && !loading ? `${treks.length} Upcoming Treks` : "Upcoming Treks"}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 drop-shadow-lg">
              Explore Our Treks
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Find your next adventure across Maharashtra's stunning forts, hills, and nature trails
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sentinel for sticky detection */}
      <div ref={sentinelRef} className="h-px" />

      {/* ── STICKY FILTER BAR ── */}
      <div
        ref={filterRef}
        className={`sticky top-16 z-30 transition-all duration-200 ${
          isSticky
            ? "bg-white/95 backdrop-blur-md shadow-md border-b border-border"
            : "bg-white border-b border-border"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-light" />
              <input
                type="text"
                placeholder="Search by trek name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>

            {/* Category select */}
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-border bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-44 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.name} value={cat._id || cat.name}>
                    {cat.icon ? `${cat.icon} ` : ""}{cat.name || cat.title || cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-light pointer-events-none" />
            </div>

            {/* Difficulty pills */}
            <div className="flex items-center gap-1.5 bg-muted rounded-xl px-2 py-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-text-light ml-1 shrink-0" />
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(difficulty === d ? "" : d)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    difficulty === d
                      ? DIFFICULTY_CONFIG[d].color + " ring-1 " + DIFFICULTY_CONFIG[d].border
                      : "text-text-light hover:text-text hover:bg-white"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Search button */}
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl font-semibold transition-colors text-sm inline-flex items-center gap-2 shrink-0"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>

          {/* Active filter chips */}
          <AnimatePresence>
            {activeFilters.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 pt-2 flex-wrap"
              >
                <span className="text-xs text-text-light font-medium">Active filters:</span>
                {activeFilters.map(({ key, label }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/8 text-primary text-xs font-semibold rounded-full"
                  >
                    {label}
                    <button onClick={() => removeFilter(key)} className="hover:text-primary-dark">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearFilters}
                  className="text-xs text-text-light hover:text-text underline underline-offset-2 ml-1"
                >
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results header */}
        {!loading && !error && treks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-6"
          >
            <p className="text-text-light text-sm">
              Showing <span className="font-semibold text-text">{treks.length}</span> trek{treks.length !== 1 ? "s" : ""}
              {activeFilters.length > 0 && " matching your filters"}
            </p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => fetchTreks()}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <TrekCardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && treks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-4">
              <Mountain className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-text mb-2">No treks found</h3>
            <p className="text-text-light mb-6">Try adjusting your filters or search terms</p>
            {activeFilters.length > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 bg-primary/8 hover:bg-primary/15 text-primary px-5 py-2.5 rounded-xl font-semibold transition-colors text-sm"
              >
                <X className="h-4 w-4" />
                Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* Trek Grid */}
        {!loading && !error && treks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {treks.map((trek, index) => (
              <TrekCard key={trek._id || index} trek={trek} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrekCard({ trek, index }) {
  const diff = trek.difficulty;
  const diffConfig = DIFFICULTY_CONFIG[diff] || { color: "bg-slate-100 text-slate-700", dot: "bg-slate-400", border: "border-slate-200" };
  const spotsLeft = trek.maxParticipants - (trek.currentParticipants || 0);
  const isAlmostFull = spotsLeft <= 5 && spotsLeft > 0;
  const isFull = spotsLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
    >
      {/* Image */}
      <div className="h-60 overflow-hidden relative shrink-0">
        {trek.images?.[0] ? (
          <img
            src={trek.images[0]}
            alt={trek.title || trek.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-dark/20 flex items-center justify-center">
            <Mountain className="h-12 w-12 text-primary/40" />
          </div>
        )}
        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {trek.isFeatured && (
            <span className="px-2.5 py-1 bg-secondary text-white text-xs font-bold rounded-full shadow">
              Featured
            </span>
          )}
        </div>
        {diff && (
          <span className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow ${diffConfig.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${diffConfig.dot}`} />
            {diff}
          </span>
        )}

        {/* Height & Duration overlaid on image bottom */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3">
          {trek.height && (
            <span className="inline-flex items-center gap-1 text-white/90 text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
              <TrendingUp className="h-3 w-3" />
              {trek.height}m
            </span>
          )}
          {trek.duration && (
            <span className="inline-flex items-center gap-1 text-white/90 text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
              <Clock className="h-3 w-3" />
              {trek.duration}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading font-bold text-text text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {trek.title || trek.name}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-light mb-3">
          {(trek.date || trek.startDate) && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDate(trek.date || trek.startDate)}
            </span>
          )}
          {trek.location && (
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{trek.location}</span>
            </span>
          )}
        </div>

        {/* Slots */}
        {trek.maxParticipants > 0 && (
          <SlotsBar current={trek.currentParticipants || 0} max={trek.maxParticipants} />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-border">
          <div>
            <div className="text-xs text-text-light mb-0.5">Starting from</div>
            <span className="text-xl font-bold text-primary">
              {trek.price ? formatPrice(trek.price) : "Free"}
            </span>
          </div>
          <Link
            to={`/treks/${trek._id}`}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              isFull
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-secondary hover:bg-secondary-light text-white shadow-sm hover:shadow-md"
            }`}
          >
            {isFull ? "Fully Booked" : isAlmostFull ? "Book Now!" : "Book Now"}
            {!isFull && <ArrowRight className="h-4 w-4" />}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
