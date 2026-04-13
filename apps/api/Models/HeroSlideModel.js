const mongoose = require("mongoose");

const heroSlideSchema = new mongoose.Schema(
  {
    image:     { type: String, required: true },
    headline:  { type: String, required: true },
    highlight: { type: String, required: true },
    subtext:   { type: String, required: true },
    order:     { type: Number, default: 0 },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

heroSlideSchema.index({ order: 1, isActive: 1 });

module.exports = mongoose.model("HeroSlide", heroSlideSchema);
