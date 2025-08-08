/**
 * TypeScript Server Entry Point
 * Main server file that can run TypeScript directly with ts-node
 */

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://192.168.0.225:5173",
    "http://192.168.0.225:3000",
    "http://192.168.0.175:5173",
    process.env.FRONTEND_URL || "https://git.heroku.com/forum-beta.git",
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Serve static files from the frontend build (only in production)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "public")));
}

// API health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Motordash API is running (TypeScript)",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    runtime: "TypeScript",
    endpoints: {
      products: "/api/products",
      forum: "/api/forum",
      bikes: "/api/bikes",
      messages: "/api/messages (TypeScript)",
      testUI: "/test-ui",
    },
  });
});

// Routes - Mix of JS and TS during migration
import authRoutes from "./features/auth/auth.routes";
import userRoutes from "./features/auth/user.routes";
import forumRoutes from "./features/forum/index";
import productsRoutes from "./features/shopify/products.routes";
import voteRoutes from "./features/votes/vote.routes";
import bikes from "./features/bikes/bike.routes";

app.use("/api/auth", authRoutes);
app.use("/api/forum/users", userRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/bikes", bikes);
app.use("/api/votes", voteRoutes);

// TypeScript routes
import messagingRoutes from "./features/messaging/messaging.routes";
app.use("/api/messages", messagingRoutes);

// Serve frontend for all non-API routes (SPA routing support - only in production)
app.get("*", (req: Request, res: Response) => {
  // Don't serve the SPA for API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      error: "API endpoint not found",
      availableEndpoints: [
        "/api/health",
        "/api/auth",
        "/api/products",
        "/api/forum",
        "/api/bikes",
        "/api/votes",
        "/api/messages",
      ],
    });
  }

  // Only serve the frontend app in production
  if (process.env.NODE_ENV === "production") {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  } else {
    // In development, return a helpful message
    res.status(404).json({
      error: "Frontend not served in development",
      message:
        "Run the frontend development server separately (e.g., npm run dev in frontend folder)",
      api_available: true,
    });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 TypeScript Server running on http://0.0.0.0:${PORT}`);
  console.log(`🌐 Network access: http://192.168.0.225:${PORT}`);
  console.log(`📝 Runtime: TypeScript with ts-node`);
});
