import { beforeEach, describe, expect, it, vi } from 'vitest';

const docs = new Map();

// --- Mocks de Firestore: un Map en memoria hace de base de datos. ---
vi.mock('firebase/firestore', () => ({
  doc: (_db, _collection, id) => ({ id }),
  getDoc: async (ref) => {
    const data = docs.get(ref.id);
    return {
      exists: () => data !== undefined,
      data: () => data,
    };
  },
  setDoc: async (ref, data) => {
    docs.set(ref.id, data);
  },
  deleteDoc: async (ref) => {
    docs.delete(ref.id);
  },
}));

vi.mock('../firebase', () => ({ db: {} }));

import {
  LEGACY_OWNER_EMAIL,
  isLegacyOwner,
  migrateLegacyData,
  prepareUserData,
  publishLibrarySeed,
  seedUserLibrary,
} from './migrationService';
import { STORAGE_KEYS, scopedDocId } from './storageScope';

const DIDIER = { uid: 'uid-didier', email: LEGACY_OWNER_EMAIL };
const OTRO = { uid: 'uid-otro', email: 'otra@correo.com' };

const legacyBlob = (state) => JSON.stringify({ state, version: 0 });

const setLegacyDocs = () => {
  docs.set(STORAGE_KEYS.user, {
    value: legacyBlob({
      profile: { name: 'Didier', age: '35', weight: '68.4', height: '180', imc: 21.1 },
      healthHistory: [{ date: '2026-01-01', weight: '68.4' }],
    }),
  });
  docs.set(STORAGE_KEYS.routine, {
    value: legacyBlob({
      routines: [{ id: 'r1', name: 'Upper - fuerza', exercises: [] }],
      customExercises: [
        { id: 'custom-1', name: 'Press barra', videoUrl: 'https://cdn/x.mp4' },
        { id: 'custom-2', name: 'Plancha', videoUrl: '' },
      ],
    }),
  });
  docs.set(STORAGE_KEYS.history, {
    value: legacyBlob({ history: [{ id: 'h1', routineName: 'Push', date: '2026-05-01' }] }),
  });
};

const readState = (docId) => JSON.parse(docs.get(docId).value).state;

beforeEach(() => {
  docs.clear();
});

describe('isLegacyOwner', () => {
  it('reconoce al dueño de los datos heredados sin distinguir mayúsculas', () => {
    expect(isLegacyOwner(DIDIER)).toBe(true);
    expect(isLegacyOwner({ email: 'DIDIERMU3@GMAIL.COM' })).toBe(true);
  });

  it('rechaza a cualquier otra cuenta', () => {
    expect(isLegacyOwner(OTRO)).toBe(false);
    expect(isLegacyOwner(null)).toBe(false);
    expect(isLegacyOwner({ email: 'didiermu3@gmail.com.evil.com' })).toBe(false);
  });
});

describe('migrateLegacyData', () => {
  it('copia perfil, rutinas e historial al scope del dueño', async () => {
    setLegacyDocs();

    await migrateLegacyData(DIDIER);

    expect(readState(scopedDocId(DIDIER.uid, STORAGE_KEYS.user)).profile.name).toBe('Didier');
    expect(readState(scopedDocId(DIDIER.uid, STORAGE_KEYS.routine)).routines).toHaveLength(1);
    expect(readState(scopedDocId(DIDIER.uid, STORAGE_KEYS.history)).history).toHaveLength(1);
  });

  it('no da los datos a otras cuentas', async () => {
    setLegacyDocs();

    await migrateLegacyData(OTRO);

    expect(docs.has(scopedDocId(OTRO.uid, STORAGE_KEYS.user))).toBe(false);
    expect(docs.has(scopedDocId(OTRO.uid, STORAGE_KEYS.routine))).toBe(false);
  });

  it('es idempotente: la segunda llamada no vuelve a copiar', async () => {
    setLegacyDocs();
    await migrateLegacyData(DIDIER);

    // El usuario edita su historial ya scoped.
    docs.get(scopedDocId(DIDIER.uid, STORAGE_KEYS.history)).value = legacyBlob({ history: [] });

    await migrateLegacyData(DIDIER);

    expect(readState(scopedDocId(DIDIER.uid, STORAGE_KEYS.history)).history).toHaveLength(0);
  });

  it('no pisa datos que el usuario ya tenía en su scope', async () => {
    docs.set(scopedDocId(DIDIER.uid, STORAGE_KEYS.routine), {
      value: legacyBlob({ routines: [{ id: 'mia', name: 'Mi rutina' }], customExercises: [] }),
    });
    setLegacyDocs();

    await migrateLegacyData(DIDIER);

    expect(readState(scopedDocId(DIDIER.uid, STORAGE_KEYS.routine)).routines[0].id).toBe('mia');
  });

  it('deja los documentos heredados intactos', async () => {
    setLegacyDocs();

    await migrateLegacyData(DIDIER);

    expect(docs.has(STORAGE_KEYS.user)).toBe(true);
    expect(docs.has(STORAGE_KEYS.routine)).toBe(true);
    expect(docs.has(STORAGE_KEYS.history)).toBe(true);
  });

  it('no falla si no hay datos heredados', async () => {
    await expect(migrateLegacyData(DIDIER)).resolves.toBe(false);
  });
});

describe('publishLibrarySeed', () => {
  it('publica los ejercicios personalizados como biblioteca global', async () => {
    setLegacyDocs();

    const count = await publishLibrarySeed();

    expect(count).toBe(2);
    expect(JSON.parse(docs.get(STORAGE_KEYS.librarySeed).value).customExercises).toHaveLength(2);
  });

  it('no sobreescribe una semilla ya publicada', async () => {
    setLegacyDocs();
    docs.set(STORAGE_KEYS.librarySeed, {
      value: JSON.stringify({ customExercises: [{ id: 'custom-9', name: 'Mía' }] }),
    });

    await publishLibrarySeed();

    expect(JSON.parse(docs.get(STORAGE_KEYS.librarySeed).value).customExercises).toHaveLength(1);
  });

  it('no publica nada si no hay ejercicios personalizados', async () => {
    docs.set(STORAGE_KEYS.routine, { value: legacyBlob({ routines: [], customExercises: [] }) });
    await expect(publishLibrarySeed()).resolves.toBe(0);
    expect(docs.has(STORAGE_KEYS.librarySeed)).toBe(false);
  });
});

describe('seedUserLibrary', () => {
  beforeEach(() => {
    docs.set(STORAGE_KEYS.librarySeed, {
      value: JSON.stringify({
        customExercises: [
          { id: 'custom-1', name: 'Press barra' },
          { id: 'custom-2', name: 'Plancha' },
        ],
      }),
    });
  });

  it('copia la biblioteca global a un usuario nuevo', async () => {
    const count = await seedUserLibrary(OTRO.uid);

    expect(count).toBe(2);
    expect(readState(scopedDocId(OTRO.uid, STORAGE_KEYS.routine)).customExercises).toHaveLength(2);
  });

  it('cada usuario recibe una copia independiente', async () => {
    await seedUserLibrary(OTRO.uid);
    await seedUserLibrary('uid-tercero');

    // Editar la copia de uno no toca la del otro ni la global.
    const doc = scopedDocId(OTRO.uid, STORAGE_KEYS.routine);
    const edited = JSON.parse(docs.get(doc).value);
    edited.state.customExercises[0].name = 'Press militar';
    docs.set(doc, { value: JSON.stringify(edited) });

    const otro = readState(scopedDocId('uid-tercero', STORAGE_KEYS.routine));
    expect(otro.customExercises[0].name).toBe('Press barra');
    expect(JSON.parse(docs.get(STORAGE_KEYS.librarySeed).value).customExercises[0].name).toBe(
      'Press barra'
    );
  });

  it('no resiembra si el usuario ya tiene sus propios ejercicios', async () => {
    await seedUserLibrary(OTRO.uid);
    const doc = scopedDocId(OTRO.uid, STORAGE_KEYS.routine);
    const edited = JSON.parse(docs.get(doc).value);
    edited.state.customExercises = [{ id: 'custom-99', name: 'Solo mío' }];
    docs.set(doc, { value: JSON.stringify(edited) });

    await seedUserLibrary(OTRO.uid);

    expect(readState(doc).customExercises).toHaveLength(1);
    expect(readState(doc).customExercises[0].id).toBe('custom-99');
  });

  it('conserva las rutinas que ya tuviera y no pierde datos al sembrar', async () => {
    docs.set(scopedDocId(OTRO.uid, STORAGE_KEYS.routine), {
      value: legacyBlob({ routines: [{ id: 'r9', name: 'Guardada' }], customExercises: [] }),
    });

    await seedUserLibrary(OTRO.uid);

    const state = readState(scopedDocId(OTRO.uid, STORAGE_KEYS.routine));
    expect(state.routines).toHaveLength(1);
    expect(state.customExercises).toHaveLength(2);
  });

  it('no hace nada si no hay biblioteca global publicada', async () => {
    docs.delete(STORAGE_KEYS.librarySeed);
    await expect(seedUserLibrary(OTRO.uid)).resolves.toBe(0);
  });
});

describe('prepareUserData', () => {
  it('al login del dueño migra sus datos y deja la biblioteca sembrada', async () => {
    setLegacyDocs();

    await prepareUserData(DIDIER);

    const routineDoc = scopedDocId(DIDIER.uid, STORAGE_KEYS.routine);
    expect(readState(routineDoc).routines).toHaveLength(1);
    expect(readState(routineDoc).customExercises).toHaveLength(2);
    expect(docs.has(STORAGE_KEYS.librarySeed)).toBe(true);
  });

  it('al login de otro usuario no ve datos ajenos y sí recibe la biblioteca', async () => {
    setLegacyDocs();

    await prepareUserData(OTRO);

    const routineDoc = scopedDocId(OTRO.uid, STORAGE_KEYS.routine);
    expect(readState(routineDoc).routines).toHaveLength(0);
    expect(readState(routineDoc).customExercises).toHaveLength(2);
    expect(docs.has(scopedDocId(OTRO.uid, STORAGE_KEYS.history))).toBe(false);
  });
});
