import mongoose from "mongoose";
import "dotenv/config";
import Blog from "../models/Blog.js";

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/imagica";
    console.log("Connecting to Database:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Database connected. Migrating existing blogs to have default order of 100000...");

    const result = await Blog.updateMany(
      { order: { $exists: false } },
      { $set: { order: 100000 } }
    );

    console.log(`Migration complete. Updated ${result.modifiedCount} blogs.`);
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  } catch (error) {
    console.error("Error migrating database:", error);
    process.exit(1);
  }
};

migrate();
