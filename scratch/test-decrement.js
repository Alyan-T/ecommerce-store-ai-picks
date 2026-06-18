import mongoose from "mongoose";

async function run() {
  await mongoose.connect("mongodb://localhost:27017/shopai");
  const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({
    stock: Number
  }));
  
  const p = await Product.create({ stock: 100 });
  console.log("Initial stock:", p.stock);
  
  const stockUpdates = [{
    updateOne: {
      filter: { _id: p._id.toString(), stock: { $gte: 2 } },
      update: { $inc: { stock: -2 } },
    },
  }];
  
  const bulkResult = await Product.bulkWrite(stockUpdates, { ordered: false });
  console.log("BulkWrite modifiedCount:", bulkResult.modifiedCount);
  
  const updated = await Product.findById(p._id);
  console.log("Final stock:", updated.stock);
  process.exit(0);
}
run();
