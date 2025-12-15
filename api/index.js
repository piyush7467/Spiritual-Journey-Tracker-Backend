import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "../routes/userRoutes.js";
import placeRoutes from "../routes/placeRoutes.js"
import connectDb from "../config/db.js";


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

// Handle OPTIONS requests
app.options("*", cors());

/* ===========================
   ROUTES
=========================== */

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/place", placeRoutes);

app.get("/", (req, res) => {
  res.status(200).send("Backend is running 🚀");
});

/* ===========================
   DATABASE
=========================== */

connectDb();

/* ===========================
   EXPORT FOR VERCEL
=========================== */

export default app;
