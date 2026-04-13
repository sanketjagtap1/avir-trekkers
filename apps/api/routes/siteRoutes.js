const express = require("express");
const router = express.Router();
const authenticateJWT = require("../middleware/authMiddleware");
const {
  getStats, getSettings, getHeroSlides, getTeam,
  updateStats, updateSettings,
  createHeroSlide, updateHeroSlide, deleteHeroSlide,
  createTeamMember, updateTeamMember, deleteTeamMember,
} = require("../controllers/siteController");

// ── Public ──────────────────────────────────────────────
router.get("/stats",       getStats);
router.get("/settings",    getSettings);
router.get("/hero-slides", getHeroSlides);
router.get("/team",        getTeam);

// ── Admin (protected) ───────────────────────────────────
router.put("/stats",              authenticateJWT, updateStats);
router.put("/settings",           authenticateJWT, updateSettings);

router.post("/hero-slides",       authenticateJWT, createHeroSlide);
router.put("/hero-slides/:id",    authenticateJWT, updateHeroSlide);
router.delete("/hero-slides/:id", authenticateJWT, deleteHeroSlide);

router.post("/team",              authenticateJWT, createTeamMember);
router.put("/team/:id",           authenticateJWT, updateTeamMember);
router.delete("/team/:id",        authenticateJWT, deleteTeamMember);

module.exports = router;
