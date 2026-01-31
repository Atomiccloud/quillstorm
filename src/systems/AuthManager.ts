import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

type AuthStateCallback = (user: AuthUser | null) => void;

class AuthManagerClass {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private googleProvider: GoogleAuthProvider | null = null;
  private currentUser: AuthUser | null = null;
  private initialized: boolean = false;
  private authStateCallbacks: Set<AuthStateCallback> = new Set();

  initialize(): void {
    if (this.initialized) return;

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    // Check if config is available
    if (!firebaseConfig.apiKey) {
      console.warn('Firebase config not found. Auth features disabled.');
      this.initialized = true;
      return;
    }

    try {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.googleProvider = new GoogleAuthProvider();

      // Listen for auth state changes
      onAuthStateChanged(this.auth, (user) => {
        this.handleAuthStateChange(user);
      });

      this.initialized = true;
      console.log('Firebase Auth initialized');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      this.initialized = true;
    }
  }

  private handleAuthStateChange(user: User | null): void {
    if (user) {
      this.currentUser = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };
    } else {
      this.currentUser = null;
    }

    // Notify all callbacks
    this.authStateCallbacks.forEach((callback) => {
      callback(this.currentUser);
    });
  }

  async signInWithGoogle(): Promise<AuthUser | null> {
    if (!this.auth || !this.googleProvider) {
      console.warn('Firebase Auth not initialized');
      return null;
    }

    try {
      const result: UserCredential = await signInWithPopup(
        this.auth,
        this.googleProvider
      );

      return {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      };
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        console.log('Sign-in cancelled by user');
        return null;
      }
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async signOutUser(): Promise<void> {
    if (!this.auth) {
      console.warn('Firebase Auth not initialized');
      return;
    }

    try {
      await signOut(this.auth);
      this.currentUser = null;
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isSignedIn(): boolean {
    return this.currentUser !== null;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  onAuthStateChanged(callback: AuthStateCallback): () => void {
    this.authStateCallbacks.add(callback);

    // Immediately call with current state if already initialized
    if (this.initialized) {
      callback(this.currentUser);
    }

    // Return unsubscribe function
    return () => {
      this.authStateCallbacks.delete(callback);
    };
  }

  getDisplayName(): string {
    if (this.currentUser?.displayName) {
      return this.currentUser.displayName;
    }
    if (this.currentUser?.email) {
      return this.currentUser.email.split('@')[0];
    }
    return 'Guest';
  }

  async getIdToken(): Promise<string | null> {
    if (!this.auth?.currentUser) {
      return null;
    }

    try {
      return await this.auth.currentUser.getIdToken();
    } catch (error) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  }
}

// Singleton instance
let authManagerInstance: AuthManagerClass | null = null;

export function getAuthManager(): AuthManagerClass {
  if (!authManagerInstance) {
    authManagerInstance = new AuthManagerClass();
  }
  return authManagerInstance;
}

export const AuthManager = {
  initialize: () => getAuthManager().initialize(),
  signInWithGoogle: () => getAuthManager().signInWithGoogle(),
  signOut: () => getAuthManager().signOutUser(),
  getCurrentUser: () => getAuthManager().getCurrentUser(),
  isSignedIn: () => getAuthManager().isSignedIn(),
  isInitialized: () => getAuthManager().isInitialized(),
  onAuthStateChanged: (callback: AuthStateCallback) =>
    getAuthManager().onAuthStateChanged(callback),
  getDisplayName: () => getAuthManager().getDisplayName(),
  getIdToken: () => getAuthManager().getIdToken(),
};
