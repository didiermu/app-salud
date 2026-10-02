import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { DEFAULT_SEQUENCE_MODE } from '../services/routineSequence';
import { scopedDocId, STORAGE_KEYS } from '../services/storageScope';

// -----------------------------------------------------------------
// MOTOR DE ALMACENAMIENTO (SOLO FIREBASE)
// -----------------------------------------------------------------
// Firestore es la ÚNICA fuente de verdad. No se usa localStorage.
//
// Cada documento se aísla por uid (`${uid}__${name}`) para que las rutinas
// y el historial de un usuario nunca se mezclen con los de otro. Las
// claves de `GLOBAL_DOCS` (catálogo y biblioteca semilla) se comparten.
let activeUid = null;

/** Fija el usuario activo. Lo llama AuthGate tras resolver la sesión. */
export const setActiveUid = (uid) => {
  activeUid = uid || null;
};

export const getActiveUid = () => activeUid;

const resolveDocId = (name) => scopedDocId(activeUid, name);

const firebaseStorage = {
  getItem: async (name) => {
    try {
      if (!db) throw new Error("Firebase no configurado");
      const docId = resolveDocId(name);
      // Sin sesión no hay documento con scope: no se lee nada.
      if (!docId) return null;
      const docRef = doc(db, 'app_storage', docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().value;
      }
      return null;
    } catch (err) {
      console.error(`[Storage] Error leyendo ${name} de Firestore:`, err.message);
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      if (!db) throw new Error("Firebase no configurado");
      const docId = resolveDocId(name);
      // Sin sesión no se escribe nada: evita crear docs huérfanos.
      if (!docId) return;
      const sizeBytes = new TextEncoder().encode(value).length;
      if (sizeBytes > 950 * 1024) {
        console.warn(`[Storage] ${name} demasiado grande (${Math.round(sizeBytes / 1024)}KB). No se guarda.`);
        return;
      }
      const docRef = doc(db, 'app_storage', docId);
      await setDoc(docRef, { value, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error(`[Storage] Error guardando ${name} en Firestore:`, err.message);
    }
  },
  removeItem: async (name) => {
    try {
      if (!db) throw new Error("Firebase no configurado");
      const docId = resolveDocId(name);
      if (!docId) return;
      const docRef = doc(db, 'app_storage', docId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(`[Storage] Error eliminando ${name} de Firestore:`, err.message);
    }
  }
};

const customStorage = createJSONStorage(() => firebaseStorage);

/**
 * Los stores se crean sin rehidratar (skipHydration) porque en ese
 * momento todavía no sabemos quién es el usuario. `hydrateStores()` se
 * llama desde AuthGate una vez resuelta la sesión, y `resetStores()`
 * al cerrar sesión para que el siguiente usuario no vea datos ajenos en
 * memoria antes de que termine su rehidratación.
 */
const HYDRATION = { skipHydration: true, storage: customStorage };

export const hydrateStores = async () => {
  await Promise.all([
    useUserStore.persist.rehydrate(),
    useRoutineStore.persist.rehydrate(),
    useHistoryStore.persist.rehydrate(),
  ]);
};

export const resetStores = () => {
  useUserStore.setState(INITIAL_USER_STATE, false);
  useRoutineStore.setState(INITIAL_ROUTINE_STATE, false);
  useHistoryStore.setState(INITIAL_HISTORY_STATE, false);
};

// -----------------------------------------------------------------
// STORES
// -----------------------------------------------------------------

const INITIAL_USER_STATE = {
  profile: {
    name: '',
    age: '',
    weight: '',
    height: '',
    imc: null,
    imcStatus: '',
  },
  healthHistory: [],
};

const INITIAL_ROUTINE_STATE = {
  routines: [],
  selectedExercises: [],
  customExercises: [],
  editingRoutineId: null,
};

const INITIAL_HISTORY_STATE = {
  history: [],
};

export const useUserStore = create(
  persist(
    (set) => ({
      profile: {
        name: '',
        age: '',
        weight: '',
        height: '',
        imc: null,
        imcStatus: '',
      },
      healthHistory: [],
      setProfile: (profile) => set((state) => {
        const newRecord = {
          date: new Date().toISOString(),
          weight: profile.weight,
          imc: profile.imc,
          imcStatus: profile.imcStatus
        };
        
        return { 
          profile,
          healthHistory: [newRecord, ...state.healthHistory].slice(0, 20)
        };
      }),
      deleteHealthRecord: (date) => set((state) => ({
        healthHistory: state.healthHistory.filter(r => r.date !== date)
      })),
    }),
    {
      name: STORAGE_KEYS.user,
      ...HYDRATION
    }
  )
);

export const useRoutineStore = create(
  persist(
    (set) => ({
      routines: [],
      selectedExercises: [], 
      customExercises: [], // Nuevo: Almacenamiento de ejercicios creados por el usuario
      editingRoutineId: null, 
      
      addCustomExercise: (exercise) => set((state) => ({
        customExercises: [...state.customExercises, { ...exercise, id: `custom-${crypto.randomUUID()}` }]
      })),

      editCustomExercise: (id, updatedData) => set((state) => ({
        customExercises: state.customExercises.map(e => e.id === id ? { ...e, ...updatedData } : e),
        selectedExercises: state.selectedExercises.map(e => e.id === id ? { ...e, ...updatedData } : e),
        routines: state.routines.map(r => ({
          ...r,
          exercises: r.exercises.map(e => e.id === id ? { ...e, ...updatedData } : e)
        }))
      })),

      deleteCustomExercise: (id) => set((state) => ({
        customExercises: state.customExercises.filter(e => e.id !== id),
        selectedExercises: state.selectedExercises.filter(e => e.id !== id),
        routines: state.routines.map(r => ({
          ...r,
          exercises: r.exercises.filter(e => e.id !== id)
        }))
      })),

      toggleSelection: (exercise) => set((state) => {
        const exists = state.selectedExercises.find(e => e.id === exercise.id);
        if (exists) {
          return { selectedExercises: state.selectedExercises.filter(e => e.id !== exercise.id) };
        }
        return { selectedExercises: [...state.selectedExercises, { 
          ...exercise, 
          sets: 3, 
          reps: 12, 
          rest: 60, 
          weight: 0, 
          videoUrl: exercise.videoUrl || '',
          hasTimer: false, // Nuevo: Timer opcional para el ejercicio
          timerDuration: 60, // Nuevo: Duración del timer del ejercicio
          sequence: exercise.sequence || DEFAULT_SEQUENCE_MODE // Continuo o alternado dentro de la rutina
        }] };
      }),

      updateExerciseConfig: (id, field, value) => set((state) => ({
        selectedExercises: state.selectedExercises.map(e => 
          e.id === id ? { ...e, [field]: value } : e
        )
      })),

      moveExercise: (id, direction) => set((state) => {
        const list = [...state.selectedExercises];
        const idx = list.findIndex(e => e.id === id);
        if (idx === -1) return state;
        const target = idx + direction;
        if (target < 0 || target >= list.length) return state;
        [list[idx], list[target]] = [list[target], list[idx]];
        return { selectedExercises: list };
      }),

      reorderExercises: (activeId, overId) => set((state) => {
        const list = [...state.selectedExercises];
        const oldIndex = list.findIndex(e => e.id === activeId);
        const newIndex = list.findIndex(e => e.id === overId);
        if (oldIndex === -1 || newIndex === -1) return state;
        const [removed] = list.splice(oldIndex, 1);
        list.splice(newIndex, 0, removed);
        return { selectedExercises: list };
      }),

      addRoutine: (name) => set((state) => {
        const newRoutine = {
          id: state.editingRoutineId || crypto.randomUUID(),
          name,
          exercises: state.selectedExercises,
          createdAt: new Date().toISOString()
        };
        return { 
          routines: state.editingRoutineId 
            ? state.routines.map(r => r.id === state.editingRoutineId ? newRoutine : r)
            : [...state.routines, newRoutine],
          selectedExercises: [], 
          editingRoutineId: null 
        };
      }),

      loadRoutineForEditing: (id) => set((state) => {
        const routine = state.routines.find(r => r.id === id);
        if (!routine) return state;
        return {
          selectedExercises: routine.exercises,
          editingRoutineId: id
        };
      }),

      cancelEditing: () => set({ selectedExercises: [], editingRoutineId: null }),

      deleteRoutine: (id) => set((state) => ({ 
        routines: state.routines.filter(r => r.id !== id) 
      })),

      updateRoutineExercises: (routineId, updatedExercises) => set((state) => ({
        routines: state.routines.map(r =>
          r.id === routineId
            ? { ...r, exercises: r.exercises.map(ex => {
                const update = updatedExercises.find(u => u.id === ex.id);
                return update ? { ...ex, sets: update.sets, reps: update.reps, weight: update.weight, rest: update.rest, notes: update.notes || '', sequence: update.sequence || DEFAULT_SEQUENCE_MODE } : ex;
              })}
            : r
        )
      })),
    }),
    {
      name: STORAGE_KEYS.routine,
      ...HYDRATION,
      partialize: (state) => ({
        routines: state.routines,
        customExercises: state.customExercises,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        selectedExercises: [],
        editingRoutineId: null,
      }),
    }
  )
);

export const useHistoryStore = create(
  persist(
    (set) => ({
      history: [],
      addSession: (session) => set((state) => ({ 
        history: [...state.history, { 
          ...session, 
          id: crypto.randomUUID(), 
          date: session.date || new Date().toISOString(),
        }] 
      })),
      updateSession: (id, updates) => set((state) => ({
        history: state.history.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      deleteSession: (id) => set((state) => ({
        history: state.history.filter(s => s.id !== id)
      })),
      addExerciseSnapshot: (exercises, routineName) => set((state) => ({
        history: [...state.history, {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          routineName,
          exercisesCount: exercises.length,
          exercises: exercises.map(ex => ({
            exerciseId: ex.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight || 0,
            rest: ex.rest,
          })),
          totalVolume: exercises.reduce((acc, ex) => acc + ((ex.weight || 0) * (ex.reps || 0) * (ex.sets || 0)), 0),
          status: 'Configurado',
        }]
      })),
    }),
    {
      name: STORAGE_KEYS.history,
      ...HYDRATION
    }
  )
);
