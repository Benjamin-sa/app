/**
 * Database Migration Script for Enhanced Category Statistics
 * Run this to update existing categories with the new schema
 */

const firebaseQueries = require("../queries/FirebaseQueries");
const { FORUM_CATEGORIES } = require("../../frontend/src/utils/constants.repository");

// Enhanced category data with statistics fields
const enhancedCategories = [
  {
    id: "general",
    name: "General Discussion",
    description: "General discussions about motorcycles, riding experiences, and community topics",
    color: "#3B82F6",
    icon: "chat",
    topicCount: 0,
    totalViews: 0,
    lastActivity: null,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "technical",
    name: "Technical Support",
    description: "Technical support, troubleshooting, and mechanical discussions",
    color: "#EF4444",
    icon: "wrench",
    topicCount: 0,
    totalViews: 0,
    lastActivity: null,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "maintenance",
    name: "Maintenance & Repairs",
    description: "Maintenance schedules, DIY repairs, and service recommendations",
    color: "#F59E0B",
    icon: "cog",
    topicCount: 0,
    totalViews: 0,
    lastActivity: null,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "reviews",
    name: "Reviews & Gear",
    description: "Bike reviews, gear recommendations, and product discussions",
    color: "#10B981",
    icon: "star",
    topicCount: 0,
    totalViews: 0,
    lastActivity: null,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "events",
    name: "Events & Meetups",
    description: "Motorcycle events, meetups, rides, and community gatherings",
    color: "#8B5CF6",
    icon: "calendar",
    topicCount: 0,
    totalViews: 0,
    lastActivity: null,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Buy, sell, and trade motorcycles, parts, and accessories",
    color: "#F97316",
    icon: "shopping-cart",
    topicCount: 0,
    totalViews: 0,
    lastActivity: null,
    isActive: true,
    sortOrder: 6,
  },
];

/**
 * Migrate categories to enhanced schema
 */
async function migrateCategorySchema() {
  try {
    console.log("Starting category schema migration...");

    for (const category of enhancedCategories) {
      console.log(`Migrating category: ${category.name}`);
      
      await firebaseQueries.upsertCategory(category.id, {
        ...category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log("Category schema migration completed successfully");
  } catch (error) {
    console.error("Error during category migration:", error);
    throw error;
  }
}

/**
 * Refresh statistics for all categories
 */
async function refreshCategoryStatistics() {
  try {
    console.log("Refreshing category statistics...");
    await firebaseQueries.refreshAllCategoryStatistics();
    console.log("Category statistics refreshed successfully");
  } catch (error) {
    console.error("Error refreshing category statistics:", error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  try {
    await migrateCategorySchema();
    await refreshCategoryStatistics();
    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  migrateCategorySchema,
  refreshCategoryStatistics,
  runMigration,
};
