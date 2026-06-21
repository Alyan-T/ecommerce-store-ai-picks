import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, default: "" },
    stock: { type: Number, default: 100 },
    featured: { type: Boolean, default: false },

    // Who created this product (admin or seller)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sellerName: { type: String, default: "HyperStore" },
    isDemo: { type: Boolean, default: false },

    // 1024-dimension vector from Mistral's mistral-embed model.
    // A vector search index must be created on this field in Atlas.
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
