const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://192.168.0.225:5173",
    "http://192.168.0.225:3000",
    process.env.FRONTEND_URL || "https://your-app-name.herokuapp.com",
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Serve static files from the frontend build (for production)
app.use(express.static(path.join(__dirname, "public")));

// API health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Motordash API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      products: "/api/products",
      forum: "/api/forum",
      bikes: "/api/bikes",
      testUI: "/test-ui",
    },
  });
});

// Routes
app.use("/api/auth", require("./features/auth/auth.routes"));
app.use("/api/products", require("./features/shopify/products.routes"));
app.use("/api/forum", require("./features/forum/index"));
app.use("/api/bikes", require("./features/bikes/bike.routes"));
app.use("/api/votes", require("./features/votes/vote.routes"));
app.use("/api/messages", require("./features/messaging/messaging.routes"));

// Serve frontend for all non-API routes (SPA routing support)
app.get("*", (req, res) => {
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

  // Serve the frontend app for all other routes
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 handler for API routes is handled above

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`🌐 Network access: http://192.168.0.225:${PORT}`);
});
