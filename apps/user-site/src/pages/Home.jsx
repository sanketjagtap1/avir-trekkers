import { useState, useEffect, useRef, useCallback } from "react";
import { getFeaturedTreks, getPublicReviews, getSiteStats, getHeroSlides } from "../services/api";
import { formatPrice, formatDate, truncate } from "../lib/utils";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  MapPin, Calendar, Mountain, Users, Star, ArrowRight,
  Heart, Bike, GraduationCap, ChevronLeft, ChevronRight, ChevronDown,
} from "lucide-react";

const FALLBACK_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
    headline: "Explore Maharashtra's", highlight: "Majestic Forts",
    subtext: "Trek through the legendary Sahyadri ranges and discover centuries-old forts with Avir Trekkers",
  },
  {
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80",
    headline: "Every Weekend", highlight: "A New Adventure",
    subtext: "New trails, new sunrises, new stories — every weekend is an unforgettable experience",
  },
  {
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1920&q=80",
    headline: "Trek with", highlight: "Purpose",
    subtext: "Every trek you join contributes to schools, communities, and lives across Maharashtra",
  },
  {
    image: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1920&q=80",
    headline: "Adventure &", highlight: "Community",
    subtext: "500+ trekkers have found their tribe — join the Avir Trekkers family today",
  },
];

const FALLBACK_STATS = { trekkers: 500, treks: 50, schools: 20, cycles: 100, drives: 30, lives: 1000, forts: 25 };

const SOCIAL_IMPACT_BG = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80";

const DIFFICULTY_COLORS = {
  Easy: "bg-emerald-100 text-emerald-700",
  Moderate: "bg-amber-100 text-amber-700",
  Hard: "bg-orange-100 text-orange-700",
  Expert: "bg-rose-100 text-rose-700",
};

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
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function TrekCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="h-56 skeleton" />
      <div className="p-5 space-y-3">
        <div className="h-5 skeleton rounded w-3/4" />
        <div className="h-4 skeleton rounded w-1/2" />
        <div className="h-4 skeleton rounded w-1/3" />
      </div>
    </div>
  );
}

export default function Home() {
  const [treks, setTreks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [heroSlides, setHeroSlides] = useState(FALLBACK_SLIDES);
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoPlayRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [treksRes, reviewsRes, statsRes, slidesRes] = await Promise.all([
          getFeaturedTreks(),
          getPublicReviews(),
          getSiteStats(),
          getHeroSlides(),
        ]);
        setTreks(treksRes.data?.treks || treksRes.data?.data || treksRes.data || []);
        setReviews(reviewsRes.data?.reviews || reviewsRes.data?.data || reviewsRes.data || []);
        if (statsRes.data?.data) setStats(statsRes.data.data);
        const slides = slidesRes.data?.data;
        if (Array.isArray(slides) && slides.length > 0) setHeroSlides(slides);
      } catch (err) {
        console.error("Failed to fetch homepage data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const STAT_ITEMS = [
    { icon: Users,        label: "Happy Trekkers",  value: stats.trekkers, suffix: "+" },
    { icon: Mountain,     label: "Treks Completed", value: stats.treks,    suffix: "+" },
    { icon: GraduationCap,label: "Schools Helped",  value: stats.schools,  suffix: "+" },
    { icon: Bike,         label: "Cycles Donated",  value: stats.cycles,   suffix: "+" },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, [heroSlides.length]);

  useEffect(() => {
    autoPlayRef.current = setInterval(nextSlide, 5500);
    return () => clearInterval(autoPlayRef.current);
  }, [nextSlide]);

  function goToSlide(index) {
    clearInterval(autoPlayRef.current);
    setCurrentSlide(index);
    autoPlayRef.current = setInterval(nextSlide, 5500);
  }

  function handlePrev() { clearInterval(autoPlayRef.current); prevSlide(); autoPlayRef.current = setInterval(nextSlide, 5500); }
  function handleNext() { clearInterval(autoPlayRef.current); nextSlide(); autoPlayRef.current = setInterval(nextSlide, 5500); }

  const slide = heroSlides[currentSlide] || heroSlides[0];

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <AnimatePresence>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              <img src={slide.image} alt="" className="w-full h-full object-cover" />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/75" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-white px-4 text-center pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-sm font-medium mb-4"
              >
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                Avir Trekkers · Maharashtra
              </motion.div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-heading mb-4 leading-tight drop-shadow-lg">
                {slide.headline}{" "}
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  {slide.highlight}
                </span>
              </h1>

              <p className="text-base md:text-lg text-white/85 max-w-2xl mx-auto mb-7 leading-relaxed">
                {slide.subtext}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/treks" className="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-light text-white px-8 py-3.5 rounded-xl font-semibold transition-colors text-lg shadow-xl shadow-secondary/30">
                    <MapPin className="h-5 w-5" /> Explore Treks
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/about" className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-8 py-3.5 rounded-xl font-semibold transition-colors border border-white/25 text-lg">
                    Our Story <ArrowRight className="h-5 w-5" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-9 right-6 z-10 text-white/50 text-sm font-mono select-none">
          {String(currentSlide + 1).padStart(2, "0")} / {String(heroSlides.length).padStart(2, "0")}
        </div>
        <div className="absolute bottom-7 left-6 z-10">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="flex flex-col items-center gap-1 text-white/50">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
          <button onClick={handlePrev} className="p-2 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white transition-colors" aria-label="Previous slide">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => goToSlide(i)}
                className={`rounded-full transition-all duration-300 ${i === currentSlide ? "w-8 h-2 bg-secondary" : "w-2 h-2 bg-white/50 hover:bg-white/80"}`}
                aria-label={`Go to slide ${i + 1}`} />
            ))}
          </div>
          <button onClick={handleNext} className="p-2 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white transition-colors" aria-label="Next slide">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="relative py-10 px-4 overflow-hidden bg-gradient-to-r from-primary-dark via-primary to-primary-dark">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
            className="grid grid-cols-2 md:grid-cols-4"
          >
            {STAT_ITEMS.map(({ icon: Icon, label, value, suffix }, idx) => (
              <motion.div key={label}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55 } } }}
                className={`flex flex-col items-center text-center py-6 px-4 group ${idx < STAT_ITEMS.length - 1 ? "border-r border-white/10" : ""}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center mb-4 transition-colors ring-1 ring-white/15">
                  <Icon className="h-7 w-7 text-amber-300" />
                </div>
                <div className="text-3xl md:text-4xl font-bold font-heading text-white leading-none mb-1">
                  <AnimatedCounter target={value} suffix={suffix} />
                </div>
                <div className="text-white/60 text-sm font-medium mt-2 tracking-wide">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURED TREKS ── */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-primary/8 text-primary text-sm font-semibold rounded-full mb-3">Upcoming Adventures</span>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-text mb-3">Featured Treks</h2>
            <p className="text-text-light max-w-xl mx-auto">Discover our most popular upcoming adventures — handpicked for all skill levels</p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1, 2, 3].map((i) => <TrekCardSkeleton key={i} />)}</div>
          ) : treks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center py-12">
              <Mountain className="h-16 w-16 text-primary/30 mx-auto mb-4" />
              <p className="text-text-light text-lg">No featured treks available right now. Check back soon!</p>
            </motion.div>
          ) : (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {treks.slice(0, 6).map((trek, index) => (
                <motion.div key={trek._id || index}
                  variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                  whileHover={{ y: -6 }}
                  className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="h-56 overflow-hidden relative">
                    {trek.images?.[0] ? (
                      <img src={trek.images[0]} alt={trek.title || trek.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-dark/20 flex items-center justify-center">
                        <Mountain className="h-12 w-12 text-primary/40" />
                      </div>
                    )}
                    {trek.difficulty && (
                      <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${DIFFICULTY_COLORS[trek.difficulty] || "bg-slate-100 text-slate-700"}`}>
                        {trek.difficulty}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading font-bold text-text text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">{trek.title || trek.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-text-light mb-4">
                      {(trek.date || trek.startDate) && (
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(trek.date || trek.startDate)}</span>
                      )}
                      {trek.location && (
                        <span className="inline-flex items-center gap-1 min-w-0"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{trek.location}</span></span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xl font-bold text-primary">{trek.price ? formatPrice(trek.price) : "Free"}</span>
                      <Link to={`/treks/${trek._id}`} className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary-light text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                        Book Now <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {treks.length > 0 && (
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="text-center mt-12">
              <Link to="/treks" className="inline-flex items-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-xl font-semibold transition-all group">
                View All Treks <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── SOCIAL IMPACT ── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src={SOCIAL_IMPACT_BG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/95 via-primary/85 to-primary-dark/60" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-white">
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
                className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mb-6">
                <Heart className="h-7 w-7 text-secondary" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-5">
                Trekking with a <span className="text-amber-300">Social Heart</span>
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-4">
                Beyond trekking, we are committed to uplifting rural communities across Maharashtra. We support schools with essential supplies, donate cycles to students, and organize community welfare drives.
              </p>
              <p className="text-white/65 leading-relaxed mb-8">
                Every trek you join contributes to these meaningful causes. When you trek with us, you are part of something bigger.
              </p>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link to="/our-work" className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-light text-white px-6 py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-secondary/20">
                  <Heart className="h-5 w-5" /> See Our Work <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
              className="grid grid-cols-2 gap-4">
              <div className="glass-hero rounded-2xl p-5 text-white">
                <GraduationCap className="h-6 w-6 text-amber-300 mb-3" />
                <div className="text-2xl font-bold font-heading mb-1">{stats.schools}+</div>
                <div className="font-semibold text-sm mb-0.5">Schools Helped</div>
                <div className="text-white/60 text-xs">Across rural Maharashtra</div>
              </div>
              <div className="glass-hero rounded-2xl p-5 text-white">
                <Bike className="h-6 w-6 text-amber-300 mb-3" />
                <div className="text-2xl font-bold font-heading mb-1">{stats.cycles}+</div>
                <div className="font-semibold text-sm mb-0.5">Cycles Donated</div>
                <div className="text-white/60 text-xs">To deserving students</div>
              </div>
              <div className="glass-hero rounded-2xl p-5 text-white">
                <Heart className="h-6 w-6 text-amber-300 mb-3" />
                <div className="text-2xl font-bold font-heading mb-1">{stats.drives}+</div>
                <div className="font-semibold text-sm mb-0.5">Welfare Drives</div>
                <div className="text-white/60 text-xs">Community events held</div>
              </div>
              <div className="glass-hero rounded-2xl p-5 text-white">
                <Users className="h-6 w-6 text-amber-300 mb-3" />
                <div className="text-2xl font-bold font-heading mb-1">{stats.lives}+</div>
                <div className="font-semibold text-sm mb-0.5">Lives Impacted</div>
                <div className="text-white/60 text-xs">And counting</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── REVIEWS MARQUEE ── */}
      <section className="py-20 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center">
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent text-sm font-semibold rounded-full mb-3">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-text mb-3">What Trekkers Say</h2>
            <p className="text-text-light">Hear from our community of adventurers</p>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex gap-6 px-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-80 rounded-2xl border border-border bg-surface p-6 shadow-sm shrink-0">
                <div className="h-4 skeleton rounded w-24 mb-3" />
                <div className="h-4 skeleton rounded w-full mb-2" />
                <div className="h-4 skeleton rounded w-3/4 mb-4" />
                <div className="h-3 skeleton rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Star className="h-16 w-16 text-accent/30 mx-auto mb-4" />
            <p className="text-text-light text-lg">No reviews yet. Be the first to share your experience!</p>
            <Link to="/reviews" className="inline-flex items-center gap-2 mt-4 text-primary hover:text-primary-light font-semibold transition-colors">
              Write a Review <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            <div className="overflow-hidden">
              <div className="flex gap-6 animate-marquee w-max">
                {[...reviews, ...reviews].map((review, index) => (
                  <div key={index} className="min-w-80 max-w-80 rounded-2xl border border-border bg-surface p-6 shadow-sm shrink-0">
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < (review.rating || 0) ? "text-accent fill-accent" : "text-slate-200"}`} />
                      ))}
                    </div>
                    <p className="text-text text-sm mb-4 leading-relaxed line-clamp-3">
                      "{truncate(review.reviewText || review.comment || review.text, 120)}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {(review.name || review.userName || "A")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text text-sm truncate">{review.name || review.userName || "Anonymous"}</p>
                        {(review.trekName || review.trek?.name) && (
                          <p className="text-xs text-text-light truncate">{review.trekName || review.trek?.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reviews.length > 0 && (
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="text-center mt-10 px-4">
            <Link to="/reviews" className="inline-flex items-center gap-2 text-primary hover:text-primary-light font-semibold transition-colors group">
              See All Reviews <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}
      </section>
    </div>
  );
}
