/**
 * Reporte por rutina: datos actuales de cada ejercicio + su histórico,
 * construido a partir de las sesiones registradas de esa rutina.
 */

const sameExercise = (a, b) =>
    (a.exerciseId != null && a.exerciseId === b.id) ||
    (a.name || "").toLowerCase() === (b.name || "").toLowerCase();

const trend = (curr, prev) => {
    if (prev == null) return null;
    if (curr > prev) return "up";
    if (curr < prev) return "down";
    return "same";
};

/** Sesiones de una rutina, de la más antigua a la más reciente. */
export const getRoutineSessions = (routine, history = []) =>
    history
        .filter((s) => s.routineName === routine?.name)
        .sort((a, b) => new Date(a.date) - new Date(b.date));


const sortByDate = (history) =>
    [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

const dayKey = (iso) => new Date(iso).toISOString().slice(0, 10);

/**
 * Histórico de un ejercicio, igual que el historial de la pantalla de
 * rutinas: toda sesión que contenga el ejercicio (de cualquier rutina),
 * un registro por día (el último). Las sesiones antiguas sin detalle de
 * ejercicios solo cuentan para su propia rutina y usan los valores
 * actuales del ejercicio (estimated: true).
 */
export const getExerciseHistory = (exercise, history, routineName) => {
    const byDay = new Map();
    sortByDate(history).forEach((session) => {
        const hasSnapshot = session.exercises?.length > 0;
        let match = null;
        if (hasSnapshot) {
            match = session.exercises.find((ex) => sameExercise(ex, exercise));
        } else if (session.routineName === routineName) {
            match = {
                sets: exercise.sets,
                reps: exercise.reps,
                weight: exercise.weight,
            };
        }
        if (!match) return;
        byDay.set(dayKey(session.date), {
            date: session.date,
            sets: match.sets,
            reps: match.reps,
            weight: match.weight || 0,
            estimated: !hasSnapshot,
        });
    });
    const entries = [...byDay.values()];
    return entries.map((entry, i) => {
        const prev = i > 0 ? entries[i - 1] : null;
        return {
            ...entry,
            weightTrend: trend(entry.weight, prev?.weight),
            repsTrend: trend(entry.reps, prev?.reps),
            setsTrend: trend(entry.sets, prev?.sets),
        };
    });
};

/** Reporte completo de una rutina. */
export const buildRoutineReport = (routine, history = []) => {
    if (!routine) return null;
    const sessions = getRoutineSessions(routine, history);
    const exercises = (routine.exercises || []).map((exercise) => {
        const entries = getExerciseHistory(exercise, history, routine.name);
        const first = entries[0];
        const last = entries[entries.length - 1];
        return {
            exercise,
            history: entries,
            weightChange: first && last ? last.weight - first.weight : 0,
            repsChange: first && last ? last.reps - first.reps : 0,
        };
    });
    return {
        routine,
        sessionsCount: sessions.length,
        lastSessionDate: sessions.length
            ? sessions[sessions.length - 1].date
            : null,
        exercises,
    };
};
