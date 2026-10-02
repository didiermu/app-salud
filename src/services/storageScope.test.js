import { describe, expect, it } from 'vitest';
import { GLOBAL_DOCS, STORAGE_KEYS, legacyDocId, scopedDocId } from './storageScope';

describe('scopedDocId', () => {
  it('aísla los documentos por usuario con el uid como prefijo', () => {
    expect(scopedDocId('uid-abc', STORAGE_KEYS.routine)).toBe('uid-abc__routine-storage');
    expect(scopedDocId('uid-abc', STORAGE_KEYS.history)).toBe('uid-abc__history-storage');
    expect(scopedDocId('uid-abc', STORAGE_KEYS.user)).toBe('uid-abc__user-storage');
  });

  it('devuelve un doc distinto para cada usuario', () => {
    expect(scopedDocId('uid-1', STORAGE_KEYS.routine)).not.toBe(
      scopedDocId('uid-2', STORAGE_KEYS.routine)
    );
  });

  it('mantiene los documentos globales sin scope', () => {
    expect(scopedDocId('uid-abc', STORAGE_KEYS.catalogCache)).toBe('exercise-catalog-cache');
    expect(scopedDocId('uid-abc', STORAGE_KEYS.librarySeed)).toBe('exercise-library-seed');
  });

  it('devuelve null sin uid para las claves con scope', () => {
    expect(scopedDocId(null, STORAGE_KEYS.routine)).toBeNull();
    expect(scopedDocId(undefined, STORAGE_KEYS.history)).toBeNull();
  });

  it('sigue resolviendo los docs globales aunque no haya uid', () => {
    expect(scopedDocId(null, STORAGE_KEYS.catalogCache)).toBe('exercise-catalog-cache');
  });

  it('nunca colisiona una clave global con el patrón de scope', () => {
    GLOBAL_DOCS.forEach((name) => {
      expect(scopedDocId('uid-abc', name)).not.toContain('__');
    });
  });
});

describe('legacyDocId', () => {
  it('devuelve el nombre plano del documento heredado', () => {
    expect(legacyDocId(STORAGE_KEYS.user)).toBe('user-storage');
    expect(legacyDocId(STORAGE_KEYS.routine)).toBe('routine-storage');
    expect(legacyDocId(STORAGE_KEYS.history)).toBe('history-storage');
  });

  it('el doc heredado no lleva uid, a diferencia del scoped', () => {
    expect(legacyDocId(STORAGE_KEYS.routine)).not.toBe(
      scopedDocId('uid-abc', STORAGE_KEYS.routine)
    );
  });
});
