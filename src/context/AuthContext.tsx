'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import { auth, mapFirebaseAuthError, isFirebaseConfigured } from '@/lib/firebase/client';
import {
  fetchUserAndMembership,
  validateFirestoreAccessCode,
  executeMemberActivationTransaction,
  getFirestoreAccessCodesList,
  createFirestoreAccessCode,
  getFirestoreMembersList,
  formatFirestoreDate,
} from '@/lib/firebase/firestore';

export type UserRole = 'member' | 'admin';

export interface UserAccount {
  id: string; // Firebase UID
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  className?: string;
  cohort?: string;
  membershipStatus?: string;
  isMembershipActive?: boolean;
  joinedAt?: string;
  completedMaterialsCount?: number;
}

// Keep MemberAccount as alias for compatibility
export type MemberAccount = UserAccount;

export type AccessCodeStatus = 'active' | 'used' | 'expired';

export interface AccessCode {
  id: string;
  code: string;
  className: string;
  status: AccessCodeStatus;
  createdAt: string;
  isMultiUse?: boolean;
  usedCount?: number;
  usedAt?: string;
  usedBy?: string;
  usedByName?: string;
}

interface AuthContextType {
  user: UserAccount | null;
  member: UserAccount | null; // alias to user for backward compatibility
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => Promise<void>;
  registerMember: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    accessCodeUsed?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  getAllMembers: () => UserAccount[];
  getMemberById: (id: string) => UserAccount | undefined;
  getAllAccessCodes: () => AccessCode[];
  createAccessCode: (className?: string) => Promise<AccessCode>;
  validateAccessCode: (code: string) => Promise<{ valid: boolean; codeRecord?: AccessCode; error?: string }>;
  consumeAccessCode: (code: string, memberId: string, memberName: string) => boolean;
  refreshAdminData: () => Promise<void>;
}

const ACCOUNTS_STORAGE_KEY = 'raya-digital-registered-members';
const PROGRESS_STORAGE_KEY = 'raya-digital-learning-progress';
const ACCESS_CODES_STORAGE_KEY = 'raya-digital-access-codes';

/**
 * Abstraction helper to determine role of current user.
 * Combines Firestore users/{uid} with admin email fallback.
 */
export function getCurrentUserRole(email?: string | null, uid?: string | null): UserRole {
  if (!email) return 'member';
  const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin@rayadigital.id';
  const adminEmails = adminEmailsEnv
    .split(',')
    .map((e) => e.trim().toLowerCase());
  if (adminEmails.includes(email.trim().toLowerCase())) {
    return 'admin';
  }
  return 'member';
}

// Initial demo member metadata
const INITIAL_DEMO_MEMBERS: UserAccount[] = [
  {
    id: 'member-001',
    name: 'Budi Santoso',
    email: 'budi@email.com',
    phone: '08123456789',
    className: 'Kelas Affiliate AI',
    cohort: 'Raya Digital',
    membershipStatus: 'Member Aktif',
    isMembershipActive: true,
    joinedAt: '27 September 2026',
    role: 'member',
    completedMaterialsCount: 0,
  },
  {
    id: 'member-demo-002',
    name: 'Siti Rahmawati',
    email: 'siti.rahma@example.com',
    phone: '085712345678',
    className: 'Kelas Affiliate AI',
    cohort: 'Raya Digital',
    membershipStatus: 'Member Aktif',
    isMembershipActive: true,
    joinedAt: '25 September 2026',
    role: 'member',
    completedMaterialsCount: 12,
  },
];

// Initial demo access codes (preserving RAYA-DEMO-2026)
const INITIAL_ACCESS_CODES: AccessCode[] = [
  {
    id: 'code-demo-01',
    code: 'RAYA-DEMO-2026',
    className: 'Kelas Affiliate AI',
    status: 'active',
    createdAt: '27 September 2026',
  },
  {
    id: 'code-demo-02',
    code: 'RAYA-A7K2-P9XM',
    className: 'Kelas Affiliate AI',
    status: 'active',
    createdAt: '27 September 2026',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>(INITIAL_ACCESS_CODES);
  const [membersList, setMembersList] = useState<UserAccount[]>(INITIAL_DEMO_MEMBERS);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Helper to read temporary local profile fallback
  const getLocalMemberProfile = useCallback((uid: string, email: string | null) => {
    if (!email) return undefined;
    try {
      const accountsStr = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (!accountsStr) return undefined;
      const accounts: UserAccount[] = JSON.parse(accountsStr);
      if (Array.isArray(accounts)) {
        return accounts.find(
          (acc) =>
            (acc.id && acc.id === uid) ||
            (acc.email && acc.email.toLowerCase() === email.toLowerCase())
        );
      }
    } catch {
      return undefined;
    }
    return undefined;
  }, []);

  // Refresh admin data (Firestore Access Codes + Firestore Members)
  const refreshAdminData = useCallback(async () => {
    if (!isFirebaseConfigured()) return;
    try {
      const [remoteCodes, remoteMembers] = await Promise.all([
        getFirestoreAccessCodesList(),
        getFirestoreMembersList(),
      ]);

      if (remoteCodes.length > 0) {
        setAccessCodes(remoteCodes);
      }
      if (remoteMembers.length > 0) {
        setMembersList(remoteMembers);
      }
    } catch (e) {
      console.warn('Gagal me-refresh data admin dari Firestore:', e);
    }
  }, []);

  // Subscribe to Firebase Authentication state + Firestore profile/membership
  useEffect(() => {
    try {
      // 1. Seed demo members if accounts list is empty
      const existingAccountsStr = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (!existingAccountsStr) {
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_MEMBERS));
      }

      // 2. Seed access codes if empty
      const existingCodesStr = localStorage.getItem(ACCESS_CODES_STORAGE_KEY);
      if (!existingCodesStr) {
        localStorage.setItem(ACCESS_CODES_STORAGE_KEY, JSON.stringify(INITIAL_ACCESS_CODES));
      } else {
        const parsedCodes = JSON.parse(existingCodesStr);
        if (Array.isArray(parsedCodes) && parsedCodes.length > 0) {
          const updated = parsedCodes.map((c: any) => ({
            ...c,
            status: c.status === 'expired' ? 'expired' : 'active',
            isMultiUse: true,
            usedCount: c.usedCount || (c.usedBy ? 1 : 0),
          }));
          setAccessCodes(updated);
        }
      }
    } catch (e) {
      console.warn('Gagal membaca data awal localStorage:', e);
    }

    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let role: UserRole = getCurrentUserRole(firebaseUser.email, firebaseUser.uid);
        let userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member';
        let userPhone = '';
        let className = 'Kelas Affiliate AI';
        let cohort = 'Raya Digital';
        let membershipStatus = 'Member Aktif';
        let isMembershipActive = true;
        let joinedAt = new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date());

        // 1. Fetch from Firestore users & memberships
        if (isFirebaseConfigured()) {
          try {
            const { userDoc, membershipDoc } = await fetchUserAndMembership(firebaseUser.uid);

            if (userDoc) {
              userName = userDoc.name || userName;
              userPhone = userDoc.phone || '';
              if (userDoc.role === 'ADMIN') {
                role = 'admin';
              } else if (userDoc.role === 'MEMBER') {
                role = 'member';
              }
              if (userDoc.createdAt) {
                joinedAt = formatFirestoreDate(userDoc.createdAt);
              }
            }

            if (membershipDoc) {
              className = membershipDoc.className || className;
              if (membershipDoc.status === 'ACTIVE') {
                membershipStatus = 'Member Aktif';
                isMembershipActive = true;
              } else {
                membershipStatus = 'Belum Aktif';
                isMembershipActive = false;
              }
              if (membershipDoc.joinedAt) {
                joinedAt = formatFirestoreDate(membershipDoc.joinedAt);
              }
            } else if (role === 'member' && !userDoc) {
              // Fallback to local profile if Firestore document does not exist yet
              const localProfile = getLocalMemberProfile(firebaseUser.uid, firebaseUser.email);
              if (localProfile) {
                userName = localProfile.name || userName;
                userPhone = localProfile.phone || '';
                className = localProfile.className || className;
                membershipStatus = localProfile.membershipStatus || membershipStatus;
                isMembershipActive = membershipStatus === 'Member Aktif';
                joinedAt = localProfile.joinedAt || joinedAt;
              }
            }
          } catch (fsErr) {
            console.warn('Gagal membaca profil dari Firestore:', fsErr);
          }
        }

        const userAccount: UserAccount = {
          id: firebaseUser.uid,
          name: userName,
          email: firebaseUser.email || '',
          role,
          phone: userPhone,
          className,
          cohort,
          membershipStatus,
          isMembershipActive,
          joinedAt,
          completedMaterialsCount: 0,
        };

        setUser(userAccount);

        // If user is Admin, preload admin data from Firestore
        if (role === 'admin') {
          refreshAdminData();
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [getLocalMemberProfile, refreshAdminData]);

  // Read all access codes
  const getAllAccessCodes = useCallback((): AccessCode[] => {
    return accessCodes;
  }, [accessCodes]);

  // Create new access code (Format: RAYA-XXXX-2026) in Firestore & local state
  const createAccessCode = useCallback(
    async (className: string = 'Kelas Affiliate AI'): Promise<AccessCode> => {
      // 1. Try Firestore creation
      if (isFirebaseConfigured()) {
        const firestoreCreated = await createFirestoreAccessCode(className);
        if (firestoreCreated) {
          const formattedCode: AccessCode = {
            id: firestoreCreated.code,
            code: firestoreCreated.code,
            className: firestoreCreated.className,
            status: 'active',
            createdAt: formatFirestoreDate(firestoreCreated.createdAt),
          };
          setAccessCodes((prev) => [formattedCode, ...prev]);
          return formattedCode;
        }
      }

      // 2. Local fallback
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let randomPart = '';
      for (let i = 0; i < 4; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const newCodeStr = `RAYA-${randomPart}-2026`;
      const today = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());

      const newCodeRecord: AccessCode = {
        id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        code: newCodeStr,
        className,
        status: 'active',
        isMultiUse: true,
        usedCount: 0,
        createdAt: today,
      };

      setAccessCodes((prev) => [newCodeRecord, ...prev]);
      try {
        const existingStr = localStorage.getItem(ACCESS_CODES_STORAGE_KEY);
        const existing = existingStr ? JSON.parse(existingStr) : [];
        localStorage.setItem(ACCESS_CODES_STORAGE_KEY, JSON.stringify([newCodeRecord, ...existing]));
      } catch {}
      return newCodeRecord;
    },
    []
  );

  // Validate an access code for /aktivasi (Checking Firestore first)
  const validateAccessCode = useCallback(
    async (
      inputCode: string
    ): Promise<{ valid: boolean; codeRecord?: AccessCode; error?: string }> => {
      const clean = inputCode.trim().toUpperCase();
      if (!clean) {
        return { valid: false, error: 'Kode akses wajib diisi.' };
      }

      // 1. Primary: Validate via Firestore
      if (isFirebaseConfigured()) {
        const firestoreResult = await validateFirestoreAccessCode(clean);
        if (firestoreResult.valid && firestoreResult.codeRecord) {
          const record = firestoreResult.codeRecord;
          const mapped: AccessCode = {
            id: record.id || record.code,
            code: record.code,
            className: record.className || 'Kelas Affiliate AI',
            status: (record.status.toLowerCase() as AccessCodeStatus) || 'active',
            createdAt: formatFirestoreDate(record.createdAt),
            isMultiUse: record.isMultiUse !== false,
            usedCount: record.usedCount || 0,
          };
          return { valid: true, codeRecord: mapped };
        } else if (firestoreResult.error) {
          return { valid: false, error: firestoreResult.error };
        }
      }

      // 2. Fallback: Local access code check if Firestore is not configured
      const found = accessCodes.find((c) => c.code.toUpperCase() === clean);
      if (!found) {
        return {
          valid: false,
          error: 'Kode akses tidak valid. Silakan periksa kembali atau hubungi Admin.',
        };
      }
      if (found.isMultiUse === false && found.status === 'used') {
        return {
          valid: false,
          error: 'Kode akses sudah digunakan.',
        };
      }
      if (found.status === 'expired') {
        return {
          valid: false,
          error: 'Kode akses sudah tidak berlaku.',
        };
      }
      return { valid: true, codeRecord: found };
    },
    [accessCodes]
  );

  // Consume an access code locally
  const consumeAccessCode = useCallback(
    (inputCode: string, memberId: string, memberName: string): boolean => {
      const clean = inputCode.trim().toUpperCase();
      const updated = accessCodes.map((c) => {
        if (c.code.toUpperCase() === clean) {
          const today = new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date());
          const isSingle = c.isMultiUse === false;
          return {
            ...c,
            status: (isSingle ? 'used' : 'active') as AccessCodeStatus,
            usedCount: (c.usedCount || 0) + 1,
            usedAt: today,
            usedBy: memberId,
            usedByName: memberName,
          };
        }
        return c;
      });
      setAccessCodes(updated);
      try {
        localStorage.setItem(ACCESS_CODES_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return true;
    },
    [accessCodes]
  );

  // Register new member: Firebase Auth + Firestore Transaction
  const registerMember = useCallback(
    async (input: {
      name: string;
      email: string;
      phone: string;
      password: string;
      accessCodeUsed?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      if (!auth) {
        return {
          success: false,
          error: 'Firebase Authentication belum dikonfigurasi. Silakan isi konfigurasi di .env.local.',
        };
      }

      const cleanEmail = input.email.trim().toLowerCase();
      const cleanName = input.name.trim();
      const cleanPhone = input.phone.trim();

      try {
        // 1. Create User in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, input.password);
        const fbUser = userCredential.user;

        // 2. Set displayName on Firebase User profile
        try {
          await updateProfile(fbUser, { displayName: cleanName });
        } catch (profileErr) {
          console.warn('Gagal memperbarui displayName Firebase:', profileErr);
        }

        // 3. Atomic Firestore Transaction (users + memberships + accessCodes)
        if (input.accessCodeUsed && isFirebaseConfigured()) {
          const txResult = await executeMemberActivationTransaction({
            uid: fbUser.uid,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            accessCode: input.accessCodeUsed,
          });

          if (!txResult.success) {
            // Delete orphaned auth user if Firestore transaction fails
            try {
              await deleteUser(fbUser);
            } catch (delErr) {
              console.warn('Gagal menghapus user Firebase Auth setelah transaksi gagal:', delErr);
            }
            return {
              success: false,
              error: txResult.error || 'Gagal mengaktifkan akun di database. Silakan coba lagi.',
            };
          }
        }

        // 4. Update local storage cache for backward compatibility
        const formattedDate = new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date());

        const newAccount: UserAccount = {
          id: fbUser.uid,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          className: 'Kelas Affiliate AI',
          cohort: 'Raya Digital',
          membershipStatus: 'Member Aktif',
          isMembershipActive: true,
          joinedAt: formattedDate,
          role: 'member',
          completedMaterialsCount: 0,
        };

        try {
          const accountsStr = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
          let accounts: UserAccount[] = accountsStr ? JSON.parse(accountsStr) : [];
          accounts = accounts.filter((a) => a.email !== cleanEmail);
          accounts.push(newAccount);
          localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
        } catch {}

        if (input.accessCodeUsed) {
          consumeAccessCode(input.accessCodeUsed, newAccount.id, newAccount.name);
        }

        // Update active user state
        setUser(newAccount);
        return { success: true };
      } catch (err: any) {
        console.error('Error saat registrasi Firebase:', err);
        return { success: false, error: mapFirebaseAuthError(err) };
      }
    },
    [consumeAccessCode]
  );

  // Login: validates credentials via Firebase Authentication
  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
      if (!auth) {
        return {
          success: false,
          error: 'Firebase Authentication belum dikonfigurasi. Silakan isi konfigurasi di .env.local.',
        };
      }

      try {
        const cleanEmail = email.trim().toLowerCase();
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCredential.user;
        const role = getCurrentUserRole(fbUser.email, fbUser.uid);
        return { success: true, role };
      } catch (err: any) {
        console.error('Error saat login Firebase:', err);
        return { success: false, error: mapFirebaseAuthError(err) };
      }
    },
    []
  );

  // Logout via Firebase signOut
  const logout = useCallback(async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      setUser(null);
      router.push('/login');
    } catch (e) {
      console.error('Gagal logout Firebase', e);
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  // Read all members (from Firestore state)
  const getAllMembers = useCallback((): UserAccount[] => {
    return membersList;
  }, [membersList]);

  // Find member by ID
  const getMemberById = useCallback(
    (id: string): UserAccount | undefined => {
      const members = getAllMembers();
      return members.find((m) => m.id === id);
    },
    [getAllMembers]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        member: user, // alias for existing components
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        registerMember,
        getAllMembers,
        getMemberById,
        getAllAccessCodes,
        createAccessCode,
        validateAccessCode,
        consumeAccessCode,
        refreshAdminData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};

/**
 * Helper to dynamically generate initials from name.
 */
export const getInitials = (name?: string | null): string => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
