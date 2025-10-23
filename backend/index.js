// index.js
import dotenv from "dotenv";
dotenv.config(); // MUST be at the very top

import express from "express";
import authRoutes from "./routes/auth.route.js";
import client from "./lib/db.js"; // import AFTER dotenv.config()

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(authRoutes);

app.get("/", (req, res) => res.send("Welcome to the backend!"));

async function startServer() {
  try {
    await client.connect();
    console.log("MongoDB connected successfully!");
    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

startServer();
