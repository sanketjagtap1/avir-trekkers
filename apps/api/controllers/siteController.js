const SiteStats    = require("../Models/SiteStatsModel");
const SiteSettings = require("../Models/SiteSettingsModel");
const HeroSlide    = require("../Models/HeroSlideModel");
const TeamMember   = require("../Models/TeamMemberModel");

/* ─────────────────────── PUBLIC ─────────────────────── */

// GET /api/site/stats
const getStats = async (req, res) => {
  try {
    // findOne — if no doc exists yet, create one with defaults
    let stats = await SiteStats.findOne();
    if (!stats) stats = await SiteStats.create({});
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

// GET /api/site/settings
const getSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({});
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
};

// GET /api/site/hero-slides
const getHeroSlides = async (req, res) => {
  try {
    const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: slides });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch hero slides" });
  }
};

// GET /api/site/team
const getTeam = async (req, res) => {
  try {
    const members = await TeamMember.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch team" });
  }
};

/* ─────────────────────── ADMIN ─────────────────────── */

// PUT /api/site/stats
const updateStats = async (req, res) => {
  try {
    const allowed = ["trekkers", "treks", "schools", "cycles", "drives", "lives", "forts"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = Number(req.body[k]); });

    const stats = await SiteStats.findOneAndUpdate(
      {},
      { $set: updates },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: stats, message: "Stats updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update stats" });
  }
};

// PUT /api/site/settings
const updateSettings = async (req, res) => {
  try {
    const allowed = ["phone", "whatsapp", "email", "address", "instagram", "facebook", "youtube", "foundedYear"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const settings = await SiteSettings.findOneAndUpdate(
      {},
      { $set: updates },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: settings, message: "Settings updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};

// POST /api/site/hero-slides
const createHeroSlide = async (req, res) => {
  try {
    const { image, headline, highlight, subtext, order, isActive } = req.body;
    if (!image || !headline || !highlight || !subtext) {
      return res.status(400).json({ success: false, message: "image, headline, highlight, subtext are required" });
    }
    const slide = await HeroSlide.create({ image, headline, highlight, subtext, order: order ?? 0, isActive: isActive ?? true });
    res.status(201).json({ success: true, data: slide, message: "Hero slide created" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create hero slide" });
  }
};

// PUT /api/site/hero-slides/:id
const updateHeroSlide = async (req, res) => {
  try {
    const slide = await HeroSlide.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!slide) return res.status(404).json({ success: false, message: "Slide not found" });
    res.json({ success: true, data: slide, message: "Hero slide updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update hero slide" });
  }
};

// DELETE /api/site/hero-slides/:id
const deleteHeroSlide = async (req, res) => {
  try {
    const slide = await HeroSlide.findByIdAndDelete(req.params.id);
    if (!slide) return res.status(404).json({ success: false, message: "Slide not found" });
    res.json({ success: true, message: "Hero slide deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete hero slide" });
  }
};

// POST /api/site/team
const createTeamMember = async (req, res) => {
  try {
    const { name, role, description, photo, order, isActive } = req.body;
    if (!name || !role || !description) {
      return res.status(400).json({ success: false, message: "name, role, description are required" });
    }
    const member = await TeamMember.create({ name, role, description, photo: photo ?? "", order: order ?? 0, isActive: isActive ?? true });
    res.status(201).json({ success: true, data: member, message: "Team member created" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create team member" });
  }
};

// PUT /api/site/team/:id
const updateTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: "Team member not found" });
    res.json({ success: true, data: member, message: "Team member updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update team member" });
  }
};

// DELETE /api/site/team/:id
const deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Team member not found" });
    res.json({ success: true, message: "Team member deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete team member" });
  }
};

module.exports = {
  getStats, getSettings, getHeroSlides, getTeam,
  updateStats, updateSettings,
  createHeroSlide, updateHeroSlide, deleteHeroSlide,
  createTeamMember, updateTeamMember, deleteTeamMember,
};
