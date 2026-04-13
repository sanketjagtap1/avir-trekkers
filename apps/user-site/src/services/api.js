import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "Something went wrong";
    console.error(
      `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
      message
    );
    return Promise.reject(error);
  }
);

// Treks
export const getPublicTreks = (params) => api.get("/treks", { params });
export const getFeaturedTreks = () => api.get("/treks/featured");
export const getTrekById = (id) => api.get(`/treks/${id}`);
export const getTrekCategories = () => api.get("/treks/categories");
export const getTreksByCategory = (category) =>
  api.get(`/treks/category/${category}`);

// Enrollments
export const sendOTP = (data) => api.post("/enrollments/send-otp", data);
export const verifyOTP = (data) => api.post("/enrollments/verify-otp", data);
export const createEnrollment = (data) => api.post("/enrollments", data);

// Reviews
export const getPublicReviews = () => api.get("/reviews/public");
export const getReviewStats = () => api.get("/reviews/stats");
export const submitReview = (data) => api.post("/reviews/submit", data);

// Gallery
export const getTrekGallery = () => api.get("/gallery/treks");
export const getSocialActivities = (params) => api.get("/gallery/social-activities", { params });
export const getGalleryTreks = (params) => api.get("/gallery/gallery-treks", { params });

// Site — stats, settings, hero slides, team
export const getSiteStats    = ()     => api.get("/site/stats");
export const getSiteSettings = ()     => api.get("/site/settings");
export const getHeroSlides   = ()     => api.get("/site/hero-slides");
export const getTeamMembers  = ()     => api.get("/site/team");

// Contact
export const submitContactForm = (data) => api.post("/contact", data);

// Categories
export const getCategories = () => api.get("/categories");

// Auth
export const loginUser = (data) => api.post("/auth/login", data);
export const registerUser = (data) => api.post("/auth/registration", data);
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const resetPassword = (data) => api.post("/auth/reset-password", data);

export default api;
