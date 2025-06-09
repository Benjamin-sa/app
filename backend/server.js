const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

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
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

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
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/products", require("./routes/products.routes"));
app.use("/api/forum", require("./routes/forum.routes"));
app.use("/api/bikes", require("./routes/bike.routes"));

// Default route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Motordash API",
    documentation: "/api/health",
    testInterface: "/test-ui",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: [
      "/api/health",
      "/api/products",
      "/api/forum",
      "/api/bikes",
      "/test-ui",
    ],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
