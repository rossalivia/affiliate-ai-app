'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Curriculum, Module, Material, ResourceType } from '@/types/curriculum';
import { curriculum as defaultCurriculum } from '@/data/curriculum';
import { db, isFirebaseConfigured } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CURRICULUM_STORAGE_KEY = 'raya-digital-curriculum-v1';
const FIRESTORE_CONTENT_DOC = 'curriculum';

interface CurriculumContextType {
  curriculum: Curriculum;
  modules: Module[];
  totalMaterials: number;
  isLoading: boolean;
  isSaving: boolean;
  getModuleById: (moduleId: string) => Module | undefined;
  getMaterialById: (materialId: string) => Material | undefined;
  createModule: (title: string) => Promise<Module>;
  updateModule: (moduleId: string, newTitle: string) => Promise<boolean>;
  deleteModule: (moduleId: string) => Promise<boolean>;
  createMaterial: (
    moduleId: string,
    data: { title: string; resourceType: ResourceType; url: string }
  ) => Promise<Material | null>;
  updateMaterial: (
    moduleId: string,
    materialId: string,
    data: { title?: string; resourceType?: ResourceType; url?: string }
  ) => Promise<boolean>;
  deleteMaterial: (moduleId: string, materialId: string) => Promise<boolean>;
  resetToDefault: () => Promise<void>;
}

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

// Helper to convert title to slug ID safely
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const CurriculumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [curriculumState, setCurriculumState] = useState<Curriculum>(defaultCurriculum);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Sync to remote Firestore and local storage
  const persistCurriculum = useCallback(async (newCurriculum: Curriculum) => {
    setIsSaving(true);
    try {
      // 1. Local Storage
      localStorage.setItem(CURRICULUM_STORAGE_KEY, JSON.stringify(newCurriculum));

      // 2. Firestore Document (if configured)
      if (db && isFirebaseConfigured()) {
        const contentRef = doc(db, 'content', FIRESTORE_CONTENT_DOC);
        await setDoc(contentRef, {
          ...newCurriculum,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Gagal menyimpan pembaruan kurikulum:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Load curriculum from Firestore or LocalStorage on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      let loaded: Curriculum | null = null;

      // 1. Try reading from Firestore first
      if (db && isFirebaseConfigured()) {
        try {
          const contentRef = doc(db, 'content', FIRESTORE_CONTENT_DOC);
          const snap = await getDoc(contentRef);
          if (snap.exists()) {
            const data = snap.data() as Curriculum;
            if (data?.modules && Array.isArray(data.modules) && data.modules.length > 0) {
              loaded = data;
            }
          }
        } catch (err) {
          console.warn('Tidak dapat membaca kurikulum dari Firestore, menggunakan fallback:', err);
        }
      }

      // 2. Fallback to LocalStorage if Firestore had no custom content
      if (!loaded) {
        try {
          const localStr = localStorage.getItem(CURRICULUM_STORAGE_KEY);
          if (localStr) {
            const parsed = JSON.parse(localStr);
            if (parsed?.modules && Array.isArray(parsed.modules) && parsed.modules.length > 0) {
              loaded = parsed;
            }
          }
        } catch {}
      }

      if (isMounted) {
        if (loaded) {
          setCurriculumState(loaded);
        } else {
          setCurriculumState(defaultCurriculum);
        }
        setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const modules = useMemo(() => curriculumState.modules || [], [curriculumState]);

  const totalMaterials = useMemo(() => {
    return modules.flatMap((m) => m.materials).length;
  }, [modules]);

  const getModuleById = useCallback(
    (moduleId: string): Module | undefined => {
      return modules.find((m) => m.id === moduleId);
    },
    [modules]
  );

  const getMaterialById = useCallback(
    (materialId: string): Material | undefined => {
      for (const mod of modules) {
        const found = mod.materials.find((mat) => mat.id === materialId);
        if (found) return found;
      }
      return undefined;
    },
    [modules]
  );

  // 1. Create Module
  const createModule = useCallback(
    async (title: string): Promise<Module> => {
      const cleanTitle = title.trim();
      const baseSlug = slugify(cleanTitle) || `modul-${Date.now()}`;
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (modules.some((m) => m.id === uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const newModule: Module = {
        id: uniqueSlug,
        order: modules.length + 1,
        title: cleanTitle,
        materials: [],
      };

      const updatedModules = [...modules, newModule];
      const updatedCurriculum: Curriculum = {
        ...curriculumState,
        modules: updatedModules,
      };

      setCurriculumState(updatedCurriculum);
      await persistCurriculum(updatedCurriculum);
      return newModule;
    },
    [modules, curriculumState, persistCurriculum]
  );

  // 2. Update Module Title
  const updateModule = useCallback(
    async (moduleId: string, newTitle: string): Promise<boolean> => {
      const cleanTitle = newTitle.trim();
      if (!cleanTitle) return false;

      const updatedModules = modules.map((m) => {
        if (m.id === moduleId) {
          return { ...m, title: cleanTitle };
        }
        return m;
      });

      const updatedCurriculum: Curriculum = {
        ...curriculumState,
        modules: updatedModules,
      };

      setCurriculumState(updatedCurriculum);
      await persistCurriculum(updatedCurriculum);
      return true;
    },
    [modules, curriculumState, persistCurriculum]
  );

  // 3. Delete Module
  const deleteModule = useCallback(
    async (moduleId: string): Promise<boolean> => {
      const filtered = modules.filter((m) => m.id !== moduleId);
      const reindexed = filtered.map((m, idx) => ({ ...m, order: idx + 1 }));

      const updatedCurriculum: Curriculum = {
        ...curriculumState,
        modules: reindexed,
      };

      setCurriculumState(updatedCurriculum);
      await persistCurriculum(updatedCurriculum);
      return true;
    },
    [modules, curriculumState, persistCurriculum]
  );

  // 4. Create Material inside a Module
  const createMaterial = useCallback(
    async (
      moduleId: string,
      data: { title: string; resourceType: ResourceType; url: string }
    ): Promise<Material | null> => {
      const cleanTitle = data.title.trim();
      const cleanUrl = data.url.trim();
      if (!cleanTitle || !cleanUrl) return null;

      const targetMod = modules.find((m) => m.id === moduleId);
      if (!targetMod) return null;

      const newMaterialId = `${moduleId}-${Date.now().toString(36)}`;
      const newMaterial: Material = {
        id: newMaterialId,
        order: targetMod.materials.length + 1,
        title: cleanTitle,
        resourceType: data.resourceType,
        url: cleanUrl,
      };

      const updatedModules = modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            materials: [...m.materials, newMaterial],
          };
        }
        return m;
      });

      const updatedCurriculum: Curriculum = {
        ...curriculumState,
        modules: updatedModules,
      };

      setCurriculumState(updatedCurriculum);
      await persistCurriculum(updatedCurriculum);
      return newMaterial;
    },
    [modules, curriculumState, persistCurriculum]
  );

  // 5. Update Material
  const updateMaterial = useCallback(
    async (
      moduleId: string,
      materialId: string,
      data: { title?: string; resourceType?: ResourceType; url?: string }
    ): Promise<boolean> => {
      const updatedModules = modules.map((m) => {
        if (m.id === moduleId) {
          const updatedMaterials = m.materials.map((mat) => {
            if (mat.id === materialId) {
              return {
                ...mat,
                title: data.title !== undefined ? data.title.trim() : mat.title,
                resourceType: data.resourceType !== undefined ? data.resourceType : mat.resourceType,
                url: data.url !== undefined ? data.url.trim() : mat.url,
              };
            }
            return mat;
          });
          return { ...m, materials: updatedMaterials };
        }
        return m;
      });

      const updatedCurriculum: Curriculum = {
        ...curriculumState,
        modules: updatedModules,
      };

      setCurriculumState(updatedCurriculum);
      await persistCurriculum(updatedCurriculum);
      return true;
    },
    [modules, curriculumState, persistCurriculum]
  );

  // 6. Delete Material
  const deleteMaterial = useCallback(
    async (moduleId: string, materialId: string): Promise<boolean> => {
      const updatedModules = modules.map((m) => {
        if (m.id === moduleId) {
          const filtered = m.materials.filter((mat) => mat.id !== materialId);
          const reindexed = filtered.map((mat, idx) => ({ ...mat, order: idx + 1 }));
          return { ...m, materials: reindexed };
        }
        return m;
      });

      const updatedCurriculum: Curriculum = {
        ...curriculumState,
        modules: updatedModules,
      };

      setCurriculumState(updatedCurriculum);
      await persistCurriculum(updatedCurriculum);
      return true;
    },
    [modules, curriculumState, persistCurriculum]
  );

  // 7. Reset to Default Curriculum
  const resetToDefault = useCallback(async () => {
    setCurriculumState(defaultCurriculum);
    await persistCurriculum(defaultCurriculum);
  }, [persistCurriculum]);

  return (
    <CurriculumContext.Provider
      value={{
        curriculum: curriculumState,
        modules,
        totalMaterials,
        isLoading,
        isSaving,
        getModuleById,
        getMaterialById,
        createModule,
        updateModule,
        deleteModule,
        createMaterial,
        updateMaterial,
        deleteMaterial,
        resetToDefault,
      }}
    >
      {children}
    </CurriculumContext.Provider>
  );
};

export const useCurriculum = (): CurriculumContextType => {
  const context = useContext(CurriculumContext);
  if (!context) {
    throw new Error('useCurriculum must be used within a CurriculumProvider');
  }
  return context;
};
