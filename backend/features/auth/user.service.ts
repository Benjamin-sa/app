/**
 * User Service (TypeScript)
 */
import {
  createUserProfile as createUserProfileSchema,
  updateUserProfile as updateUserProfileSchema,
  ValidationError,
  validateId,
  UserProfile,
} from '../../types';
import type { SyncUserData } from '../../types/services/auth.types';
import type { UploadedImageRecord } from '../../types/services/image.types';
import * as imageService from '../../core/services/image.service';

// Keep JS queries for now (will be migrated later)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const firebaseQueries = require('../../queries/FirebaseQueries');

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
      const user = await this.queries.getUserByUsername(username);
      if (!user) throw new Error('USER_SERVICE_NOT_FOUND_ERROR: User not found');
      return user;
    } catch (error: any) {
      if (error instanceof ValidationError) throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith('USER_SERVICE_')) throw error;
      throw new Error(`USER_SERVICE_ERROR: Failed to get user by username - ${error.message}`);
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

  /**
   * Update profile fields and optionally replace the avatar.
   * Handles deriving old avatar URLs and cleaning them up after a successful update.
   */
  async updateProfileWithAvatar(
    uid: string,
    updateFields: Record<string, any>,
    newImage?: UploadedImageRecord | null
  ) {
    try {
      const validatedUid = validateId(uid);
      const userBefore = await this.queries.getUserById(validatedUid);
      if (!userBefore) throw new Error('USER_SERVICE_NOT_FOUND_ERROR: User profile not found');

      // Capture old avatar URLs, if present
      const oldAvatar = userBefore.avatar
        ? {
            url: userBefore.avatar as string,
            thumbnailUrl: (userBefore as any).avatarThumbnail as string | undefined,
            mediumUrl: (userBefore as any).avatarMediumUrl as string | undefined,
          }
        : null;

      const imageUpdates: Record<string, any> = {};
      if (newImage && newImage.url) {
        imageUpdates.avatar = newImage.url;
        if (newImage.thumbnailUrl) imageUpdates.avatarThumbnail = newImage.thumbnailUrl;
        if (newImage.mediumUrl) imageUpdates.avatarMediumUrl = newImage.mediumUrl;
      }

      // Validate and persist
      const updatedUser = await this.updateUserProfile(validatedUid, {
        ...updateFields,
        ...imageUpdates,
      });

      // If avatar changed, cleanup the previous files (best-effort)
      if (newImage?.url && oldAvatar?.url && oldAvatar.url !== newImage.url) {
        try {
          await imageService.deleteImage(oldAvatar);
        } catch (e: any) {
          // Log and continue; not fatal for profile update
          // eslint-disable-next-line no-console
          console.warn('USER_SERVICE_IMAGE_CLEANUP_WARNING:', e?.message || e);
        }
      }

      return {
        user: updatedUser,
        avatar: newImage
          ? { url: newImage.url, thumbnailUrl: newImage.thumbnailUrl, mediumUrl: newImage.mediumUrl }
          : undefined,
      };
    } catch (error: any) {
      if (error instanceof ValidationError) throw new Error(`USER_SERVICE_VALIDATION_ERROR: ${error.message}`);
      if (error.message?.startsWith('USER_SERVICE_')) throw error;
      throw new Error(`USER_SERVICE_ERROR: Failed to update profile with avatar - ${error.message}`);
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
