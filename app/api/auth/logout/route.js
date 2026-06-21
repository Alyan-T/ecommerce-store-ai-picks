import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";
import Review from "@/models/Review";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import { revalidateTag } from "next/cache";

export async function POST(req) {
  const user = getUserFromRequest(req);

  if (user && user.email === "demo.seller@hyperstore.com") {
    try {
      await connectToDatabase();

      // Find all products created by this user
      const demoProducts = await Product.find({ createdBy: user.id }).select("_id").lean();
      const demoProductIds = demoProducts.map((p) => p._id);

      // Delete all reviews associated with these products
      await Review.deleteMany({ product: { $in: demoProductIds } });

      // Delete all reviews written by the user
      await Review.deleteMany({ user: user.id });

      // Delete all orders placed by this user
      await Order.deleteMany({ user: user.id });

      // Delete all orders that contain these products
      await Order.deleteMany({ "items.product": { $in: demoProductIds } });

      // Delete all coupons created by or owned by this user
      await Coupon.deleteMany({
        $or: [
          { createdBy: user.id },
          { sellerOwner: user.id }
        ]
      });

      // Delete all products created by this user
      await Product.deleteMany({ createdBy: user.id });

      // Delete the user account itself
      await User.deleteOne({ _id: user.id });

      // Purge catalog cache tags instantly
      revalidateTag("catalog-products");
    } catch (error) {
      console.error("Disposing demo seller data failed:", error);
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("token", "", { path: "/", maxAge: 0 });
  return res;
}
