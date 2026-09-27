'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useCurriculum } from '@/context/CurriculumContext';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToMemberProgress,
  saveMaterialCompletion,
  removeMaterialCompletion,
  resetMemberProgress,
} from '@/lib/firebase/firestore';

const STORAGE_KEY = 'raya-digital-learning-progress';

export type ModuleStatus = 'Belum Dimulai' | 'Sedang Dipelajari' | 'Selesai';

export interface ModuleProgressResult {
  total: number;
  completed: number;
  percentage: number;
  status: ModuleStatus;
}

export interface OverallProgressResult {
  total: number;
  completed: number;
  percentage: number;
}

interface ProgressContextType {
  isLoaded: boolean;
  completedMaterialIds: string[];
  completedCount: number;
  totalMaterials: number;
  lastMaterialId: string | null;
  isCompleted: (materialId: string) => boolean;
  markComplete: (materialId: string) => Promise<void>;
  unmarkComplete: (materialId: string) => Promise<void>;
  toggleComplete: (materialId: string) => Promise<void>;
  getModuleProgress: (moduleId: string) => ModuleProgressResult;
  getOverallProgress: () => OverallProgressResult;
  resetProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { curriculum } = useCurriculum();
  const { user } = useAuth();
  const currentUid = user?.id || null;
  const isMember = user?.role === 'member';

  const [completedMaterialIds, setCompletedMaterialIds] = useState<string[]>([]);
  const [lastMaterialId, setLastMaterialId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // All valid material IDs from curriculum
  const validMaterialIds = useMemo(() => {
    return new Set(curriculum.modules.flatMap((m) => m.materials.map((mat) => mat.id)));
  }, [curriculum]);

  const totalMaterials = useMemo(() => {
    return curriculum.modules.flatMap((m) => m.materials).length;
  }, [curriculum]);

  // Helper to read raw progress map from localStorage (for migration/fallback)
  const getLocalProgressMap = useCallback((): Record<string, string[]> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && currentUid) {
          return { [currentUid]: parsed };
        }
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      }
      return {};
    } catch {
      return {};
    }
  }, [currentUid]);

  // Subscribe to member's Firestore progress
  useEffect(() => {
    // 1. If not authenticated or not a member: clear state
    if (!currentUid || !isMember) {
      setCompletedMaterialIds([]);
      setLastMaterialId(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);

    // 2. Realtime listener to Firestore progress/{uid}
    const unsubscribe = subscribeToMemberProgress(
      currentUid,
      (data) => {
        if (data && Array.isArray(data.completedMaterials)) {
          // Filter to only materials that exist in current curriculum to prevent > 100%
          const filtered = data.completedMaterials.filter((id) => validMaterialIds.has(id));
          setCompletedMaterialIds(filtered);
          setLastMaterialId(data.lastMaterialId || (filtered.length > 0 ? filtered[filtered.length - 1] : null));
          setIsLoaded(true);
        } else {
          // If no Firestore progress document yet, check for safe initial migration from local storage
          const localMap = getLocalProgressMap();
          const localIds = localMap[currentUid] || [];
          if (localIds.length > 0) {
            const filteredLocal = localIds.filter((id) => validMaterialIds.has(id));
            setCompletedMaterialIds(filteredLocal);
            setLastMaterialId(filteredLocal[filteredLocal.length - 1] || null);

            // Sync to Firestore once
            filteredLocal.forEach((matId) => {
              saveMaterialCompletion(currentUid, matId);
            });
          } else {
            setCompletedMaterialIds([]);
            setLastMaterialId(null);
          }
          setIsLoaded(true);
        }
      },
      () => {
        // Fallback to local on error
        const localMap = getLocalProgressMap();
        const fallback = localMap[currentUid] || [];
        setCompletedMaterialIds(fallback);
        setIsLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [currentUid, isMember, validMaterialIds, getLocalProgressMap]);

  // Check if a specific material is completed
  const isCompleted = useCallback(
    (materialId: string) => {
      return completedMaterialIds.includes(materialId);
    },
    [completedMaterialIds]
  );

  // Concurrency-safe mark complete: updates Firestore and local state
  const markComplete = useCallback(
    async (materialId: string) => {
      if (!currentUid) return;

      // Duplicate prevention: if already completed, do nothing
      if (completedMaterialIds.includes(materialId)) return;

      // Optimistic update
      setCompletedMaterialIds((prev) => {
        if (prev.includes(materialId)) return prev;
        return [...prev, materialId];
      });
      setLastMaterialId(materialId);

      // Save to Firestore progress/{uid} using arrayUnion
      await saveMaterialCompletion(currentUid, materialId);

      // Local storage mirror
      try {
        const localMap = getLocalProgressMap();
        const existing = localMap[currentUid] || [];
        if (!existing.includes(materialId)) {
          localMap[currentUid] = [...existing, materialId];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(localMap));
        }
      } catch {}
    },
    [currentUid, completedMaterialIds, getLocalProgressMap]
  );

  // Unmark a completed material
  const unmarkComplete = useCallback(
    async (materialId: string) => {
      if (!currentUid) return;

      // Optimistic update
      setCompletedMaterialIds((prev) => prev.filter((id) => id !== materialId));

      // Remove in Firestore
      await removeMaterialCompletion(currentUid, materialId);

      // Local storage mirror
      try {
        const localMap = getLocalProgressMap();
        const existing = localMap[currentUid] || [];
        localMap[currentUid] = existing.filter((id) => id !== materialId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localMap));
      } catch {}
    },
    [currentUid, getLocalProgressMap]
  );

  // Toggle complete / uncomplete
  const toggleComplete = useCallback(
    async (materialId: string) => {
      if (isCompleted(materialId)) {
        await unmarkComplete(materialId);
      } else {
        await markComplete(materialId);
      }
    },
    [isCompleted, markComplete, unmarkComplete]
  );

  // Calculate progress for a specific module
  const getModuleProgress = useCallback(
    (moduleId: string): ModuleProgressResult => {
      const moduleData = curriculum.modules.find((m) => m.id === moduleId);
      if (!moduleData || moduleData.materials.length === 0) {
        return { total: 0, completed: 0, percentage: 0, status: 'Belum Dimulai' };
      }

      const total = moduleData.materials.length;
      const completed = moduleData.materials.filter((mat) =>
        completedMaterialIds.includes(mat.id)
      ).length;

      const percentage = Math.min(100, Math.round((completed / total) * 100));

      let status: ModuleStatus = 'Belum Dimulai';
      if (completed === total) {
        status = 'Selesai';
      } else if (completed > 0) {
        status = 'Sedang Dipelajari';
      }

      return { total, completed, percentage, status };
    },
    [completedMaterialIds, curriculum]
  );

  // Calculate overall curriculum progress
  const getOverallProgress = useCallback((): OverallProgressResult => {
    const allMaterials = curriculum.modules.flatMap((m) => m.materials);
    const total = allMaterials.length;
    if (total === 0) {
      return { total: 0, completed: 0, percentage: 0 };
    }

    const completed = allMaterials.filter((mat) =>
      completedMaterialIds.includes(mat.id)
    ).length;

    const percentage = Math.min(100, Math.round((completed / total) * 100));

    return { total, completed, percentage };
  }, [completedMaterialIds, curriculum]);

  // Reset member progress
  const resetProgress = useCallback(async () => {
    setCompletedMaterialIds([]);
    setLastMaterialId(null);

    if (currentUid) {
      await resetMemberProgress(currentUid);
      try {
        const localMap = getLocalProgressMap();
        delete localMap[currentUid];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localMap));
      } catch {}
    }
  }, [currentUid, getLocalProgressMap]);

  const completedCount = completedMaterialIds.length;

  const value = useMemo(
    () => ({
      isLoaded,
      completedMaterialIds,
      completedCount,
      totalMaterials,
      lastMaterialId,
      isCompleted,
      markComplete,
      unmarkComplete,
      toggleComplete,
      getModuleProgress,
      getOverallProgress,
      resetProgress,
    }),
    [
      isLoaded,
      completedMaterialIds,
      completedCount,
      totalMaterials,
      lastMaterialId,
      isCompleted,
      markComplete,
      unmarkComplete,
      toggleComplete,
      getModuleProgress,
      getOverallProgress,
      resetProgress,
    ]
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress harus digunakan di dalam ProgressProvider');
  }
  return context;
};
