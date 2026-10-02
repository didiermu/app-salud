import { describe, expect, it } from 'vitest';

import {
  SEQUENCE_MODES,
  buildWorkoutSteps,
  getPlayedSets,
  isAlternated,
  resolveSequenceMode,
  stepKey,
} from './routineSequence';

const ex = (id, sets, sequence) => ({ id, name: id, sets, sequence });

// "A1, A2, A3, B1" -> lista de pasos en el orden en que se ejecutan
const asOrder = (steps) => steps.map((s) => `${s.id}${s.currentSet}`);

describe('resolveSequenceMode', () => {
  it('usa el modo configurado en el ejercicio', () => {
    expect(resolveSequenceMode(ex('A', 3, SEQUENCE_MODES.ALTERNATED))).toBe(SEQUENCE_MODES.ALTERNATED);
    expect(resolveSequenceMode(ex('A', 3, SEQUENCE_MODES.CONTINUOUS))).toBe(SEQUENCE_MODES.CONTINUOUS);
  });

  it('trata como continuo un ejercicio sin el campo (rutinas ya guardadas)', () => {
    expect(resolveSequenceMode({ id: 'A', sets: 3 })).toBe(SEQUENCE_MODES.CONTINUOUS);
    expect(isAlternated({ id: 'A', sets: 3 })).toBe(false);
  });

  it('es seguro con ejercicios nulos', () => {
    expect(resolveSequenceMode(undefined)).toBe(SEQUENCE_MODES.CONTINUOUS);
    expect(getPlayedSets(undefined)).toBe(0);
  });
});

describe('getPlayedSets', () => {
  it('devuelve 1 para un ejercicio alternado, ignorando sus series configuradas', () => {
    expect(getPlayedSets(ex('A', 3, SEQUENCE_MODES.ALTERNATED))).toBe(1);
    expect(getPlayedSets(ex('A', 8, SEQUENCE_MODES.ALTERNATED))).toBe(1);
  });

  it('devuelve las series configuradas para uno continuo', () => {
    expect(getPlayedSets(ex('A', 3, SEQUENCE_MODES.CONTINUOUS))).toBe(3);
  });
});

describe('buildWorkoutSteps', () => {
  it('ejecuta las series seguidas y luego pasa al siguiente ejercicio', () => {
    const steps = buildWorkoutSteps([
      ex('A', 3),
      ex('B', 1),
      ex('C', 2),
    ]);

    expect(asOrder(steps)).toEqual(['A1', 'A2', 'A3', 'B1', 'C1', 'C2']);
  });

  it('un ejercicio alternado se ejecuta 1 sola serie y no interrumpe al anterior', () => {
    const steps = buildWorkoutSteps([
      ex('A', 3, SEQUENCE_MODES.CONTINUOUS),
      ex('B', 3, SEQUENCE_MODES.ALTERNATED),
      ex('C', 2, SEQUENCE_MODES.CONTINUOUS),
    ]);

    expect(asOrder(steps)).toEqual(['A1', 'A2', 'A3', 'B1', 'C1', 'C2']);
  });

  it('el mismo ejercicio con 3 series continuas si no se marca como alternado', () => {
    const steps = buildWorkoutSteps([
      ex('A', 3, SEQUENCE_MODES.CONTINUOUS),
      ex('B', 3, SEQUENCE_MODES.CONTINUOUS),
      ex('C', 2, SEQUENCE_MODES.CONTINUOUS),
    ]);

    expect(asOrder(steps)).toEqual(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2']);
  });

  it('conserva las series configuradas de un alternado en configuredSets', () => {
    const steps = buildWorkoutSteps([ex('A', 4, SEQUENCE_MODES.ALTERNATED)]);

    expect(steps).toHaveLength(1);
    expect(steps[0].totalSets).toBe(1);
    expect(steps[0].configuredSets).toBe(4);
  });

  it('marca cada paso con su secuencia y conserva los datos del ejercicio', () => {
    const steps = buildWorkoutSteps([
      { ...ex('A', 2, SEQUENCE_MODES.ALTERNATED), reps: 10, rest: 45 },
    ]);

    expect(steps[0].reps).toBe(10);
    expect(steps[0].rest).toBe(45);
    expect(steps[0].sequence).toBe(SEQUENCE_MODES.ALTERNATED);
  });

  it('ignora ejercicios con series vacias, cero o inexistentes', () => {
    expect(asOrder(buildWorkoutSteps([ex('A', 0), ex('B', 2)]))).toEqual(['B1', 'B2']);
    expect(asOrder(buildWorkoutSteps([ex('A', ''), ex('B', 1)]))).toEqual(['B1']);
    expect(asOrder(buildWorkoutSteps([ex('A', undefined)]))).toEqual([]);
  });

  it('un alternado con series vacias sigue ejecutando su 1 serie', () => {
    expect(asOrder(buildWorkoutSteps([ex('A', 0, SEQUENCE_MODES.ALTERNATED)]))).toEqual(['A1']);
  });

  it('devuelve una lista vacia si no hay ejercicios', () => {
    expect(buildWorkoutSteps([])).toEqual([]);
    expect(buildWorkoutSteps()).toEqual([]);
  });
});

describe('stepKey', () => {
  it('identifica cada paso por ejercicio y numero de serie', () => {
    const steps = buildWorkoutSteps([ex('A', 3), ex('B', 3, SEQUENCE_MODES.ALTERNATED)]);
    const keys = steps.map(stepKey);

    expect(keys).toEqual(['A-1', 'A-2', 'A-3', 'B-1']);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
