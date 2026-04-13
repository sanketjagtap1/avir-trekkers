const mongoose = require("mongoose");

// Singleton document — only one record is ever stored
const siteStatsSchema = new mongoose.Schema(
  {
    trekkers: { type: Number, default: 500 },
    treks:    { type: Number, default: 50 },
    schools:  { type: Number, default: 20 },
    cycles:   { type: Number, default: 100 },
    drives:   { type: Number, default: 30 },
    lives:    { type: Number, default: 1000 },
    forts:    { type: Number, default: 25 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteStats", siteStatsSchema);
