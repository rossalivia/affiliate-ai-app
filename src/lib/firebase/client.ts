import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase Client Configuration derived from environment variables.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

/**
 * Check whether required Firebase environment variables are provided.
 */
export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
};

// Initialize Firebase App singleton safely
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (typeof window !== 'undefined' || isFirebaseConfigured()) {
  try {
    if (getApps().length > 0) {
      appInstance = getApp();
    } else if (isFirebaseConfigured()) {
      appInstance = initializeApp(firebaseConfig);
    }
    if (appInstance) {
      authInstance = getAuth(appInstance);
      dbInstance = getFirestore(appInstance);
    }
  } catch (error) {
    console.error('Inisialisasi Firebase gagal:', error);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;

/**
 * Maps Firebase Auth error codes to user-friendly Indonesian messages.
 */
export function mapFirebaseAuthError(error: any): string {
  if (!error) return 'Terjadi kesalahan. Silakan coba lagi.';

  const code: string = error?.code || (typeof error === 'string' ? error : '');

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-login-credentials':
      return 'Email atau password tidak sesuai.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.';
    case 'auth/weak-password':
      return 'Password harus terdiri dari minimal 8 karakter.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan. Silakan hubungi Admin.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke jaringan. Periksa koneksi internet Anda.';
    default:
      return 'Terjadi kesalahan. Silakan coba lagi.';
  }
}
