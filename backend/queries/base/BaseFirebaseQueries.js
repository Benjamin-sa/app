/**
 * Base Firebase Queries Class
 * Contains common functionality and patterns shared across all domain-specific query classes
 */

const admin = require("firebase-admin");
const { firestore, auth, storage } = require("../../config/firebase");

class BaseFirebaseQueries {
  constructor() {
    this.db = firestore;
    this.auth = auth;
    this.storage = storage;
    this.bucket = storage.bucket();
    this.FieldValue = admin.firestore.FieldValue;
  }

  /**
   * Centralized error handling wrapper
   * Catches Firebase errors and throws them up to the calling service
   */
  async executeQuery(queryFunction, errorContext = "Firebase operation") {
    try {
      return await queryFunction();
    } catch (error) {
      throw new Error(`${errorContext}: ${error.message}`);
    }
  }

  /**
   * Get server timestamp
   */
  getServerTimestamp() {
    return this.FieldValue.serverTimestamp();
  }

  /**
   * Common document creation pattern
   */
  async createDocument(collection, data, errorContext) {
    return await this.executeQuery(async () => {
      const docRef = this.db.collection(collection).doc();
      const cleanData = {
        ...data,
        id: docRef.id,
        createdAt: this.FieldValue.serverTimestamp(),
        updatedAt: this.FieldValue.serverTimestamp(),
      };
      await docRef.set(cleanData);
      return docRef;
    }, errorContext);
  }

  /**
   * Common document update pattern
   */
  async updateDocument(collection, docId, updateData, errorContext) {
    return await this.executeQuery(
      () =>
        this.db
          .collection(collection)
          .doc(docId)
          .update({
            ...updateData,
            updatedAt: this.FieldValue.serverTimestamp(),
          }),
      errorContext
    );
  }

  /**
   * Common document retrieval pattern
   */
  async getDocumentById(
    collection,
    docId,
    errorContext,
    transformTimestamps = false
  ) {
    return await this.executeQuery(async () => {
      const doc = await this.db.collection(collection).doc(docId.trim()).get();

      if (!doc.exists) return null;

      const data = doc.data();
      const result = { id: doc.id, ...data };

      if (transformTimestamps) {
        if (data.createdAt) result.createdAt = data.createdAt.toDate();
        if (data.updatedAt) result.updatedAt = data.updatedAt.toDate();
        if (data.lastActivity) result.lastActivity = data.lastActivity.toDate();
      }

      return result;
    }, errorContext);
  }

  /**
   * Common soft delete pattern
   */
  async softDeleteDocument(collection, docId, errorContext) {
    return await this.executeQuery(
      () =>
        this.db.collection(collection).doc(docId).update({
          isDeleted: true,
          updatedAt: this.FieldValue.serverTimestamp(),
        }),
      errorContext
    );
  }

  /**
   * Common increment pattern
   */
  async incrementField(collection, docId, field, value = 1, errorContext) {
    return await this.executeQuery(
      () =>
        this.db
          .collection(collection)
          .doc(docId)
          .update({
            [field]: this.FieldValue.increment(value),
          }),
      errorContext
    );
  }

  /**
   * Run a transaction
   */
  async runTransaction(updateFunction) {
    return await this.db.runTransaction(updateFunction);
  }
}

module.exports = BaseFirebaseQueries;
