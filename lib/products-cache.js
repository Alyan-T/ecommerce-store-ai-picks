import { unstable_cache } from "next/cache";
import Product from "@/models/Product";
import { connectToDatabase } from "@/lib/mongodb";
import { getEmbedding } from "@/lib/mistral";
import mongoose from "mongoose";

export const getProductsCached = unstable_cache(
  async (filters) => {
    await connectToDatabase();
    
    // Deconstruct and sanitize filters to ensure NoSQL safety
    const category = filters.category ? String(filters.category) : null;
    const search = filters.search ? String(filters.search) : null;
    const sellerId = filters.sellerId ? String(filters.sellerId) : null;
    const featured = filters.featured === "true" || filters.featured === true;
    const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : null;
    const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : null;
    const sortBy = filters.sortBy ? String(filters.sortBy) : "newest";
    const skip = parseInt(filters.skip || "0", 10);
    const limit = parseInt(filters.limit || "8", 10);
    const includeDemo = filters.includeDemo === true || filters.includeDemo === "true";

    let vectorProducts = null;

    if (search) {
      try {
        const queryEmbedding = await getEmbedding(search);

        const pipeline = [
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: queryEmbedding,
              numCandidates: 100,
              limit: limit + skip,
            },
          },
        ];

        // Apply filters in match stage
        const matchStage = {};
        if (category && category !== "All") matchStage.category = category;
        if (sellerId) matchStage.createdBy = new mongoose.Types.ObjectId(sellerId);
        if (featured) matchStage.featured = true;
        if (!includeDemo) matchStage.isDemo = { $ne: true };

        if (minPrice !== null || maxPrice !== null) {
          matchStage.price = {};
          if (minPrice !== null) matchStage.price.$gte = minPrice;
          if (maxPrice !== null) matchStage.price.$lte = maxPrice;
        }

        if (Object.keys(matchStage).length > 0) {
          pipeline.push({ $match: matchStage });
        }

        // Project fields (excluding embedding vector)
        pipeline.push({
          $project: {
            name: 1,
            description: 1,
            price: 1,
            category: 1,
            image: 1,
            stock: 1,
            featured: 1,
            createdBy: 1,
            sellerName: 1,
            isDemo: 1,
            createdAt: 1,
            updatedAt: 1,
            score: { $meta: "vectorSearchScore" },
          },
        });

        // Sorting
        let sortStage = null;
        if (sortBy === "price-asc") sortStage = { price: 1 };
        else if (sortBy === "price-desc") sortStage = { price: -1 };
        else if (sortBy === "name-asc") sortStage = { name: 1 };

        if (sortStage) {
          pipeline.push({ $sort: sortStage });
        }

        // Pagination
        if (skip > 0) {
          pipeline.push({ $skip: skip });
        }
        pipeline.push({ $limit: limit });

        const rawResults = await Product.aggregate(pipeline);
        vectorProducts = rawResults.map((p) => ({
          ...p,
          _id: p._id.toString(),
          createdBy: p.createdBy ? p.createdBy.toString() : null,
        }));
      } catch (err) {
        console.warn("Vector search failed, falling back to regex search:", err.message);
      }
    }

    if (vectorProducts !== null) {
      return vectorProducts;
    }

    // Fallback: Traditional MongoDB search
    const query = {};
    if (category && category !== "All") query.category = category;
    if (search) query.name = { $regex: search, $options: "i" };
    if (sellerId) query.createdBy = sellerId;
    if (featured) query.featured = true;

    // Filter out demo products unless explicitly requested by a demo account
    if (!includeDemo) {
      query.isDemo = { $ne: true };
    }

    if (minPrice !== null || maxPrice !== null) {
      query.price = {};
      if (minPrice !== null) query.price.$gte = minPrice;
      if (maxPrice !== null) query.price.$lte = maxPrice;
    }

    let sortQuery = { createdAt: -1 };
    if (sortBy === "price-asc") sortQuery = { price: 1 };
    else if (sortBy === "price-desc") sortQuery = { price: -1 };
    else if (sortBy === "name-asc") sortQuery = { name: 1 };

    // Execute query securely
    const rawProducts = await Product.find(query)
      .select("-embedding")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    // Map _id to string for React serializability
    return rawProducts.map(p => ({
      ...p,
      _id: p._id.toString(),
      createdBy: p.createdBy ? p.createdBy.toString() : null,
    }));
  },
  ["catalog-products-query"],
  { tags: ["catalog-products"] }
);
