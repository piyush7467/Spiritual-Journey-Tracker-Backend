import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

import userRoutes from "../routes/userRoutes.js";
import placeRoutes from "../routes/placeRoutes.js";

dotenv.config();

const app = express();

/* ===========================
   MIDDLEWARE
=========================== */

app.use(express.json());

app.use(
  cors({
    origin: [
      "https://spiritual-journey-tracker.vercel.app",
      "http://localhost:5173"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.options("*", cors());

/* ===========================
   DATABASE (SERVERLESS SAFE)
=========================== */

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
    throw err;
  }
};

connectDB();

/* ===========================
   ROUTES
=========================== */

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/place", placeRoutes);

app.get("/", (req, res) => {
  res.status(200).send("✅ Backend is live and connected to MongoDB");
});

/* ===========================
   EXPORT FOR VERCEL
=========================== */

export default app;
