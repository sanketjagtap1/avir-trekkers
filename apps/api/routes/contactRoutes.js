const express = require("express");
const router = express.Router();
const { submitContact, getInquiries, updateInquiryStatus, replyToInquiry } = require("../controllers/contactController");
const authenticateJWT = require("../middleware/authMiddleware");

router.post("/", submitContact);
router.get("/admin", authenticateJWT, getInquiries);
router.patch("/admin/:id/status", authenticateJWT, updateInquiryStatus);
router.post("/admin/:id/reply", authenticateJWT, replyToInquiry);

module.exports = router;
