import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach token from sessionStorage
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 -> redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("adminToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const adminLogin = (data) => api.post("/auth/login", data);

// Treks (admin)
export const getAllTreks = () => api.get("/treks/admin/all");
export const getTrekStats = () => api.get("/treks/admin/stats");
export const getTrekById = (id) => api.get(`/treks/${id}`);
export const createTrek = (data) => api.post("/treks", data);
export const updateTrek = (id, data) => api.put(`/treks/${id}`, data);
export const deleteTrek = (id) => api.delete(`/treks/${id}`);
export const toggleTrekStatus = (id) => api.patch(`/treks/${id}/status`);

// Enrollments (admin)
export const getAllEnrollments = () => api.get("/enrollments/admin/all");
export const getEnrollmentStats = () => api.get("/enrollments/admin/stats");
export const getTrekEnrollments = (trekId) => api.get(`/enrollments/trek/${trekId}`);
export const updateEnrollment = (id, data) => api.put(`/enrollments/${id}`, data);
export const cancelEnrollment = (id) => api.delete(`/enrollments/${id}/cancel`);

// Categories
export const getCategories = () => api.get("/categories");
export const createCategory = (data) => api.post("/categories", data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
export const toggleCategoryStatus = (id) => api.patch(`/categories/${id}/status`);

// Reviews (admin)
export const getAdminReviews = () => api.get("/reviews/admin");
export const updateReviewStatus = (id, data) => api.put(`/reviews/admin/${id}/status`, data);
export const deleteReview = (id) => api.delete(`/reviews/admin/${id}`);

// Gallery – Social Activities
export const getSocialActivities = () => api.get("/gallery/admin/social-activities");
export const createSocialActivity = (data) => api.post("/gallery/social-activities", data);
export const updateSocialActivity = (id, data) => api.put(`/gallery/social-activities/${id}`, data);
export const deleteSocialActivity = (id) => api.delete(`/gallery/social-activities/${id}`);
export const addSocialActivityImages = (id, data) => api.post(`/gallery/social-activities/${id}/images`, data);
export const removeSocialActivityImage = (id, imageUrl) => api.delete(`/gallery/social-activities/${id}/images/${encodeURIComponent(imageUrl)}`);

// Gallery – Trek Images (public trek gallery)
export const getTrekImages = () => api.get("/gallery/treks");
export const addTrekImages = (trekId, data) => api.post(`/gallery/treks/${trekId}/images`, data);
export const removeTrekImage = (trekId, imageUrl) => api.delete(`/gallery/treks/${trekId}/images/${encodeURIComponent(imageUrl)}`);

// Gallery – Gallery Treks (archival/past treks)
export const getGalleryTreks = () => api.get("/gallery/admin/gallery-treks");
export const createGalleryTrek = (data) => api.post("/gallery/gallery-treks", data);
export const updateGalleryTrek = (id, data) => api.put(`/gallery/gallery-treks/${id}`, data);
export const deleteGalleryTrek = (id) => api.delete(`/gallery/gallery-treks/${id}`);
export const addGalleryTrekImages = (id, data) => api.post(`/gallery/gallery-treks/${id}/images`, data);
export const removeGalleryTrekImage = (id, imageUrl) => api.delete(`/gallery/gallery-treks/${id}/images/${encodeURIComponent(imageUrl)}`);
export const toggleSocialActivity = (id) => api.patch(`/gallery/social-activities/${id}/toggle`);
export const toggleGalleryTrek = (id) => api.patch(`/gallery/gallery-treks/${id}/toggle`);

// Auth – Change password
export const changePassword = (data) => api.post("/auth/change-password", data);

export default api;
