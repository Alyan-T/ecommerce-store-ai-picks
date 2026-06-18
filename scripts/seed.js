// Seeds the database with sample products and generates an embedding
// for each one using OpenAI, so the AI chatbot's vector search has
// something to work with.
//
// Run with: npm run seed
// (requires MONGODB_URI and OPENAI_API_KEY in .env.local)

const mongoose = require("mongoose");

let mistral;

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    price: Number,
    category: String,
    image: String,
    stock: Number,
    embedding: [Number],
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

const products = [
  { name: "Wireless Bluetooth Headphones", description: "Over-ear noise-cancelling headphones with 30-hour battery life and deep bass.", price: 79.99, category: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" },
  { name: "Smartwatch Fitness Tracker", description: "Tracks heart rate, steps, sleep, and workouts. Water resistant with a 7-day battery.", price: 59.99, category: "Electronics", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600" },
  { name: "Portable Bluetooth Speaker", description: "Compact waterproof speaker with rich sound, perfect for outdoor adventures.", price: 34.99, category: "Electronics", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600" },
  { name: "27-inch 4K Monitor", description: "Ultra HD display with vibrant colors, ideal for gaming and creative work.", price: 299.99, category: "Electronics", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600" },
  { name: "Mechanical Gaming Keyboard", description: "RGB backlit keyboard with tactile switches for fast, responsive typing.", price: 89.99, category: "Electronics", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600" },

  { name: "Men's Running Shoes", description: "Lightweight breathable sneakers designed for comfort during long runs.", price: 64.99, category: "Sports", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600" },
  { name: "Yoga Mat", description: "Non-slip extra-thick mat for yoga, pilates, and home workouts.", price: 24.99, category: "Sports", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600" },
  { name: "Adjustable Dumbbell Set", description: "Space-saving dumbbells with adjustable weight plates for home gyms.", price: 129.99, category: "Sports", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600" },
  { name: "Waterproof Hiking Boots", description: "Durable boots with excellent grip and ankle support for rugged trails.", price: 94.99, category: "Sports", image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600" },
  { name: "Insulated Water Bottle", description: "Keeps drinks cold for 24 hours or hot for 12 hours. Great for the gym or hiking.", price: 19.99, category: "Sports", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600" },

  { name: "Men's Slim Fit Denim Jacket", description: "Classic blue denim jacket with a modern slim fit cut.", price: 49.99, category: "Clothing", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600" },
  { name: "Women's Knit Sweater", description: "Soft cozy sweater perfect for cold weather, available in multiple colors.", price: 39.99, category: "Clothing", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600" },
  { name: "Cotton Hoodie", description: "Warm and comfortable hoodie made from premium cotton blend.", price: 34.99, category: "Clothing", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600" },
  { name: "Classic Leather Belt", description: "Genuine leather belt with a polished buckle, suits both casual and formal wear.", price: 22.99, category: "Clothing", image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600" },
  { name: "Waterproof Rain Jacket", description: "Lightweight packable rain jacket, ideal for travel and outdoor activities.", price: 54.99, category: "Clothing", image: "https://images.unsplash.com/photo-1545594861-3bef43ff2fc8?w=600" },

  { name: "Non-stick Cookware Set", description: "10-piece non-stick pots and pans set, dishwasher safe and durable.", price: 119.99, category: "Home", image: "https://images.unsplash.com/photo-1584990347449-39b3b1c1b3a3?w=600" },
  { name: "Memory Foam Pillow", description: "Ergonomic pillow that contours to your neck and shoulders for better sleep.", price: 29.99, category: "Home", image: "https://images.unsplash.com/photo-1592789705501-f9ae4287c4cb?w=600" },
  { name: "LED Desk Lamp", description: "Adjustable brightness desk lamp with USB charging port, perfect for studying.", price: 27.99, category: "Home", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600" },
  { name: "Aromatherapy Essential Oil Diffuser", description: "Ultrasonic diffuser with color-changing LED lights for relaxation.", price: 32.99, category: "Home", image: "https://images.unsplash.com/photo-1602910344008-22f323cc1817?w=600" },

  { name: "Atomic Habits", description: "A bestselling book on building good habits and breaking bad ones, by James Clear.", price: 14.99, category: "Books", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600" },
  { name: "The Pragmatic Programmer", description: "A classic guide to software craftsmanship and best practices for developers.", price: 39.99, category: "Books", image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600" },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local");
  }
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is not set. Add it to .env.local");
  }

  // @mistralai/mistralai is ESM-only, so it must be dynamically imported
  // from this CommonJS script.
  const { Mistral } = await import("@mistralai/mistralai");
  mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  await Product.deleteMany({});
  console.log("Cleared existing products");

  for (const p of products) {
    const embeddingResponse = await mistral.embeddings.create({
      model: "mistral-embed",
      inputs: [`${p.name}. ${p.description}. Category: ${p.category}.`],
    });

    const embedding = embeddingResponse.data[0].embedding;

    await Product.create({ ...p, stock: 100, embedding });
    console.log(`Inserted: ${p.name}`);

    // Small delay to stay within Mistral's free-tier rate limits
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log("Seeding complete!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
