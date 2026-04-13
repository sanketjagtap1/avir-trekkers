import { useState, useEffect } from "react";
import { getSocialActivities, getGalleryTreks } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Heart, X, ChevronLeft, ChevronRight, ZoomIn, Images } from "lucide-react";

const TABS = [
  { key: "treks", label: "Trek Photos", icon: Camera },
  { key: "social", label: "Social Activities", icon: Heart },
];

// TODO: Replace with admin-managed hero image
const HERO_BG =
  "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1920&q=80";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 [grid-auto-rows:220px] [grid-auto-flow:dense]">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className={`skeleton rounded-xl ${i === 0 ? "col-span-2 row-span-2" : ""}`}
        />
      ))}
    </div>
  );
}

function GalleryImage({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`${className} bg-slate-100 flex items-center justify-center`}>
        <Camera className="h-8 w-8 text-slate-300" />
      </div>
    );
  }

  return (
    <>
      {!loaded && <div className={`${className} skeleton absolute inset-0`} />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}

export default function Gallery() {
  const [activeTab, setActiveTab] = useState("treks");
  const [trekPhotos, setTrekPhotos] = useState([]);
  const [socialPhotos, setSocialPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    async function fetchGallery() {
      setLoading(true);
      try {
        const [galleryTreksRes, socialRes] = await Promise.all([
          getGalleryTreks({ limit: 50 }),
          getSocialActivities({ limit: 50 }),
        ]);

        const galleryTrekData =
          galleryTreksRes.data?.data ||
          galleryTreksRes.data?.galleryTreks ||
          galleryTreksRes.data ||
          [];
        const socialData = socialRes.data?.data || socialRes.data || [];

        const flatTrekPhotos = (Array.isArray(galleryTrekData) ? galleryTrekData : []).flatMap(
          (trek) =>
            Array.isArray(trek.images)
              ? trek.images.map((img) => ({
                  url: typeof img === "string" ? img : img.url,
                  title: trek.title || trek.name || "",
                  alt: (typeof img === "object" && img.alt) || trek.title || "",
                }))
              : []
        );

        const flatSocialPhotos = (Array.isArray(socialData) ? socialData : []).flatMap(
          (activity) =>
            Array.isArray(activity.images)
              ? activity.images.map((img) => ({
                  url: typeof img === "string" ? img : img.url,
                  title: activity.title || "",
                  alt: (typeof img === "object" && img.alt) || activity.title || "",
                }))
              : []
        );

        setTrekPhotos(flatTrekPhotos);
        setSocialPhotos(flatSocialPhotos);
      } catch (err) {
        console.error("Failed to fetch gallery:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  useEffect(() => {
    setVisibleCount(15);
  }, [activeTab]);

  const currentPhotos = activeTab === "treks" ? trekPhotos : socialPhotos;
  const visiblePhotos = currentPhotos.slice(0, visibleCount);

  function openLightbox(index) {
    setLightbox(index);
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    setLightbox(null);
    document.body.style.overflow = "";
  }

  function navigate(dir) {
    setLightbox((prev) => {
      const next = prev + dir;
      if (next < 0) return currentPhotos.length - 1;
      if (next >= currentPhotos.length) return 0;
      return next;
    });
  }

  useEffect(() => {
    function onKey(e) {
      if (lightbox === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, currentPhotos.length]);

  const totalPhotos = currentPhotos.length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── HERO ── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/75 via-primary/65 to-primary-dark/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-sm font-medium mb-5">
              <Images className="h-4 w-4 text-amber-300" />
              {!loading && totalPhotos > 0 ? `${totalPhotos} Photos` : "Our Moments"}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 drop-shadow-lg">
              Our Gallery
            </h1>
            <p className="text-white/80 text-lg max-w-xl mx-auto">
              Moments captured from our treks and social activities across Maharashtra
            </p>
          </motion.div>

          {/* Tab switcher inside hero */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mt-8"
          >
            <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-2xl p-1 border border-white/20">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === key
                      ? "bg-white text-primary shadow-md"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {!loading && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === key ? "bg-primary/10 text-primary" : "bg-white/20 text-white"
                    }`}>
                      {key === "treks" ? trekPhotos.length : socialPhotos.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── GALLERY GRID ── */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading && <SkeletonGrid />}

        {!loading && currentPhotos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-4">
              <Camera className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-text mb-2">No photos yet</h3>
            <p className="text-text-light">
              Photos from our {activeTab === "treks" ? "treks" : "social activities"} will appear here soon.
            </p>
          </motion.div>
        )}

        {!loading && visiblePhotos.length > 0 && (
          <>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3 [grid-auto-rows:220px] [grid-auto-flow:dense]"
            >
              {visiblePhotos.map((item, index) => {
                const large = index % 5 === 0;

                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(index * 0.03, 0.4) }}
                    onClick={() => openLightbox(index)}
                    className={`relative rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary group cursor-pointer ${
                      large ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
                    }`}
                  >
                    {item.url ? (
                      <GalleryImage
                        src={item.url}
                        alt={item.alt || item.title || `Gallery image ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-dark/20 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-primary/40" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                      <div className="flex justify-end">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <ZoomIn className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      {item.title && (
                        <p className="text-white font-semibold text-sm leading-tight line-clamp-2 text-left">
                          {item.title}
                        </p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>

            {currentPhotos.length > visibleCount && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount((v) => v + 15)}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-light text-white font-semibold transition-colors shadow-sm"
                >
                  Load More Photos
                  <span className="text-white/70 text-sm">
                    ({currentPhotos.length - visibleCount} remaining)
                  </span>
                </button>
              </div>
            )}

            <p className="text-center text-text-light text-sm mt-6">
              Showing {visiblePhotos.length} of {currentPhotos.length} photos
            </p>
          </>
        )}
      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/60 text-sm font-mono">
              {lightbox + 1} / {currentPhotos.length}
            </div>

            {currentPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                  className="absolute left-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(1); }}
                  className="absolute right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <motion.div
              key={lightbox}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl max-h-[90vh] px-16"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentPhotos[lightbox].url}
                alt={currentPhotos[lightbox].alt || currentPhotos[lightbox].title || `Image ${lightbox + 1}`}
                className="max-w-full max-h-[80vh] object-contain mx-auto rounded-xl shadow-2xl"
                loading="lazy"
                decoding="async"
              />
              {currentPhotos[lightbox].title && (
                <p className="text-white text-center mt-4 text-base font-medium">
                  {currentPhotos[lightbox].title}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
