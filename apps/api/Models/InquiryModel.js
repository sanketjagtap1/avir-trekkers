const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema({
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, trim: true, lowercase: true },
    phone:   { type: String, trim: true, default: "" },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status:  { type: String, enum: ["new", "read", "replied"], default: "new" },
}, { timestamps: true });

inquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Inquiry", inquirySchema);
