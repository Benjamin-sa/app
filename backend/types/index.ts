/**
 * Main Validation Export Index
 * Re-exports all validation schemas, types, and functions for easy importing
 */

// Core validation utilities
export * from "../utils/validation.core";

// Entity types and validation functions
export * from "./entities/user.types";
export * from "./entities/forum.types";
export * from "./entities/bike.types";
export * from "./entities/messaging.types";

// API utilities
export * from "./api/common.types";
export * from "./api/middleware.types";

// Service-level types
export * from "./services/bike.types";
export * from "./services/voting.types";
export * from "./services/auth.types";
export * from "./services/image.types";
