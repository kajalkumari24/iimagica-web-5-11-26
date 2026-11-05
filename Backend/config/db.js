import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Modern mongoose (v6+) enables the recommended parser/topology by default.
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    // common SRV DNS errors (querySrv EREFUSED) indicate DNS/network or incorrect connection string
    if (err && err.code === 'ENOTFOUND' || (err.message && err.message.includes('querySrv'))) {
      console.error("Hint: SRV lookup failed. If you're using a 'mongodb+srv://' URI, ensure DNS is available and the URI is correct.");
      console.error("Alternative: try a standard 'mongodb://' connection string or check your network/DNS settings.");
    }
    process.exit(1);
  }
};

export default connectDB;
