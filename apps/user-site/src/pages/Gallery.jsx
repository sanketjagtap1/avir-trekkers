import { useState, useEffect } from "react";
import { getSocialActivities, getGalleryTreks } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Heart, X, ChevronLeft, ChevronRight } from "lucide-react";

const TABS = [
  { key: "treks", label: "Trek Photos", icon: Camera },
  { key: "social", label: "Social Activities", icon: Heart },
];

function ImageSkeleton() {
  return (
    <div className="aspect-square skeleton rounded-xl animate-pulse" />
  );
}

export default function Gallery() {
  const [activeTab, setActiveTab] = useState("treks");
  const [trekPhotos, setTrekPhotos] = useState([]);
  const [socialPhotos, setSocialPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [visibleTrek, setVisibleTrek] = useState(12);
  const [visibleSocial, setVisibleSocial] = useState(12);

  useEffect(() => {
    async function fetchGallery() {
      setLoading(true);
      try {
        const [galleryTreksRes, socialRes] = await Promise.all([
          getGalleryTreks({ limit: 50 }),
          getSocialActivities({ limit: 50 }),
        ]);
        const galleryTrekData = galleryTreksRes.data?.data || galleryTreksRes.data?.galleryTreks || galleryTreksRes.data || [];
        const socialData = socialRes.data?.data || socialRes.data || [];

        // Gallery Treks (dedicated gallery entries from admin) — flatten nested images arrays
        const flatTrekPhotos = [];
        (Array.isArray(galleryTrekData) ? galleryTrekData : []).forEach((trek) => {
          if (Array.isArray(trek.images)) {
            trek.images.forEach((img) => {
              flatTrekPhotos.push({
                url: typeof img === "string" ? img : img.url,
                title: trek.title || trek.name || "",
                alt: (typeof img === "object" && img.alt) || trek.title || "",
              });
            });
          }
        });

        // Social activities also have nested images arrays
        const flatSocialPhotos = [];
        (Array.isArray(socialData) ? socialData : []).forEach((activity) => {
          if (Array.isArray(activity.images)) {
            activity.images.forEach((img) => {
              flatSocialPhotos.push({
                url: typeof img === "string" ? img : img.url,
                title: activity.title || "",
                alt: (typeof img === "object" && img.alt) || activity.title || "",
              });
            });
          }
        });

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

  // Reset pagination when switching tabs
  useEffect(() => {
    setVisibleTrek(12);
    setVisibleSocial(12);
  }, [activeTab]);

  const currentPhotos = activeTab === "treks" ? trekPhotos : socialPhotos;
  const currentVisible = activeTab === "treks" ? visibleTrek : visibleSocial;
  const visiblePhotos = currentPhotos.slice(0, currentVisible);

  function getImageUrl(item) {
    if (typeof item === "string") return item;
    return item.url || item.image || item.imageUrl || item.src || "";
  }

  function getImageTitle(item) {
    if (typeof item === "string") return "";
    return item.title || item.name || item.caption || "";
  }

  function openLightbox(index) {
    setLightbox(index);
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    setLightbox(null);
    document.body.style.overflow = "";
  }

  function navigateLightbox(direction) {
    setLightbox((prev) => {
      const next = prev + direction;
      if (next < 0) return currentPhotos.length - 1;
      if (next >= currentPhotos.length) return 0;
      return next;
    });
  }

  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (lightbox === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigateLightbox(-1);
      if (e.key === "ArrowRight") navigateLightbox(1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox, currentPhotos.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary-dark to-primary text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold font-heading mb-4"
          >
            Our Gallery
          </motion.h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Moments captured from our treks and social activities
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-muted rounded-2xl p-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === key
                    ? "bg-primary text-white"
                    : "text-text-light hover:text-text"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ImageSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && currentPhotos.length === 0 && (
          <div className="text-center py-16">
            <Camera className="h-16 w-16 text-primary/30 mx-auto mb-4" />
            <h3 className="text-xl font-heading font-semibold text-text mb-2">
              No photos yet
            </h3>
            <p className="text-text-light">
              Photos from our{" "}
              {activeTab === "treks" ? "treks" : "social activities"} will
              appear here soon.
            </p>
          </div>
        )}

        {/* Image Grid */}
        {!loading && currentPhotos.length > 0 && (
          <>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {visiblePhotos.map((item, index) => {
                const url = getImageUrl(item);
                const title = getImageTitle(item);
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => openLightbox(index)}
                    className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {url ? (
                      <img
                        src={url}
                        alt={title || `Gallery image ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-dark/20 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                      {title && (
                        <p className="text-white text-sm p-3 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                          {title}
                        </p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>

            {currentPhotos.length > currentVisible && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() =>
                    activeTab === "treks"
                      ? setVisibleTrek((v) => v + 12)
                      : setVisibleSocial((v) => v + 12)
                  }
                  className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
            >
              <X className="h-8 w-8" />
            </button>

            {currentPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox(-1);
                  }}
                  className="absolute left-4 text-white/80 hover:text-white z-10 p-2"
                >
                  <ChevronLeft className="h-10 w-10" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox(1);
                  }}
                  className="absolute right-4 text-white/80 hover:text-white z-10 p-2"
                >
                  <ChevronRight className="h-10 w-10" />
                </button>
              </>
            )}

            <div
              className="max-w-5xl max-h-[90vh] px-12"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getImageUrl(currentPhotos[lightbox])}
                alt={
                  getImageTitle(currentPhotos[lightbox]) ||
                  `Image ${lightbox + 1}`
                }
                className="max-w-full max-h-[85vh] object-contain mx-auto rounded"
              />
              {getImageTitle(currentPhotos[lightbox]) && (
                <p className="text-white text-center mt-4 text-lg">
                  {getImageTitle(currentPhotos[lightbox])}
                </p>
              )}
              <p className="text-white/50 text-center mt-2 text-sm">
                {lightbox + 1} / {currentPhotos.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
