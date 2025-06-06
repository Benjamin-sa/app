/**
 * Database initialization script
 * Sets up default categories and forum structure
 */

const { firestore } = require("../config/firebase");
const { COLLECTIONS } = require("../models/forum.models");

// Default forum categories
const defaultCategories = [
  {
    id: "general",
    name: "General Discussion",
    description: "General topics and discussions",
    color: "#3B82F6",
    icon: "chat",
    topicCount: 0,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "technical",
    name: "Technical Support",
    description: "Technical questions and troubleshooting",
    color: "#EF4444",
    icon: "wrench",
    topicCount: 0,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "feedback",
    name: "Feedback & Suggestions",
    description: "Feature requests and feedback",
    color: "#10B981",
    icon: "lightbulb",
    topicCount: 0,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "announcements",
    name: "Announcements",
    description: "Official announcements and news",
    color: "#F59E0B",
    icon: "megaphone",
    topicCount: 0,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "off-topic",
    name: "Off Topic",
    description: "Everything else that doesn't fit elsewhere",
    color: "#8B5CF6",
    icon: "chat-bubble",
    topicCount: 0,
    isActive: true,
    sortOrder: 5,
  },
];

/**
 * Initialize forum categories
 */
async function initializeCategories() {
  try {
    console.log("Initializing forum categories...");

    const batch = firestore.batch();

    for (const category of defaultCategories) {
      const categoryRef = firestore
        .collection(COLLECTIONS.CATEGORIES)
        .doc(category.id);
      batch.set(categoryRef, category, { merge: true });
    }

    await batch.commit();
    console.log("Forum categories initialized successfully");
  } catch (error) {
    console.error("Error initializing categories:", error);
    throw error;
  }
}

/**
 * Initialize forum statistics document
 */
async function initializeStats() {
  try {
    console.log("Initializing forum statistics...");

    const statsRef = firestore.collection(COLLECTIONS.STATS).doc("global");
    await statsRef.set(
      {
        totalUsers: 0,
        totalTopics: 0,
        totalAnswers: 0,
        totalViews: 0,
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log("Forum statistics initialized successfully");
  } catch (error) {
    console.error("Error initializing statistics:", error);
    throw error;
  }
}

/**
 * Create sample admin user (for testing)
 */
async function createSampleAdmin() {
  try {
    console.log("Creating sample admin user...");

    const adminUser = {
      uid: "admin-sample",
      username: "admin",
      email: "admin@motordash.com",
      displayName: "Forum Administrator",
      avatar: "",
      bio: "Forum Administrator",
      joinedDate: firestore.FieldValue.serverTimestamp(),
      lastActive: firestore.FieldValue.serverTimestamp(),
      reputation: 1000,
      topics_created: 0,
      answers_posted: 0,
      isVerified: true,
      isAdmin: true,
      isModerator: true,
    };

    await firestore
      .collection(COLLECTIONS.USERS)
      .doc("admin-sample")
      .set(adminUser, { merge: true });
    console.log("Sample admin user created successfully");
  } catch (error) {
    console.error("Error creating sample admin user:", error);
    throw error;
  }
}

/**
 * Main initialization function
 */
async function initializeDatabase() {
  try {
    console.log("Starting database initialization...");

    await Promise.all([
      initializeCategories(),
      initializeStats(),
      createSampleAdmin(),
    ]);

    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase().then(() => {
    console.log("Initialization complete. Exiting...");
    process.exit(0);
  });
}

module.exports = {
  initializeDatabase,
  initializeCategories,
  initializeStats,
  createSampleAdmin,
  defaultCategories,
};
