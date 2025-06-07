// Forum Categories Configuration
export const FORUM_CATEGORIES = {
  GENERAL: "general",
  TECHNICAL: "technical",
  MAINTENANCE: "maintenance",
  REVIEWS: "reviews",
  EVENTS: "events",
  MARKETPLACE: "marketplace",
};

export const CATEGORY_STYLES = {
  [FORUM_CATEGORIES.GENERAL]:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  [FORUM_CATEGORIES.TECHNICAL]:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  [FORUM_CATEGORIES.MAINTENANCE]:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  [FORUM_CATEGORIES.REVIEWS]:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  [FORUM_CATEGORIES.EVENTS]:
    "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
  [FORUM_CATEGORIES.MARKETPLACE]:
    "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
};

export const CATEGORY_LABELS = {
  [FORUM_CATEGORIES.GENERAL]: "General Discussion",
  [FORUM_CATEGORIES.TECHNICAL]: "Technical Help",
  [FORUM_CATEGORIES.MAINTENANCE]: "Maintenance & Repair",
  [FORUM_CATEGORIES.REVIEWS]: "Reviews & Opinions",
  [FORUM_CATEGORIES.EVENTS]: "Events & Meetups",
  [FORUM_CATEGORIES.MARKETPLACE]: "Marketplace",
};

// Default fallback styles
export const DEFAULT_CATEGORY_STYLE =
  "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800";
export const DEFAULT_CATEGORY_LABEL = "Uncategorized";
