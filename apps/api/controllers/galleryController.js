const mongoose = require("mongoose");
const Trek = require("../Models/TrekModel");
const SocialActivity = require("../Models/SocialActivityModel");
const GalleryTrek = require("../Models/GalleryTrekModel");

// GET: Get all treks with images for gallery (including past/completed treks)
const getTrekGallery = async (req, res) => {
    try {
        // Get all treks (active and inactive, past and future) that have images
        const treks = await Trek.find({ 
            $or: [
                { images: { $exists: true, $ne: [] } },
                { imageUrl: { $exists: true, $ne: "" } }
            ]
        })
        .populate('category', 'name')
        .select('title name location description images imageUrl category status startDate endDate isActive')
        .sort({ startDate: -1, createdAt: -1 })
        .lean();

        // Transform treks to include all images and filter out those without images
        const treksWithImages = treks
            .map(trek => {
                let allImages = [];
                
                // Handle images array
                if (trek.images && Array.isArray(trek.images) && trek.images.length > 0) {
                    allImages = trek.images.map(img => ({
                        url: typeof img === 'string' ? img : img.url || img,
                        alt: typeof img === 'string' ? trek.title || trek.name : (img.alt || trek.title || trek.name)
                    }));
                }
                
                // Handle single imageUrl
                if (trek.imageUrl && !allImages.find(img => img.url === trek.imageUrl)) {
                    allImages.push({
                        url: trek.imageUrl,
                        alt: trek.title || trek.name
                    });
                }

                return {
                    _id: trek._id,
                    id: trek._id,
                    name: trek.title || trek.name,
                    title: trek.title || trek.name,
                    location: trek.location,
                    description: trek.description,
                    category: trek.category,
                    images: allImages
                };
            })
            .filter(trek => trek.images && trek.images.length > 0);

        res.status(200).json({
            success: true,
            data: treksWithImages,
            count: treksWithImages.length
        });
    } catch (error) {
        console.error("Error fetching trek gallery:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch trek gallery"
        });
    }
};

// GET: Get all social activities for gallery
const getSocialActivityGallery = async (req, res) => {
    try {
        const limit = Math.max(1, parseInt(req.query.limit) || 50);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const skip = (page - 1) * limit;

        const filter = {
            isActive: true,
            images: { $exists: true }
        };

        // Count all matching docs before the in-memory image filter; we do
        // the image-presence filter in JS (same as before), so we fetch one
        // page-worth of candidates and also get the total filtered count.
        const allMatching = await SocialActivity.find(filter)
            .populate('createdBy', 'fullName')
            .select('title description images category date location')
            .sort({ date: -1 })
            .lean();

        // Filter activities that have at least one image
        const withImages = allMatching.filter(activity =>
            activity.images && Array.isArray(activity.images) && activity.images.length > 0
        );

        const total = withImages.length;
        const totalPages = Math.ceil(total / limit) || 1;
        const activities = withImages.slice(skip, skip + limit);

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasMore: page < totalPages
            }
        });
    } catch (error) {
        console.error("Error fetching social activity gallery:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch social activity gallery"
        });
    }
};

// POST: Add images to a trek
const addTrekImages = async (req, res) => {
    try {
        const { trekId } = req.params;
        const { images } = req.body; // Array of image URLs

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Images array is required"
            });
        }

        const trek = await Trek.findById(trekId);
        if (!trek) {
            return res.status(404).json({
                success: false,
                error: "Trek not found"
            });
        }

        // Add new images to existing images array
        const imageUrls = images.map(img => typeof img === 'string' ? img : img.url || img);
        trek.images = [...(trek.images || []), ...imageUrls];
        trek.updatedAt = new Date();

        await trek.save();

        res.status(200).json({
            success: true,
            message: "Images added successfully",
            data: trek
        });
    } catch (error) {
        console.error("Error adding trek images:", error);
        res.status(500).json({
            success: false,
            error: "Failed to add trek images"
        });
    }
};

// DELETE: Remove image from trek
const removeTrekImage = async (req, res) => {
    try {
        const { trekId, imageUrl } = req.params;
        const decodedImageUrl = decodeURIComponent(imageUrl);

        const trek = await Trek.findById(trekId);
        if (!trek) {
            return res.status(404).json({
                success: false,
                error: "Trek not found"
            });
        }

        trek.images = trek.images.filter(img => {
            const imgUrl = typeof img === 'string' ? img : img.url || img;
            return imgUrl !== decodedImageUrl;
        });
        trek.updatedAt = new Date();

        await trek.save();

        res.status(200).json({
            success: true,
            message: "Image removed successfully",
            data: trek
        });
    } catch (error) {
        console.error("Error removing trek image:", error);
        res.status(500).json({
            success: false,
            error: "Failed to remove trek image"
        });
    }
};

// POST: Create social activity
const createSocialActivity = async (req, res) => {
    try {
        const { title, description, images, category, date, location } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                error: "Title and description are required"
            });
        }

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                success: false,
                error: "At least one image is required"
            });
        }

        const activity = new SocialActivity({
            title,
            description,
            images: images.filter(img => img).map(img => ({
                url: typeof img === 'string' ? img : img.url || img,
                alt: typeof img === 'string' ? title : (img.alt || title)
            })),
            category: category || "Other",
            date: date ? new Date(date) : new Date(),
            location: location || "",
            createdBy: req.user.userId
        });

        await activity.save();

        res.status(201).json({
            success: true,
            message: "Social activity created successfully",
            data: activity
        });
    } catch (error) {
        console.error("Error creating social activity:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create social activity"
        });
    }
};

// PUT: Update social activity
const updateSocialActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, images, category, date, location, isActive } = req.body;

        const activity = await SocialActivity.findById(id);
        if (!activity) {
            return res.status(404).json({
                success: false,
                error: "Social activity not found"
            });
        }

        if (title) activity.title = title;
        if (description) activity.description = description;
        if (category) activity.category = category;
        if (date) activity.date = new Date(date);
        if (location !== undefined) activity.location = location;
        if (isActive !== undefined) activity.isActive = isActive;

        if (images && Array.isArray(images)) {
            activity.images = images.filter(img => img).map(img => ({
                url: typeof img === 'string' ? img : img.url || img,
                alt: typeof img === 'string' ? activity.title : (img.alt || activity.title)
            }));
        }

        activity.updatedAt = new Date();
        await activity.save();

        res.status(200).json({
            success: true,
            message: "Social activity updated successfully",
            data: activity
        });
    } catch (error) {
        console.error("Error updating social activity:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update social activity"
        });
    }
};

// POST: Add images to social activity
const addSocialActivityImages = async (req, res) => {
    try {
        const { id } = req.params;
        const { images } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Images array is required"
            });
        }

        const activity = await SocialActivity.findById(id);
        if (!activity) {
            return res.status(404).json({
                success: false,
                error: "Social activity not found"
            });
        }

        const newImages = images.map(img => ({
            url: typeof img === 'string' ? img : img.url || img,
            alt: typeof img === 'string' ? activity.title : (img.alt || activity.title),
            uploadedAt: new Date()
        }));

        activity.images = [...activity.images, ...newImages];
        activity.updatedAt = new Date();
        await activity.save();

        res.status(200).json({
            success: true,
            message: "Images added successfully",
            data: activity
        });
    } catch (error) {
        console.error("Error adding social activity images:", error);
        res.status(500).json({
            success: false,
            error: "Failed to add social activity images"
        });
    }
};

// DELETE: Remove image from social activity
const removeSocialActivityImage = async (req, res) => {
    try {
        const { id, imageUrl } = req.params;
        const decodedImageUrl = decodeURIComponent(imageUrl);

        const activity = await SocialActivity.findById(id);
        if (!activity) {
            return res.status(404).json({
                success: false,
                error: "Social activity not found"
            });
        }

        activity.images = activity.images.filter(img => img.url !== decodedImageUrl);
        activity.updatedAt = new Date();
        await activity.save();

        res.status(200).json({
            success: true,
            message: "Image removed successfully",
            data: activity
        });
    } catch (error) {
        console.error("Error removing social activity image:", error);
        res.status(500).json({
            success: false,
            error: "Failed to remove social activity image"
        });
    }
};

// DELETE: Delete social activity
const deleteSocialActivity = async (req, res) => {
    try {
        const { id } = req.params;

        const activity = await SocialActivity.findById(id);
        if (!activity) {
            return res.status(404).json({
                success: false,
                error: "Social activity not found"
            });
        }

        await SocialActivity.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Social activity deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting social activity:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete social activity"
        });
    }
};

// GET: Get all social activities (for admin) - including past/inactive ones
const getAllSocialActivities = async (req, res) => {
    try {
        const { page = 1, limit = 1000, category, isActive } = req.query;

        const filter = {};
        if (category) filter.category = category;
        // Only filter by isActive if explicitly provided, otherwise get all
        if (isActive !== undefined && isActive !== 'undefined') {
            filter.isActive = isActive === 'true';
        }

        const activities = await SocialActivity.find(filter)
            .populate('createdBy', 'fullName email')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await SocialActivity.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching social activities:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch social activities"
        });
    }
};

// ========== GALLERY TREK FUNCTIONS (Isolated from main Trek system) ==========

// GET: Get all gallery treks for public gallery
const getGalleryTrekGallery = async (req, res) => {
    try {
        const limit = Math.max(1, parseInt(req.query.limit) || 50);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const skip = (page - 1) * limit;

        const allGalleryTreks = await GalleryTrek.find({
            isActive: true,
            images: { $exists: true, $ne: [] }
        })
        .populate('createdBy', 'fullName email')
        .select('title description location images difficulty duration date')
        .sort({ date: -1, createdAt: -1 })
        .lean();

        // Filter to only include treks with actual images then shape the response
        const allTreksWithImages = allGalleryTreks
            .filter(trek => trek.images && Array.isArray(trek.images) && trek.images.length > 0)
            .map(trek => ({
                _id: trek._id,
                title: trek.title,
                description: trek.description,
                location: trek.location,
                images: trek.images.map(img => ({
                    url: typeof img === 'string' ? img : img.url || img,
                    alt: typeof img === 'string' ? trek.title : (img.alt || trek.title)
                })),
                difficulty: trek.difficulty,
                duration: trek.duration,
                date: trek.date
            }));

        const total = allTreksWithImages.length;
        const totalPages = Math.ceil(total / limit) || 1;
        const treksWithImages = allTreksWithImages.slice(skip, skip + limit);

        res.status(200).json({
            success: true,
            data: treksWithImages,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasMore: page < totalPages
            }
        });
    } catch (error) {
        console.error("Error fetching gallery trek gallery:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch gallery treks"
        });
    }
};

// GET: Get all gallery treks (for admin)
const getAllGalleryTreks = async (req, res) => {
    try {
        const { page = 1, limit = 1000, isActive } = req.query;

        const filter = {};
        if (isActive !== undefined && isActive !== 'undefined') {
            filter.isActive = isActive === 'true';
        }

        const galleryTreks = await GalleryTrek.find(filter)
            .populate('createdBy', 'fullName email')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await GalleryTrek.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: galleryTreks,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching gallery treks:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch gallery treks"
        });
    }
};

// POST: Create gallery trek
const createGalleryTrek = async (req, res) => {
    try {
        const { title, description, location, images, difficulty, duration, date } = req.body;

        if (!title || !description || !location) {
            return res.status(400).json({
                success: false,
                error: "Title, description, and location are required"
            });
        }

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                success: false,
                error: "At least one image is required"
            });
        }

        const galleryTrek = new GalleryTrek({
            title,
            description,
            location,
            images: images.filter(img => img).map(img => ({
                url: typeof img === 'string' ? img : img.url || img,
                alt: typeof img === 'string' ? title : (img.alt || title)
            })),
            difficulty: difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase() : "Moderate",
            duration: duration || "",
            date: date ? new Date(date) : new Date(),
            createdBy: req.user.userId
        });

        await galleryTrek.save();

        res.status(201).json({
            success: true,
            message: "Gallery trek created successfully",
            data: galleryTrek
        });
    } catch (error) {
        console.error("Error creating gallery trek:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create gallery trek"
        });
    }
};

// PUT: Update gallery trek
const updateGalleryTrek = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, location, difficulty, duration, date, isActive, images } = req.body;

        const galleryTrek = await GalleryTrek.findById(id);
        if (!galleryTrek) {
            return res.status(404).json({
                success: false,
                error: "Gallery trek not found"
            });
        }

        if (title) galleryTrek.title = title;
        if (description !== undefined) galleryTrek.description = description;
        if (location) galleryTrek.location = location;
        if (difficulty) galleryTrek.difficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
        if (duration !== undefined) galleryTrek.duration = duration;
        if (date) galleryTrek.date = new Date(date);
        if (isActive !== undefined) galleryTrek.isActive = isActive;
        if (images && Array.isArray(images)) {
            galleryTrek.images = images.filter((img) => img).map((img) => ({
                url: typeof img === "string" ? img : img.url || img,
                alt: typeof img === "string" ? (title || galleryTrek.title) : (img.alt || title || galleryTrek.title),
                uploadedAt: new Date(),
            }));
        }
        galleryTrek.updatedAt = new Date();

        await galleryTrek.save();

        res.status(200).json({
            success: true,
            message: "Gallery trek updated successfully",
            data: galleryTrek
        });
    } catch (error) {
        console.error("Error updating gallery trek:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update gallery trek"
        });
    }
};

// POST: Add images to gallery trek
const addGalleryTrekImages = async (req, res) => {
    try {
        const { id } = req.params;
        const { images } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                success: false,
                error: "At least one image is required"
            });
        }

        const galleryTrek = await GalleryTrek.findById(id);
        if (!galleryTrek) {
            return res.status(404).json({
                success: false,
                error: "Gallery trek not found"
            });
        }

        const newImages = images.map(img => ({
            url: typeof img === 'string' ? img : img.url || img,
            alt: typeof img === 'string' ? galleryTrek.title : (img.alt || galleryTrek.title),
            uploadedAt: new Date()
        }));

        galleryTrek.images.push(...newImages);
        galleryTrek.updatedAt = new Date();
        await galleryTrek.save();

        res.status(200).json({
            success: true,
            message: "Images added successfully",
            data: galleryTrek
        });
    } catch (error) {
        console.error("Error adding gallery trek images:", error);
        res.status(500).json({
            success: false,
            error: "Failed to add images"
        });
    }
};

// DELETE: Remove image from gallery trek
const removeGalleryTrekImage = async (req, res) => {
    try {
        const { id, imageUrl } = req.params;

        const galleryTrek = await GalleryTrek.findById(id);
        if (!galleryTrek) {
            return res.status(404).json({
                success: false,
                error: "Gallery trek not found"
            });
        }

        // Decode the image URL in case it's encoded
        const decodedImageUrl = decodeURIComponent(imageUrl);

        galleryTrek.images = galleryTrek.images.filter(img => {
            const imgUrl = typeof img === 'string' ? img : img.url;
            return imgUrl !== decodedImageUrl && imgUrl !== imageUrl;
        });

        galleryTrek.updatedAt = new Date();
        await galleryTrek.save();

        res.status(200).json({
            success: true,
            message: "Image removed successfully",
            data: galleryTrek
        });
    } catch (error) {
        console.error("Error removing gallery trek image:", error);
        res.status(500).json({
            success: false,
            error: "Failed to remove image"
        });
    }
};

// DELETE: Delete gallery trek
const deleteGalleryTrek = async (req, res) => {
    try {
        const { id } = req.params;

        const galleryTrek = await GalleryTrek.findByIdAndDelete(id);
        if (!galleryTrek) {
            return res.status(404).json({
                success: false,
                error: "Gallery trek not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Gallery trek deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting gallery trek:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete gallery trek"
        });
    }
};

// PATCH: Toggle isActive on a social activity
const toggleSocialActivity = async (req, res) => {
    try {
        const { id } = req.params;

        const activity = await SocialActivity.findById(id);
        if (!activity) {
            return res.status(404).json({
                success: false,
                error: "Social activity not found"
            });
        }

        activity.isActive = !activity.isActive;
        activity.updatedAt = new Date();
        await activity.save();

        res.status(200).json({
            success: true,
            message: `Social activity ${activity.isActive ? "activated" : "deactivated"} successfully`,
            data: activity
        });
    } catch (error) {
        console.error("Error toggling social activity:", error);
        res.status(500).json({
            success: false,
            error: "Failed to toggle social activity"
        });
    }
};

// PATCH: Toggle isActive on a gallery trek
const toggleGalleryTrek = async (req, res) => {
    try {
        const { id } = req.params;

        const galleryTrek = await GalleryTrek.findById(id);
        if (!galleryTrek) {
            return res.status(404).json({
                success: false,
                error: "Gallery trek not found"
            });
        }

        galleryTrek.isActive = !galleryTrek.isActive;
        galleryTrek.updatedAt = new Date();
        await galleryTrek.save();

        res.status(200).json({
            success: true,
            message: `Gallery trek ${galleryTrek.isActive ? "activated" : "deactivated"} successfully`,
            data: galleryTrek
        });
    } catch (error) {
        console.error("Error toggling gallery trek:", error);
        res.status(500).json({
            success: false,
            error: "Failed to toggle gallery trek"
        });
    }
};

module.exports = {
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
    // Gallery Trek functions
    getGalleryTrekGallery,
    getAllGalleryTreks,
    createGalleryTrek,
    updateGalleryTrek,
    addGalleryTrekImages,
    removeGalleryTrekImage,
    deleteGalleryTrek,
    toggleGalleryTrek
};
