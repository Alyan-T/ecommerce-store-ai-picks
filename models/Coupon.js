import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code:            { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    maxUses:         { type: Number, default: null },   // null = unlimited
    usedCount:       { type: Number, default: 0 },
    expiresAt:       { type: Date,   default: null },   // null = never expires
    active:          { type: Boolean, default: true },
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // For seller-scoped coupons — null means platform-wide (admin created)
    sellerOwner:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
