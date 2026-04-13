const Inquiry = require("../Models/InquiryModel");
const { sendContactAutoReply, sendNewInquiryNotification, sendInquiryReply } = require("../utils/emailService");

function isValidEmail(email) {
    return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// POST /api/contact
const submitContact = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name?.trim())                    return res.status(400).json({ success: false, error: "Name is required" });
        if (!email || !isValidEmail(email))   return res.status(400).json({ success: false, error: "Valid email is required" });
        if (!subject?.trim())                 return res.status(400).json({ success: false, error: "Subject is required" });
        if (!message?.trim())                 return res.status(400).json({ success: false, error: "Message is required" });

        const inquiry = await Inquiry.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || "",
            subject: subject.trim(),
            message: message.trim(),
        });

        // Send auto-reply to user (fire-and-forget)
        sendContactAutoReply({ name: inquiry.name, email: inquiry.email, subject: inquiry.subject })
            .catch(err => console.error("Contact auto-reply failed:", err));

        // Notify contact@ about new inquiry (fire-and-forget)
        sendNewInquiryNotification({ name: inquiry.name, email: inquiry.email, phone: inquiry.phone, subject: inquiry.subject, message: inquiry.message })
            .catch(err => console.error("New inquiry notification failed:", err));

        res.status(200).json({ success: true, message: "Message received. We'll get back to you within 24 hours." });
    } catch (error) {
        console.error("Contact form error:", error);
        res.status(500).json({ success: false, error: "Failed to send message. Please try again." });
    }
};

// GET /api/contact/admin — list all inquiries (admin)
const getInquiries = async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const filter = status ? { status } : {};
        const [inquiries, total] = await Promise.all([
            Inquiry.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean(),
            Inquiry.countDocuments(filter),
        ]);
        res.json({ success: true, data: inquiries, total });
    } catch (error) {
        console.error("Get inquiries error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch inquiries" });
    }
};

// PATCH /api/contact/admin/:id/status — update status (admin)
const updateInquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["new", "read", "replied"].includes(status)) {
            return res.status(400).json({ success: false, error: "Invalid status" });
        }
        const inquiry = await Inquiry.findByIdAndUpdate(id, { status }, { new: true });
        if (!inquiry) return res.status(404).json({ success: false, error: "Inquiry not found" });
        res.json({ success: true, data: inquiry });
    } catch (error) {
        console.error("Update inquiry status error:", error);
        res.status(500).json({ success: false, error: "Failed to update inquiry" });
    }
};

// POST /api/contact/admin/:id/reply — send email reply from contact@ (admin)
const replyToInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const { replyBody } = req.body;
        if (!replyBody?.trim()) {
            return res.status(400).json({ success: false, error: "Reply body is required" });
        }
        const inquiry = await Inquiry.findById(id);
        if (!inquiry) return res.status(404).json({ success: false, error: "Inquiry not found" });

        await sendInquiryReply({
            to: inquiry.email,
            toName: inquiry.name,
            subject: inquiry.subject,
            replyBody: replyBody.trim(),
            originalMessage: inquiry.message,
        });

        // Mark as replied
        inquiry.status = "replied";
        await inquiry.save();

        res.json({ success: true, data: inquiry });
    } catch (error) {
        console.error("Reply to inquiry error:", error);
        res.status(500).json({ success: false, error: "Failed to send reply" });
    }
};

module.exports = { submitContact, getInquiries, updateInquiryStatus, replyToInquiry };
