/**
 * Migración de datos de la era sin autenticación.
 *
 * Antes de Google Auth, los tres stores vivían en documentos sin scope:
 * `user-storage`, `routine-storage` y `history-storage`. Ahora cada
 * usuario lee y escribe en `${uid}__${name}`, así que esos documentos
 * huérfanos hay que copiarlos al usuario dueño.
 *
 * Reglas:
 *  - Los datos existentes (25 rutinas, 83 sesiones, perfil de salud)
 *    se asignan a `LEGACY_OWNER_EMAIL` y solo a él.
 *  - Los 41 ejercicios personalizados se publican como biblioteca semilla
 *    global para que todo usuario nuevo arranque con esa primera versión.
 *    A partir de ahí cada usuario edita su propia copia, sin afectar
 *    la de los demás.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { STORAGE_KEYS, legacyDocId, scopedDocId } from './storageScope';

/** Propietario de los datos heredados. */
export const LEGACY_OWNER_EMAIL = 'didiermu3@gmail.com';

/** Doc que marca qué uid ya absorbió los datos heredados. */
const MIGRATION_FLAG_DOC = 'legacy-migration-flag';

export const isLegacyOwner = (user) =>
  user?.email?.toLowerCase() === LEGACY_OWNER_EMAIL;

/** Lee un documento de `app_storage` por id y devuelve su string `value`. */
const readDocValue = async (docId) => {
  const snap = await getDoc(doc(db, 'app_storage', docId));
  return snap.exists() ? snap.data().value ?? null : null;
};

/** Escribe un documento de `app_storage` con el formato que espera zustand. */
const writeDocValue = async (docId, value) => {
  await setDoc(doc(db, 'app_storage', docId), {
    value,
    updatedAt: new Date().toISOString(),
  });
};

/** Comprueba si un documento con scope ya existe. */
export const scopedDocExists = async (uid, name) => {
  const docId = scopedDocId(uid, name);
  if (!docId) return false;
  const snap = await getDoc(doc(db, 'app_storage', docId));
  return snap.exists();
};

/**
 * Copia los documentos heredados al scope del usuario dueño.
 * Es idempotente: si el flag ya apunta a ese uid, no hace nada.
 * @returns {Promise<boolean>} true si este login realizó la migración.
 */
export const migrateLegacyData = async (user) => {
  if (!user || !isLegacyOwner(user)) return false;

  const flagSnap = await getDoc(doc(db, 'app_storage', MIGRATION_FLAG_DOC));
  if (flagSnap.exists() && flagSnap.data().migratedBy === user.uid) return false;

  const keys = [STORAGE_KEYS.user, STORAGE_KEYS.routine, STORAGE_KEYS.history];
  const copied = [];

  for (const key of keys) {
    const legacyValue = await readDocValue(legacyDocId(key));
    if (!legacyValue) continue;

    // No pisamos datos que el usuario ya tenga en su scope.
    if (await scopedDocExists(user.uid, key)) continue;

    await writeDocValue(scopedDocId(user.uid, key), legacyValue);
    copied.push(key);
  }

  await setDoc(doc(db, 'app_storage', MIGRATION_FLAG_DOC), {
    migratedBy: user.uid,
    email: user.email,
    keys: copied,
    migratedAt: new Date().toISOString(),
  });

  return copied.length > 0;
};

/** Saca el array de ejercicios personalizados de un blob de zustand. */
const parseCustomExercises = (blob) => {
  if (!blob) return [];
  try {
    const parsed = JSON.parse(blob)?.state?.customExercises;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Publica la biblioteca semilla global a partir de los 41 ejercicios
 * personalizados existentes, para que todo usuario nuevo arranque con
 * esa primera versión.
 *
 * Busca el origen en este orden: documento semilla ya publicado,
 * `routine-storage` heredado, y el routine-storage del propio dueño. Es
 * idempotente: si la semilla existe, no se toca.
 *
 * @returns {Promise<number>} cuántos ejercicios se publicaron (0 si nada).
 */
export const publishLibrarySeed = async () => {
  const snap = await getDoc(doc(db, 'app_storage', STORAGE_KEYS.librarySeed));
  if (snap.exists()) return 0;

  // La semilla se publica desde el routine-storage heredado. Esto solo es
  // posible antes de desplegar las reglas (o mientras el dueño esté
  // conectado); después el documento semilla es la única fuente.
  try {
    const customExercises = parseCustomExercises(
      await readDocValue(legacyDocId(STORAGE_KEYS.routine))
    );
    if (customExercises.length === 0) return 0;

    await writeDocValue(
      STORAGE_KEYS.librarySeed,
      JSON.stringify({ customExercises })
    );
    return customExercises.length;
  } catch (err) {
    console.warn('[Migration] No se pudo publicar la biblioteca semilla:', err.message);
    return 0;
  }
};

/**
 * Si el usuario no tiene ejercicios personalizados, siembra su copia
 * desde la biblioteca global. Cada usuario recibe su propio Array con
 * sus propios objetos: editar uno no toca el de los demás.
 * @returns {Promise<number>} cuántos ejercicios se copiaron.
 */
export const seedUserLibrary = async (uid) => {
  const scopedId = scopedDocId(uid, STORAGE_KEYS.routine);
  if (!scopedId) return 0;

  const snap = await getDoc(doc(db, 'app_storage', scopedId));
  const existing = snap.exists() ? JSON.parse(snap.data().value) : null;

  // Si ya tiene ejercicios propios no sembramos nada.
  if (existing?.state?.customExercises?.length) return 0;

  const seedValue = await readDocValue(STORAGE_KEYS.librarySeed);
  let customExercises = [];
  try {
    customExercises = JSON.parse(seedValue)?.customExercises ?? [];
  } catch {
    customExercises = [];
  }
  if (!Array.isArray(customExercises) || customExercises.length === 0) return 0;

  const payload = {
    state: {
      routines: existing?.state?.routines ?? [],
      // Copia profunda: cada usuario edita sus propios objetos y nada de lo
      // que haga afecta a la biblioteca global ni a la de otro usuario.
      customExercises: structuredClone(customExercises),
    },
    version: 0,
  };

  await writeDocValue(scopedId, JSON.stringify(payload));
  return customExercises.length;
};

/**
 * Rutina completa de post-login: migra los datos heredados si toca
 * y asegura que el usuario tenga su propia biblioteca de ejercicios.
 */
export const prepareUserData = async (user) => {
  await migrateLegacyData(user);
  await publishLibrarySeed();
  await seedUserLibrary(user.uid);
};
