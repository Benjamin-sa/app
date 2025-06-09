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
  bikes_count: 0, // Number of bikes in user's gallery
  isVerified: false,
  isDeleted: false, // Soft delete flag
  isBanned: false, // Whether the user is banned from the forum
  banReason: "", // Reason for banning, if applicable
  banExpiresAt: null, // Timestamp when ban expires, if applicable
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
  userId: "", // Reference to user UID
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
  userId: "", // Reference to user UID
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

// Bike Model (for user bike galleries)
const Bike = {
  id: "", // Auto-generated document ID
  userId: "", // Reference to user UID who owns the bike
  name: "", // User-defined bike name
  brand: "", // Bike brand (Honda, Yamaha, etc.)
  model: "", // Bike model (CB125, YBR125, etc.)
  year: null, // Manufacturing year
  engine_size: null, // Engine size in cc
  description: "", // User description of the bike
  main_image: "", // URL to the main/featured image
  photos: [], // Array of image objects using ImageModel structure
  is_featured: false, // Whether this bike is featured on user's profile
  createdAt: "", // Firestore timestamp
  updatedAt: "", // Firestore timestamp
  isDeleted: false,
  view_count: 0, // Number of times this bike has been viewed
  like_count: 0, // Number of likes (for future feature)
};

// Firestore collection names
const COLLECTIONS = {
  USERS: "forum_users",
  TOPICS: "forum_topics",
  ANSWERS: "forum_answers",
  VOTES: "forum_votes",
  CATEGORIES: "forum_categories",
  STATS: "forum_stats",
  BIKES: "user_bikes",
  BIKE_LIKES: "bike_likes",
};

module.exports = {
  UserProfile,
  Topic,
  Answer,
  ImageModel,
  Vote,
  Category,
  ForumStats,
  Bike,
  COLLECTIONS,
};
