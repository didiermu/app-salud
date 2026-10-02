/**
 * Nombres de documento en la colección `app_storage`.
 *
 * `GLOBAL_DOCS` no se scopea por uid: son datos compartidos por todos
 * los usuarios (el catálogo de 873 ejercicios y la biblioteca semilla).
 * Cualquier otro nombre se persiste como `${uid}__${name}`.
 */
export const GLOBAL_DOCS = new Set(['exercise-catalog-cache', 'exercise-library-seed']);

export const STORAGE_KEYS = {
  user: 'user-storage',
  routine: 'routine-storage',
  history: 'history-storage',
  librarySeed: 'exercise-library-seed',
  catalogCache: 'exercise-catalog-cache',
};

/**
 * Construye el id del documento para una clave de persistencia.
 * Las claves globales conservan su nombre; el resto se aísla por uid.
 */
export const scopedDocId = (uid, name) => {
  if (GLOBAL_DOCS.has(name)) return name;
  if (!uid) return null;
  return `${uid}__${name}`;
};

/**
 * Id heredado, sin scope, usado antes de que existiera la autenticación.
 * Solo debe tocarse durante la migración.
 */
export const legacyDocId = (name) => name;
