const express = require("express");
const router = express.Router();
const {
    getTrekGallery,
    getSocialActivityGallery,
    addTrekImages,
    removeTrekImage,
    createSocialActivity,
    updateSocialActivity,
    addSocialActivityImages,
    removeSocialActivityImage,
    deleteSocialActivity,
    getAllSocialActivities,
    toggleSocialActivity,
    getGalleryTrekGallery,
    getAllGalleryTreks,
    createGalleryTrek,
    updateGalleryTrek,
    addGalleryTrekImages,
    removeGalleryTrekImage,
    deleteGalleryTrek,
    toggleGalleryTrek
} = require("../controllers/galleryController");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes (no authentication required)
router.get("/treks", getTrekGallery);
router.get("/social-activities", getSocialActivityGallery);
router.get("/gallery-treks", getGalleryTrekGallery);

// Admin routes (authentication required)
router.post("/treks/:trekId/images", authMiddleware, addTrekImages);
router.delete("/treks/:trekId/images/:imageUrl", authMiddleware, removeTrekImage);

router.get("/admin/social-activities", authMiddleware, getAllSocialActivities);
router.post("/social-activities", authMiddleware, createSocialActivity);
router.put("/social-activities/:id", authMiddleware, updateSocialActivity);
router.post("/social-activities/:id/images", authMiddleware, addSocialActivityImages);
router.delete("/social-activities/:id/images/:imageUrl", authMiddleware, removeSocialActivityImage);
router.delete("/social-activities/:id", authMiddleware, deleteSocialActivity);
router.patch("/social-activities/:id/toggle", authMiddleware, toggleSocialActivity);

// Gallery Trek routes (isolated from main trek system)
router.get("/admin/gallery-treks", authMiddleware, getAllGalleryTreks);
router.post("/gallery-treks", authMiddleware, createGalleryTrek);
router.put("/gallery-treks/:id", authMiddleware, updateGalleryTrek);
router.post("/gallery-treks/:id/images", authMiddleware, addGalleryTrekImages);
router.delete("/gallery-treks/:id/images/:imageUrl", authMiddleware, removeGalleryTrekImage);
router.delete("/gallery-treks/:id", authMiddleware, deleteGalleryTrek);
router.patch("/gallery-treks/:id/toggle", authMiddleware, toggleGalleryTrek);

module.exports = router;
