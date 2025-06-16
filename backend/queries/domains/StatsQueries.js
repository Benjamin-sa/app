/**
 * Stats Queries
 * Handles all statistics-related Firebase operations
 */

const BaseFirebaseQueries = require("../base/BaseFirebaseQueries");
const { COLLECTIONS } = require("../../models/forum.models");

class StatsQueries extends BaseFirebaseQueries {
  /**
   * Get global stats
   */
  async getGlobalStats() {
    const doc = await this.db.collection(COLLECTIONS.STATS).doc("global").get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * Update global stats
   */
  async updateGlobalStats(statsData) {
    return await this.db
      .collection(COLLECTIONS.STATS)
      .doc("global")
      .set(
        {
          ...statsData,
          lastUpdated: this.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }
}

module.exports = StatsQueries;
