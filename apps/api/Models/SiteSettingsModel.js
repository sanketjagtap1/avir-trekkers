const mongoose = require("mongoose");

// Singleton document — only one record is ever stored
const siteSettingsSchema = new mongoose.Schema(
  {
    phone:       { type: String, default: "+91 97663 69007" },
    whatsapp:    { type: String, default: "+91 97663 69007" },
    email:       { type: String, default: "contact@avirtrekkers.com" },
    address:     { type: String, default: "Mumbai, Maharashtra, India" },
    instagram:   { type: String, default: "https://instagram.com/avirtrekkers" },
    facebook:    { type: String, default: "https://facebook.com/avirtrekkers" },
    youtube:     { type: String, default: "https://youtube.com/@avirtrekkers" },
    foundedYear: { type: Number, default: 2020 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
