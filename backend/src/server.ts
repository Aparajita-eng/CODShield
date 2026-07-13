import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

function getAllowedOrigins(): string[] | true {
  const configured = process.env.FRONTEND_URL?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured?.length) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    return [];
  }

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
});
