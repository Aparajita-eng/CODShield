import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes";
import { isDemoDataMode } from "./lib/demoData";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Configure CORS to allow Next.js client request origins (port 3000)
app.use(
  cors({
    origin: "*", // Or specific address, e.g. "http://localhost:3000"
    credentials: true,
  })
);

app.use(express.json());

// Expose health status check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Mount the API routes
app.use("/api", apiRoutes);

// Start listening
app.listen(PORT, () => {
  console.log(`CODShield backend API server running on port ${PORT}`);
  if (isDemoDataMode()) {
    console.warn(
      "DATABASE_URL not set — demo mode active. Merchants/orders use seed data; claims are stored in memory only and do not persist across server restarts."
    );
  }
});
