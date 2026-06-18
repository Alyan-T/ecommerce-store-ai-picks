import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    singletonId: {
      type: String,
      default: "default",
      unique: true,
    },
    aboutUsContent: {
      type: String,
      default: "Welcome to HyperStore, your curated fashion and lifestyle destination.\n\nWe believe in timeless elegance, superior quality, and unparalleled customer service. Our pieces are hand-selected to ensure you receive only the best.",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
