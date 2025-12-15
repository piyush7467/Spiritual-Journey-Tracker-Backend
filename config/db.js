import mongoose from "mongoose";

let isConnected = false; // cache connection

const connectDb = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    throw err; // ❗ DO NOT use process.exit on Vercel
  }
};

export default connectDb;
