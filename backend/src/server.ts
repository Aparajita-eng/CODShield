import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes";
import { isDemoDataMode } from "./lib/demoData";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

function getAllowedOrigins(): string[] | boolean {
  const configured = process.env.FRONTEND_URL?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured?.length) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  // Dev: allow any origin; session-protected routes expect Bearer from the Next.js proxy.
  return true;
}

app.use(
  cors({
    origin: getAllowedOrigins(),
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
