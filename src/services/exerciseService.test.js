import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../firebase', () => ({ db: undefined }));

import { fetchAllExercises } from './exerciseService';

const RAW_IMAGES_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop';

const mockExercises = [
  {
    id: '1',
    name: 'Push-Up',
    primaryMuscles: ['chest'],
    category: 'strength',
    equipment: 'body weight',
    images: ['1/0.jpg'],
    instructions: ['A', 'B'],
  },
  {
    id: '2',
    name: 'Squat',
    primaryMuscles: ['legs'],
    category: 'strength',
    equipment: 'barbell',
    images: [],
    instructions: [],
  },
];

const mockOkResponse = (data) => ({ ok: true, json: async () => data });

describe('fetchAllExercises', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('mapea correctamente los datos de la API a la estructura de la UI', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockOkResponse(mockExercises));

    const result = await fetchAllExercises();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: '1',
      name: 'Push-Up',
      bodyPart: 'chest',
      target: 'strength',
      equipment: 'body weight',
      imageUrl: `${RAW_IMAGES_BASE}1/0.jpg`,
      instructions: ['A', 'B'],
    });
    expect(result[1].imageUrl).toBe(FALLBACK_IMAGE);
  });

  it('retorna [] cuando la red falla y no hay Firestore', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));

    const result = await fetchAllExercises();

    expect(result).toEqual([]);
  });
});
