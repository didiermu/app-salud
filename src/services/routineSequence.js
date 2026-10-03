// -----------------------------------------------------------------
// MOTOR DE SECUENCIA DE LA RUTINA
// -----------------------------------------------------------------
// Aplana la rutina (ejercicios en orden) a una lista de pasos (series)
// que el entrenamiento reproduce uno tras otro.
//
// Cada ejercicio define su propia secuencia:
//   'continuous' -> ejecuta sus N series seguidas y pasa al siguiente.
//   'alternated' -> intercala sus series con los ejercicios alternados
//                   consecutivos; al acabar el bloque, sigue la rutina.
//
// Ejemplo: A(3 alternado) B(3 alternado) C(2 continuo)
//   -> A1, B1, A2, B2, A3, B3, C1, C2
// -----------------------------------------------------------------

export const SEQUENCE_MODES = {
    CONTINUOUS: "continuous",
    ALTERNATED: "alternated",
};

export const DEFAULT_SEQUENCE_MODE = SEQUENCE_MODES.CONTINUOUS;

// Los ejercicios guardados antes de existir este campo no lo traen:
// se tratan como continuos para no romperlos.
export const resolveSequenceMode = (exercise) =>
    exercise?.sequence || DEFAULT_SEQUENCE_MODE;

export const isAlternated = (exercise) =>
    resolveSequenceMode(exercise) === SEQUENCE_MODES.ALTERNATED;

// Series que realmente se ejecutan de este ejercicio. Un alternado sin
// una cantidad válida conserva el comportamiento previo de ejecutar 1.
export const getPlayedSets = (exercise) =>
    isAlternated(exercise)
        ? Math.max(1, Number(exercise?.sets) || 0)
        : Math.max(0, Number(exercise?.sets) || 0);

// Aplana la rutina a pasos. Cada paso lleva:
//   currentSet      -> numero de serie dentro del ejercicio (1..N)
//   totalSets       -> series que se ejecutan de este ejercicio
//   configuredSets  -> N configurado en el editor
export function buildWorkoutSteps(exercises = []) {
    const steps = [];

    for (let index = 0; index < exercises.length; ) {
        const exercise = exercises[index];
        const sequence = resolveSequenceMode(exercise);

        if (sequence === SEQUENCE_MODES.ALTERNATED) {
            const block = [];
            while (index < exercises.length && isAlternated(exercises[index])) {
                const alternatedExercise = exercises[index];
                block.push({
                    exercise: alternatedExercise,
                    totalSets: getPlayedSets(alternatedExercise),
                });
                index += 1;
            }

            const maxSets = Math.max(
                ...block.map(({ totalSets }) => totalSets),
            );
            for (let currentSet = 1; currentSet <= maxSets; currentSet += 1) {
                for (const {
                    exercise: alternatedExercise,
                    totalSets,
                } of block) {
                    if (currentSet > totalSets) continue;
                    steps.push({
                        ...alternatedExercise,
                        currentSet,
                        totalSets,
                        configuredSets: alternatedExercise?.sets,
                        sequence: SEQUENCE_MODES.ALTERNATED,
                    });
                }
            }
            continue;
        }

        const totalSets = getPlayedSets(exercise);
        for (let currentSet = 1; currentSet <= totalSets; currentSet += 1) {
            steps.push({
                ...exercise,
                currentSet,
                totalSets,
                configuredSets: exercise?.sets,
                sequence,
            });
        }
        index += 1;
    }

    return steps;
}

// Identidad de un paso dentro de la lista (un ejercicio aparece una sola
// vez por rutina, asi que id + numero de serie es unico).
export const stepKey = (step) => `${step.id}-${step.currentSet}`;
