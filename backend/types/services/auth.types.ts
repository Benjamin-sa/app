// Service-level Auth/User types
export interface SyncUserData {
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
  providerData?: { providerId: string }[] | null;
}

export interface UpdateProfileInput {
  username?: string;
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  show_email?: boolean;
  allow_messages?: boolean;
}
