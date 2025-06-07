/**
 * Forum data models and validation schemas
 * Defines the structure of Firestore collections and documents
 */

// User Profile Model
const UserProfile = {
  uid: "", // Firebase Auth UID
  username: "",
  email: "",
  displayName: "",
  avatar: "", // URL to profile image
  bio: "",
  location: "", // User's location (City, Country)
  website: "", // User's website URL
  joinedDate: "", // Firestore timestamp
  lastActive: "", // Firestore timestamp
  updatedAt: "", // Firestore timestamp for last profile update
  reputation: 0, // Points system for forum activity
  topics_created: 0,
  answers_posted: 0,
  products_count: 0, // Number of products listed by user
  isVerified: false,
  isAdmin: false,
  isModerator: false,
  show_email: false, // Privacy setting - whether to show email publicly
  allow_messages: true, // Privacy setting - whether to allow private messages
  interests: [], // Array of user interests/tags
  social_links: {}, // Object containing social media links
};

// Topic Model
const Topic = {
  id: "", // Auto-generated document ID
  title: "",
  content: "", // Markdown supported content
  authorId: "", // Reference to user UID
  category: "", // Topic category (general, technical, etc.)
  tags: [], // Array of strings for topic tags
  images: [], // Array of image objects
  createdAt: "", // Firestore timestamp
  updatedAt: "", // Firestore timestamp
  viewCount: 0, // Keep this as it's not efficiently calculable from votes
  lastActivity: "", // Firestore timestamp
  isPinned: false,
  isLocked: false,
  isDeleted: false,
};

// Answer Model
const Answer = {
  id: "", // Auto-generated document ID
  topicId: "", // Reference to parent topic
  content: "", // Markdown supported content
  authorId: "", // Reference to user UID
  images: [], // Array of image objects
  createdAt: "", // Firestore timestamp
  updatedAt: "", // Firestore timestamp
  isAccepted: false, // For marking best answer
  isDeleted: false,
  parentAnswerId: null,
};

// Image Model (for both topics and answers)
const ImageModel = {
  id: "", // UUID
  filename: "",
  originalName: "",
  url: "", // Firebase Storage URL
  thumbnailUrl: "", // Optimized thumbnail URL
  size: 0, // File size in bytes
  width: 0,
  height: 0,
  mimeType: "",
  uploadedAt: "", // Firestore timestamp
};

// Vote Model (for tracking user votes)
const Vote = {
  userId: "",
  targetId: "", // Topic ID or Answer ID
  targetType: "", // 'topic' or 'answer'
  voteType: "", // 'up' or 'down'
  createdAt: "",
};

// Category Model
const Category = {
  id: "",
  name: "",
  description: "",
  color: "", // Hex color for UI
  icon: "", // Icon name/class
  isActive: true,
  sortOrder: 0,
};

// Forum Statistics Model
const ForumStats = {
  totalUsers: 0,
  totalTopics: 0,
  totalAnswers: 0,
  totalViews: 0,
  lastUpdated: "",
};

// Validation helper functions
const validators = {
  isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  isValidUsername: (username) => /^[a-zA-Z0-9_]{3,20}$/.test(username),
  isValidTopicTitle: (title) =>
    title && title.length >= 5 && title.length <= 200,
  isValidContent: (content) =>
    content && content.length >= 10 && content.length <= 10000,
  isValidCategory: (category) =>
    category && category.length >= 2 && category.length <= 50,
  isValidDisplayName: (name) => name && name.length >= 2 && name.length <= 50,
  isValidBio: (bio) => !bio || bio.length <= 500,
  isValidUrl: (url) => !url || /^https?:\/\/.+\..+/.test(url),
  isValidLocation: (location) => !location || location.length <= 100,
  isValidWebsite: (website) => !website || /^https?:\/\/.+\..+/.test(website),
  isValidInterests: (interests) =>
    !interests || (Array.isArray(interests) && interests.length <= 10),
  isValidSocialLinks: (links) =>
    !links || (typeof links === "object" && Object.keys(links).length <= 5),
};

// Firestore collection names
const COLLECTIONS = {
  USERS: "forum_users",
  TOPICS: "forum_topics",
  ANSWERS: "forum_answers",
  VOTES: "forum_votes",
  CATEGORIES: "forum_categories",
  STATS: "forum_stats",
};

module.exports = {
  UserProfile,
  Topic,
  Answer,
  ImageModel,
  Vote,
  Category,
  ForumStats,
  validators,
  COLLECTIONS,
};
