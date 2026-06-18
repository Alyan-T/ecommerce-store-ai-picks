const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {
    singletonId: { type: String, default: "default", unique: true },
    aboutUsContent: { type: String },
  },
  { timestamps: true, collection: "settings" }
);

const Settings = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    sellerName: String,
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

async function run() {
  const uri = "";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  // 1. Settings
  let settings = await Settings.findOne({ singletonId: "default" });
  if (settings) {
    console.log("Current Settings aboutUsContent:", settings.aboutUsContent);
    let updatedContent = settings.aboutUsContent;
    if (updatedContent.includes("ShopAI")) {
      updatedContent = updatedContent.replace(/ShopAI/g, "HyperStore");
    }
    if (updatedContent.includes("Stella")) {
      updatedContent = updatedContent.replace(/Stella/g, "HyperStore");
    }
    if (updatedContent !== settings.aboutUsContent) {
      settings.aboutUsContent = updatedContent;
      await settings.save();
      console.log("Updated Settings to:", updatedContent);
    } else {
      console.log("Settings already clean.");
    }
  } else {
    console.log("No Settings document found, creating one...");
    settings = await Settings.create({
      singletonId: "default",
      aboutUsContent: "Welcome to HyperStore, your curated fashion and lifestyle destination.\n\nWe believe in timeless elegance, superior quality, and unparalleled customer service. Our pieces are hand-selected to ensure you receive only the best."
    });
    console.log("Created Settings.");
  }

  // 2. Products
  const productsWithOldName = await Product.find({
    $or: [
      { sellerName: "ShopAI" },
      { sellerName: "Stella" }
    ]
  });
  console.log(`Found ${productsWithOldName.length} products with old sellerName`);
  if (productsWithOldName.length > 0) {
    const res = await Product.updateMany(
      { $or: [{ sellerName: "ShopAI" }, { sellerName: "Stella" }] },
      { $set: { sellerName: "HyperStore" } }
    );
    console.log(`Updated products:`, res);
  }

  await mongoose.disconnect();
  console.log("Disconnected");
}

run().catch(console.error);
