// -----------------------------------------------------------------
// MOTOR DE SECUENCIA DE LA RUTINA
// -----------------------------------------------------------------
// Aplana la rutina (ejercicios en orden) a una lista de pasos (series)
// que el entrenamiento reproduce uno tras otro.
//
// Cada ejercicio define su propia secuencia:
//   'continuous' -> ejecuta sus N series seguidas y pasa al siguiente.
//   'alternated' -> ejecuta 1 sola serie y pasa al siguiente.
//
// Ejemplo: A(3 continuo) B(3 alternado) C(2 continuo)
//   -> A1, A2, A3, B1, C1, C2
// -----------------------------------------------------------------

export const SEQUENCE_MODES = {
  CONTINUOUS: 'continuous',
  ALTERNATED: 'alternated',
};

export const DEFAULT_SEQUENCE_MODE = SEQUENCE_MODES.CONTINUOUS;

// Los ejercicios guardados antes de existir este campo no lo traen:
// se tratan como continuos para no romperlos.
export const resolveSequenceMode = (exercise) =>
  exercise?.sequence || DEFAULT_SEQUENCE_MODE;

export const isAlternated = (exercise) =>
  resolveSequenceMode(exercise) === SEQUENCE_MODES.ALTERNATED;

// Series que realmente se ejecutan de este ejercicio.
export const getPlayedSets = (exercise) =>
  isAlternated(exercise) ? 1 : Math.max(0, Number(exercise?.sets) || 0);

// Aplana la rutina a pasos. Cada paso lleva:
//   currentSet      -> numero de serie dentro del ejercicio (1..N)
//   totalSets       -> series que se ejecutan de este ejercicio
//   configuredSets  -> N configurado en el editor (se conserva aunque
//                      el ejercicio sea alternado y solo ejecute 1)
export function buildWorkoutSteps(exercises = []) {
  const steps = [];

  for (const exercise of exercises) {
    const totalSets = getPlayedSets(exercise);
    const sequence = resolveSequenceMode(exercise);

    for (let currentSet = 1; currentSet <= totalSets; currentSet++) {
      steps.push({
        ...exercise,
        currentSet,
        totalSets,
        configuredSets: exercise?.sets,
        sequence,
      });
    }
  }

  return steps;
}

// Identidad de un paso dentro de la lista (un ejercicio aparece una sola
// vez por rutina, asi que id + numero de serie es unico).
export const stepKey = (step) => `${step.id}-${step.currentSet}`;
