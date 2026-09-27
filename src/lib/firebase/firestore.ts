import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './client';

export type UserRoleType = 'MEMBER' | 'ADMIN';
export type MembershipStatusType = 'ACTIVE' | 'INACTIVE';
export type AccessCodeStatusType = 'ACTIVE' | 'USED' | 'EXPIRED';

export interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRoleType;
  createdAt: any;
  updatedAt: any;
}

export interface FirestoreMembership {
  uid: string;
  classId: string;
  className: string;
  status: MembershipStatusType;
  joinedAt: any;
  accessCodeId: string;
}

export interface FirestoreAccessCode {
  id?: string;
  code: string;
  classId: string;
  className: string;
  status: AccessCodeStatusType;
  isMultiUse?: boolean;
  usedCount?: number;
  usedByList?: Array<{
    uid: string;
    name: string;
    usedAt: any;
  }>;
  createdAt: any;
  usedAt?: any;
  usedBy?: string | null;
  usedByName?: string | null;
}

export interface FirestoreProgress {
  uid: string;
  completedMaterials: string[];
  lastMaterialId?: string | null;
  updatedAt: any;
}

/**
 * Format any timestamp (Firestore Timestamp, Date, or string) to Indonesian date string.
 */
export function formatFirestoreDate(val: any): string {
  if (!val) return '-';
  try {
    let date: Date;
    if (val instanceof Timestamp) {
      date = val.toDate();
    } else if (val?.toDate && typeof val.toDate === 'function') {
      date = val.toDate();
    } else if (val?.seconds) {
      date = new Date(val.seconds * 1000);
    } else if (typeof val === 'string' || typeof val === 'number') {
      date = new Date(val);
      if (isNaN(date.getTime())) return String(val);
    } else if (val instanceof Date) {
      date = val;
    } else {
      return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return '-';
  }
}

/**
 * Ensures RAYA-DEMO-2026 is seeded into Firestore accessCodes if missing.
 */
export async function seedInitialAccessCodes(): Promise<void> {
  if (!db || !isFirebaseConfigured()) return;

  try {
    const demoRef = doc(db, 'accessCodes', 'RAYA-DEMO-2026');
    const snap = await getDoc(demoRef);
    if (!snap.exists()) {
      await setDoc(demoRef, {
        code: 'RAYA-DEMO-2026',
        classId: 'affiliate-ai',
        className: 'Kelas Affiliate AI',
        status: 'ACTIVE',
        isMultiUse: true,
        usedCount: 0,
        createdAt: serverTimestamp(),
        usedAt: null,
        usedBy: null,
      });
    } else {
      const data = snap.data();
      if (data.status === 'USED' || data.isMultiUse !== true) {
        try {
          await updateDoc(demoRef, {
            status: 'ACTIVE',
            isMultiUse: true,
          });
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Gagal melakukan seed access code di Firestore:', err);
  }
}

/**
 * Validates access code status in Firestore.
 */
export async function validateFirestoreAccessCode(inputCode: string): Promise<{
  valid: boolean;
  codeRecord?: FirestoreAccessCode;
  error?: string;
}> {
  const cleanCode = inputCode.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, error: 'Kode akses wajib diisi.' };
  }

  if (!db || !isFirebaseConfigured()) {
    return {
      valid: false,
      error: 'Database belum terhubung. Silakan periksa konfigurasi Firebase.',
    };
  }

  try {
    // Check direct doc by code ID
    const codeRef = doc(db, 'accessCodes', cleanCode);
    let snap = await getDoc(codeRef);

    // If not found by doc id, search by 'code' field query
    if (!snap.exists()) {
      const q = query(collection(db, 'accessCodes'), where('code', '==', cleanCode));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        snap = querySnap.docs[0];
      }
    }

    if (!snap.exists()) {
      // Special case: if RAYA-DEMO-2026 and not yet seeded, seed it now
      if (cleanCode === 'RAYA-DEMO-2026') {
        await seedInitialAccessCodes();
        const retrySnap = await getDoc(codeRef);
        if (retrySnap.exists()) {
          const data = retrySnap.data() as FirestoreAccessCode;
          if (data.status === 'ACTIVE') {
            return { valid: true, codeRecord: { ...data, id: retrySnap.id } };
          }
        }
      }
      return {
        valid: false,
        error: 'Kode akses tidak valid. Silakan periksa kembali atau hubungi Admin.',
      };
    }

    const data = snap.data() as FirestoreAccessCode;
    const record: FirestoreAccessCode = {
      ...data,
      id: snap.id,
      code: data.code || cleanCode,
    };

    if (record.status === 'EXPIRED') {
      return { valid: false, error: 'Kode akses sudah tidak berlaku.' };
    }

    if (record.isMultiUse === false && record.status === 'USED') {
      return { valid: false, error: 'Kode akses sudah digunakan.' };
    }

    if (record.status !== 'ACTIVE') {
      return {
        valid: false,
        error: 'Kode akses tidak valid. Silakan periksa kembali atau hubungi Admin.',
      };
    }

    return { valid: true, codeRecord: record };
  } catch (err: any) {
    console.error('Error saat validasi kode akses Firestore:', err);
    return {
      valid: false,
      error: 'Gagal memvalidasi kode akses. Silakan coba lagi.',
    };
  }
}

/**
 * Atomic member activation:
 * Validates access code, creates users/{uid}, memberships/{uid}_affiliate-ai, and updates access code to USED.
 */
export async function executeMemberActivationTransaction(params: {
  uid: string;
  name: string;
  email: string;
  phone: string;
  accessCode: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!db || !isFirebaseConfigured()) {
    return {
      success: false,
      error: 'Koneksi database Firestore belum tersedia.',
    };
  }

  const firestore = db;
  const cleanCode = params.accessCode.trim().toUpperCase();
  const classId = 'affiliate-ai';
  const className = 'Kelas Affiliate AI';

  try {
    await runTransaction(firestore, async (transaction) => {
      // 1. Get access code doc
      const codeRef = doc(firestore, 'accessCodes', cleanCode);
      const codeSnap = await transaction.get(codeRef);

      if (!codeSnap.exists()) {
        throw new Error('NOT_FOUND');
      }

      const codeData = codeSnap.data() as FirestoreAccessCode;
      if (codeData.isMultiUse === false && codeData.status === 'USED') {
        throw new Error('ALREADY_USED');
      }
      if (codeData.status !== 'ACTIVE') {
        throw new Error('NOT_ACTIVE');
      }

      // 2. Prepare user document
      const userRef = doc(firestore, 'users', params.uid);
      transaction.set(userRef, {
        uid: params.uid,
        name: params.name.trim(),
        email: params.email.trim().toLowerCase(),
        phone: params.phone.trim(),
        role: 'MEMBER' as UserRoleType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Prepare membership document: {uid}_{classId}
      const membershipDocId = `${params.uid}_${classId}`;
      const membershipRef = doc(firestore, 'memberships', membershipDocId);
      transaction.set(membershipRef, {
        uid: params.uid,
        classId,
        className: codeData.className || className,
        status: 'ACTIVE' as MembershipStatusType,
        joinedAt: serverTimestamp(),
        accessCodeId: cleanCode,
      });

      // 4. Update access code doc (Multi-use by default)
      const currentUsedCount = (codeData.usedCount || 0) + 1;
      const memberEntry = {
        uid: params.uid,
        name: params.name.trim(),
        usedAt: new Date().toISOString(),
      };

      if (codeData.isMultiUse === false) {
        transaction.update(codeRef, {
          status: 'USED' as AccessCodeStatusType,
          usedBy: params.uid,
          usedByName: params.name.trim(),
          usedAt: serverTimestamp(),
        });
      } else {
        transaction.update(codeRef, {
          status: 'ACTIVE' as AccessCodeStatusType,
          isMultiUse: true,
          usedCount: currentUsedCount,
          usedAt: serverTimestamp(),
          usedBy: params.uid,
          usedByName: params.name.trim(),
          usedByList: arrayUnion(memberEntry),
        });
      }
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error saat transaksi aktivasi member:', err);
    if (err?.message === 'ALREADY_USED') {
      return { success: false, error: 'Kode akses sudah digunakan.' };
    }
    if (err?.message === 'NOT_FOUND') {
      return {
        success: false,
        error: 'Kode akses tidak valid. Silakan periksa kembali atau hubungi Admin.',
      };
    }
    if (err?.message === 'NOT_ACTIVE') {
      return { success: false, error: 'Kode akses sudah tidak berlaku.' };
    }
    return {
      success: false,
      error: 'Gagal mengaktifkan keanggotaan. Silakan coba lagi.',
    };
  }
}

/**
 * Fetch user document and active membership for a given UID.
 */
export async function fetchUserAndMembership(uid: string): Promise<{
  userDoc: FirestoreUser | null;
  membershipDoc: FirestoreMembership | null;
}> {
  if (!db || !isFirebaseConfigured()) {
    return { userDoc: null, membershipDoc: null };
  }

  try {
    const userRef = doc(db, 'users', uid);
    const membershipRef = doc(db, 'memberships', `${uid}_affiliate-ai`);

    const [userSnap, memberSnap] = await Promise.all([
      getDoc(userRef),
      getDoc(membershipRef),
    ]);

    const userDoc = userSnap.exists() ? (userSnap.data() as FirestoreUser) : null;
    const membershipDoc = memberSnap.exists()
      ? (memberSnap.data() as FirestoreMembership)
      : null;

    return { userDoc, membershipDoc };
  } catch (err) {
    console.warn('Gagal membaca user dan membership dari Firestore:', err);
    return { userDoc: null, membershipDoc: null };
  }
}

/**
 * Fetch all access codes for Admin Area.
 */
export async function fetchAllAccessCodesFirestore(): Promise<FirestoreAccessCode[]> {
  if (!db || !isFirebaseConfigured()) return [];

  try {
    await seedInitialAccessCodes();
    const codesCol = collection(db, 'accessCodes');
    const snap = await getDocs(codesCol);

    const list: FirestoreAccessCode[] = [];
    snap.forEach((d) => {
      const data = d.data() as FirestoreAccessCode;
      const effectiveStatus: AccessCodeStatusType = data.status === 'EXPIRED' ? 'EXPIRED' : 'ACTIVE';
      list.push({
        ...data,
        id: d.id,
        code: data.code || d.id,
        status: effectiveStatus,
        isMultiUse: true,
        usedCount: data.usedCount || (data.usedBy ? 1 : 0),
      });
    });

    // Sort active first, then newest
    list.sort((a, b) => {
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
    });

    return list;
  } catch (err) {
    console.warn('Gagal mengambil daftar access codes dari Firestore:', err);
    return [];
  }
}

/**
 * Create a new access code in Firestore (Format: RAYA-XXXX-2026).
 */
export async function createFirestoreAccessCode(
  className: string = 'Kelas Affiliate AI'
): Promise<FirestoreAccessCode | null> {
  if (!db || !isFirebaseConfigured()) return null;

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const code = `RAYA-${randomPart}-2026`;
  const classId = 'affiliate-ai';

  try {
    const codeRef = doc(db, 'accessCodes', code);
    const newDoc: FirestoreAccessCode = {
      code,
      classId,
      className,
      status: 'ACTIVE',
      isMultiUse: true,
      usedCount: 0,
      createdAt: serverTimestamp(),
      usedAt: null,
      usedBy: null,
    };

    await setDoc(codeRef, newDoc);

    return {
      ...newDoc,
      id: code,
      createdAt: new Date(),
    };
  } catch (err) {
    console.error('Gagal membuat access code di Firestore:', err);
    return null;
  }
}

/**
 * Fetch all members with their memberships for Admin Member area.
 */
export async function fetchAllMembersFirestore(): Promise<
  Array<{
    user: FirestoreUser;
    membership: FirestoreMembership | null;
  }>
> {
  if (!db || !isFirebaseConfigured()) return [];

  try {
    // 1. Get all users
    const usersCol = collection(db, 'users');
    const userSnap = await getDocs(usersCol);

    const usersList: FirestoreUser[] = [];
    userSnap.forEach((d) => {
      const data = d.data() as FirestoreUser;
      if (data.role === 'MEMBER') {
        usersList.push(data);
      }
    });

    // 2. Get memberships for all users
    const membershipsCol = collection(db, 'memberships');
    const memberSnap = await getDocs(membershipsCol);
    const memberMap = new Map<string, FirestoreMembership>();
    memberSnap.forEach((d) => {
      const m = d.data() as FirestoreMembership;
      memberMap.set(m.uid, m);
    });

    return usersList.map((u) => ({
      user: u,
      membership: memberMap.get(u.uid) || null,
    }));
  } catch (err) {
    console.warn('Gagal mengambil daftar member dari Firestore:', err);
    return [];
  }
}

/**
 * Convenience helper to return formatted AccessCode list for UI.
 */
export async function getFirestoreAccessCodesList(): Promise<
  Array<{
    id: string;
    code: string;
    className: string;
    status: 'active' | 'used' | 'expired';
    createdAt: string;
    isMultiUse?: boolean;
    usedCount?: number;
    usedAt?: string;
    usedBy?: string;
    usedByName?: string;
  }>
> {
  const rawList = await fetchAllAccessCodesFirestore();
  return rawList.map((c) => ({
    id: c.id || c.code,
    code: c.code,
    className: c.className || 'Kelas Affiliate AI',
    status: (c.status?.toLowerCase() as 'active' | 'used' | 'expired') || 'active',
    createdAt: formatFirestoreDate(c.createdAt),
    isMultiUse: true,
    usedCount: c.usedCount || (c.usedBy ? 1 : 0),
    usedAt: c.usedAt ? formatFirestoreDate(c.usedAt) : undefined,
    usedBy: c.usedBy || undefined,
    usedByName: c.usedByName || undefined,
  }));
}

/**
 * Convenience helper to return formatted Member list for Admin Member UI.
 */
export async function getFirestoreMembersList(): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'member';
    className: string;
    cohort: string;
    membershipStatus: string;
    isMembershipActive: boolean;
    joinedAt: string;
    completedMaterialsCount: number;
  }>
> {
  const [raw, progressMap] = await Promise.all([
    fetchAllMembersFirestore(),
    fetchAllMembersProgressMap(),
  ]);

  return raw.map(({ user, membership }) => {
    const isActive = membership?.status === 'ACTIVE';
    const completedList = progressMap[user.uid] || [];
    return {
      id: user.uid,
      name: user.name || 'Member',
      email: user.email,
      phone: user.phone || '-',
      role: 'member',
      className: membership?.className || 'Kelas Affiliate AI',
      cohort: 'Raya Digital',
      membershipStatus: isActive ? 'Member Aktif' : 'Belum Aktif',
      isMembershipActive: isActive,
      joinedAt: formatFirestoreDate(membership?.joinedAt || user.createdAt),
      completedMaterialsCount: completedList.length,
    };
  });
}

/**
 * Fetch member progress document from Firestore.
 */
export async function fetchMemberProgress(uid: string): Promise<FirestoreProgress | null> {
  if (!db || !isFirebaseConfigured() || !uid) return null;

  try {
    const docRef = doc(db, 'progress', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as FirestoreProgress;
  } catch (err) {
    console.warn('Gagal membaca progress dari Firestore:', err);
    return null;
  }
}

/**
 * Realtime listener for member progress in Firestore.
 */
export function subscribeToMemberProgress(
  uid: string,
  onUpdate: (data: FirestoreProgress | null) => void,
  onError?: (err: any) => void
): () => void {
  if (!db || !isFirebaseConfigured() || !uid) {
    onUpdate(null);
    return () => {};
  }

  try {
    const docRef = doc(db, 'progress', uid);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as FirestoreProgress);
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.warn('Firestore progress subscription error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Gagal membuat subscription progress Firestore:', err);
    return () => {};
  }
}

/**
 * Concurrency-safe atomic completion of a material using arrayUnion.
 */
export async function saveMaterialCompletion(
  uid: string,
  materialId: string
): Promise<boolean> {
  if (!db || !isFirebaseConfigured() || !uid || !materialId) return false;

  try {
    const docRef = doc(db, 'progress', uid);
    await setDoc(
      docRef,
      {
        uid,
        completedMaterials: arrayUnion(materialId),
        lastMaterialId: materialId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Gagal menyimpan status materi selesai ke Firestore:', err);
    return false;
  }
}

/**
 * Remove a material from completed list using arrayRemove.
 */
export async function removeMaterialCompletion(
  uid: string,
  materialId: string
): Promise<boolean> {
  if (!db || !isFirebaseConfigured() || !uid || !materialId) return false;

  try {
    const docRef = doc(db, 'progress', uid);
    await updateDoc(docRef, {
      completedMaterials: arrayRemove(materialId),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Gagal membatalkan status materi dari Firestore:', err);
    return false;
  }
}

/**
 * Reset member progress in Firestore.
 */
export async function resetMemberProgress(uid: string): Promise<boolean> {
  if (!db || !isFirebaseConfigured() || !uid) return false;

  try {
    const docRef = doc(db, 'progress', uid);
    await setDoc(docRef, {
      uid,
      completedMaterials: [],
      lastMaterialId: null,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Gagal mereset progress di Firestore:', err);
    return false;
  }
}

/**
 * Fetch all member progress documents as a map of uid -> completedMaterials array.
 * Used for Admin Dashboard and Member List calculations.
 */
export async function fetchAllMembersProgressMap(): Promise<Record<string, string[]>> {
  if (!db || !isFirebaseConfigured()) return {};

  try {
    const colRef = collection(db, 'progress');
    const snap = await getDocs(colRef);
    const map: Record<string, string[]> = {};

    snap.forEach((d) => {
      const data = d.data() as FirestoreProgress;
      map[d.id] = data.completedMaterials || [];
    });

    return map;
  } catch (err) {
    console.warn('Gagal membaca progress map seluruh member:', err);
    return {};
  }
}
