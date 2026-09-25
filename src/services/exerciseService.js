/**
 * Servicio de Ejercicios (Dataset Yuhonas).
 * Lee el catálogo desde Firestore. Si Firestore no tiene datos,
 * descarga desde GitHub y guarda en Firestore para futuras consultas.
 */

import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const RAW_JSON_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const RAW_IMAGES_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const CACHE_KEY = 'exercise-catalog-cache';

export const fetchAllExercises = async () => {
  try {
    if (db) {
      const docRef = doc(db, 'app_storage', CACHE_KEY);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const parsed = JSON.parse(docSnap.data().value);
        if (Array.isArray(parsed.data) && parsed.data.length > 0) {
          return parsed.data;
        }
      }
    }
  } catch (err) {
    console.warn('[ExerciseService] Error leyendo catálogo de Firestore:', err.message);
  }

  try {
    const response = await fetch(RAW_JSON_URL);
    if (!response.ok) throw new Error('Error al obtener la base de datos de ejercicios');
    
    const data = await response.json();
    
    const mapped = data.map(ex => ({
      id: ex.id,
      name: ex.name,
      bodyPart: ex.primaryMuscles ? ex.primaryMuscles[0] : 'General',
      target: ex.category || 'Cuerpo completo',
      equipment: ex.equipment || 'Peso Corporal',
      imageUrl: ex.images && ex.images.length > 0 
        ? `${RAW_IMAGES_BASE}${ex.images[0]}`
        : 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop',
      instructions: ex.instructions || []
    }));

    if (db) {
      try {
        const payload = JSON.stringify({ timestamp: Date.now(), data: mapped });
        const docRef = doc(db, 'app_storage', CACHE_KEY);
        await setDoc(docRef, { value: payload, updatedAt: new Date().toISOString() });
      } catch (err) {
        console.warn('[ExerciseService] Error guardando catálogo en Firestore:', err.message);
      }
    }

    return mapped;
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};
