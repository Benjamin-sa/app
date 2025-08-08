/**
 * User Service (TypeScript)
 */
import {
  createUserProfile as createUserProfileSchema,
  updateUserProfile as updateUserProfileSchema,
  ValidationError,
  validateId,
} from '../../utils/validation.utils';

// Keep JS queries for now (will be migrated later)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const firebaseQueries = require('../../queries/FirebaseQueries');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { UserProfile } = require('../../models/forum.models');

interface SyncUserData {
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
  providerData?: { providerId: string }[] | null;
}

class UserService {
  private queries: any;

  constructor() {
    this.queries = firebaseQueries;
  }

  async createUserProfile(userData: any) {
    try {
      const { uid, email, username, displayName, avatar, emailVerified, authProvider } = userData;

      const validatedProfile: any = createUserProfileSchema({
        uid,
        email,
        username,
        displayName: displayName || username,
        avatar: avatar || '',
        isVerified: emailVerified || false,
      });

      const existingUserWithUsername = await this._checkUserExists('username', validatedProfile.username);
      if (existingUserWithUsername && existingUserWithUsername.uid !== validatedProfile.uid) {
        throw new Error('USER_SERVICE_VALIDATION_ERROR: Username is already taken');
      }

      validatedProfile.joinedDate = this.queries.getServerTimestamp();
      validatedProfile.lastActive = this.queries.getServerTimestamp();
      validatedProfile.updatedAt = this.queries.getServerTimestamp();
      validatedProfile.authProvider = authProvider || 'email';

      await this.queries.createUser(validatedProfile.uid, validatedProfile);
      return validatedProfile;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      }
      if (error.message?.startsWith('USER_SERVICE_')) throw error;
      throw new Error(`USER_SERVICE_ERROR: Failed to create user profile - ${error.message}`);
    }
  }

  async getUserProfile(uid: string, viewerUid?: string | null) {
    try {
      const user = await this.queries.getUserById(uid);
      if (!user) throw new Error('USER_SERVICE_NOT_FOUND_ERROR: User profile not found');
      const isOwnProfile = viewerUid === uid;
      return isOwnProfile ? user : this._sanitizeUserProfile(user);
    } catch (error: any) {
      if (error instanceof ValidationError) throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith('USER_SERVICE_')) throw error;
      throw new Error(`USER_SERVICE_ERROR: Failed to get user profile - ${error.message}`);
    }
  }

  async getUserByUsername(username: string) {
    try {
      // Basic reuse of schema to validate username
      createUserProfileSchema({ username, uid: 'temp', email: 'temp@temp.com' });
      const user = await this.queries.getUserByUsername(username);
      if (!user) throw new Error('USER_SERVICE_NOT_FOUND_ERROR: User not found');
      return user;
    } catch (error: any) {
      if (error instanceof ValidationError) throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith('USER_SERVICE_')) throw error;
      throw new Error(`USER_SERVICE_ERROR: Failed to get user by username - ${error.message}`);
    }
  }

  async updateUserActivity(uid: string) {
    try {
      const validatedUid = validateId(uid);
      await this.queries.updateUserActivity(validatedUid);
    } catch (error: any) {
      if (error instanceof ValidationError) throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith('USER_SERVICE_')) throw error;
      console.error('Failed to update user activity:', error);
    }
  }

  async incrementUserStats(uid: string, field: string) {
    try {
      const validatedUid = validateId(uid);
      if (!field || typeof field !== 'string') {
        throw new Error('USER_SERVICE_VALIDATION_ERROR: Field is required and must be a string');
      }
      const validFields = ['topicsCount', 'answersCount', 'votesReceived', 'reputation'];
      if (!validFields.includes(field)) {
        throw new Error('USER_SERVICE_VALIDATION_ERROR: Invalid field for user stats');
      }
      await this.queries.incrementUserStats(validatedUid, field);
    } catch (error: any) {
      if (error instanceof ValidationError) throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith('USER_SERVICE_')) throw error;
      console.error(`Failed to increment user stat ${field}:`, error);
      throw new Error(`USER_SERVICE_ERROR: Failed to increment user stat - ${error.message}`);
    }
  }

  async updateUserProfile(uid: string, updateData: Record<string, any>) {
    try {
      const validatedUid = validateId(uid);
      if (!updateData || Object.keys(updateData).length === 0) {
        throw new Error('USER_SERVICE_VALIDATION_ERROR: Update data is required');
      }
      const validatedData: any = updateUserProfileSchema(updateData);
      if (validatedData.username) {
        const existingUser = await this._checkUserExists('username', validatedData.username);
        if (existingUser && existingUser.uid !== validatedUid) {
          throw new Error('USER_SERVICE_VALIDATION_ERROR: Username is already taken');
        }
      }
      validatedData.updatedAt = this.queries.getServerTimestamp();
      await this.queries.updateUser(validatedUid, validatedData);
      return await this.getUserProfile(validatedUid);
    } catch (error: any) {
      if (error instanceof ValidationError) throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith('USER_SERVICE_')) throw error;
      throw new Error(`USER_SERVICE_ERROR: Failed to update user profile - ${error.message}`);
    }
  }

  async syncUser(syncData: SyncUserData) {
    try {
      const { firebaseUid, email, displayName, photoURL, emailVerified, providerData } = syncData;
      const validatedUid = validateId(firebaseUid);
      createUserProfileSchema({ uid: validatedUid, email, username: 'temp' });
      const existingUser = await this._checkUserExists('uid', validatedUid);

      if (existingUser) {
        const updateData: any = {
          email,
          emailVerified,
          authProvider: this._getAuthProvider(providerData),
          lastLogin: this.queries.getServerTimestamp(),
        };
        if (!existingUser.displayName && displayName) updateData.displayName = displayName;
        if (!existingUser.avatar && photoURL) updateData.avatar = photoURL;
        return await this.updateUserProfile(validatedUid, updateData);
      } else {
        const username = await this._generateUniqueUsername(displayName || email.split('@')[0]);
        const newUserData = {
          uid: validatedUid,
          email,
            username,
          displayName: displayName || username,
          avatar: photoURL || '',
          emailVerified,
          authProvider: this._getAuthProvider(providerData),
        };
        return await this.createUserProfile(newUserData);
      }
    } catch (error: any) {
      if (error instanceof ValidationError) throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith('USER_SERVICE_')) throw error;
      throw new Error(`USER_SERVICE_ERROR: Failed to sync user - ${error.message}`);
    }
  }

  private async _generateUniqueUsername(baseName?: string): Promise<string> {
    try {
      if (!baseName) baseName = 'user';
      let cleanName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      if (cleanName.length < 3) cleanName = 'user';
      if (cleanName.length > 15) cleanName = cleanName.substring(0, 15);

      let username = cleanName;
      let counter = 1;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          await this.getUserByUsername(username);
          username = `${cleanName}_${counter}`;
          counter++;
          if (counter > 1000) {
            throw new Error('USER_SERVICE_ERROR: Unable to generate unique username after 1000 attempts');
          }
        } catch (error: any) {
          if (error.message?.includes('NOT_FOUND_ERROR')) break; // username available
          else throw error;
        }
      }
      return username;
    } catch (error: any) {
      throw new Error(`USER_SERVICE_ERROR: Failed to generate unique username - ${error.message}`);
    }
  }

  private async _checkUserExists(field: string, value: string) {
    try {
      if (field === 'uid') return await this.queries.getUserById(value);
      if (field === 'username') return await this.queries.getUserByUsername(value);
      return null;
    } catch (_e) {
      return null;
    }
  }

  private _getAuthProvider(providerData?: { providerId: string }[] | null) {
    if (!providerData || providerData.length === 0) return 'password';
    const provider = providerData[0].providerId;
    switch (provider) {
      case 'google.com': return 'google';
      case 'facebook.com': return 'facebook';
      case 'github.com': return 'github';
      case 'twitter.com': return 'twitter';
      default: return 'password';
    }
  }

  private _sanitizeUserProfile(user: any) {
    const privateFields = [
      'email', 'emailVerified', 'authProvider', 'updatedAt', 'isDeleted', 'isBanned', 'banReason', 'banExpiresAt', 'lastLogin'
    ];
    const publicProfile: any = {};
    Object.keys(user).forEach((key) => { if (!privateFields.includes(key)) publicProfile[key] = user[key]; });
    if (user.show_email) publicProfile.email = user.email;
    return publicProfile;
  }
}

export default new UserService();
