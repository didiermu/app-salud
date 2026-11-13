import { describe, expect, it } from "vitest";
import {
    buildRoutineReport,
    getExerciseHistory,
    getRoutineSessions,
} from "./routineReport";

const routine = {
    id: "r1",
    name: "Push",
    exercises: [
        { id: "e1", name: "Press banca", sets: 4, reps: 10, weight: 40, rest: 60 },
        { id: "e2", name: "Fondos", sets: 3, reps: 12, weight: 0, rest: 45 },
    ],
};

const history = [
    {
        id: "s2",
        routineName: "Push",
        date: "2026-11-10T10:00:00.000Z",
        exercises: [
            { exerciseId: "e1", name: "Press banca", sets: 4, reps: 12, weight: 45 },
        ],
    },
    {
        id: "s1",
        routineName: "Push",
        date: "2026-11-03T10:00:00.000Z",
        exercises: [
            { exerciseId: "e1", name: "Press banca", sets: 3, reps: 10, weight: 40 },
        ],
    },
    { id: "s3", routineName: "Pull", date: "2026-11-05T10:00:00.000Z", exercises: [] },
    { id: "s0", routineName: "Push", date: "2026-10-01T10:00:00.000Z" },
];

describe("routineReport", () => {
    it("filtra y ordena las sesiones de la rutina", () => {
        const sessions = getRoutineSessions(routine, history);
        expect(sessions.map((s) => s.id)).toEqual(["s0", "s1", "s2"]);
    });

    it("sesiones antiguas sin ejercicios usan los valores actuales de la rutina", () => {
        const entries = getExerciseHistory(routine.exercises[1], history, "Push");
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({
            sets: 3,
            reps: 12,
            weight: 0,
            estimated: true,
        });
    });

    it("arma el histórico de un ejercicio con tendencias", () => {
        const entries = getExerciseHistory(routine.exercises[0], history, "Push");
        expect(entries).toHaveLength(3);
        expect(entries[0].weightTrend).toBeNull();
        expect(entries[2]).toMatchObject({
            weight: 45,
            reps: 12,
            sets: 4,
            weightTrend: "up",
            repsTrend: "up",
            setsTrend: "up",
        });
    });

    it("incluye sesiones del ejercicio hechas desde otra rutina (igual que el historial de Planes)", () => {
        const other = [
            ...history,
            {
                id: "x1",
                routineName: "Otra rutina",
                date: "2026-11-07T10:00:00.000Z",
                exercises: [
                    { exerciseId: "zz", name: "PRESS BANCA", sets: 5, reps: 8, weight: 50 },
                ],
            },
        ];
        const entries = getExerciseHistory(routine.exercises[0], other, "Push");
        expect(entries.map((e) => e.weight)).toEqual([40, 40, 50, 45]);
    });

    it("un registro por día: conserva el último", () => {
        const sameDay = [
            ...history,
            {
                id: "d1",
                routineName: "Push",
                date: "2026-11-10T18:00:00.000Z",
                exercises: [
                    { exerciseId: "e1", name: "Press banca", sets: 4, reps: 12, weight: 47.5 },
                ],
            },
        ];
        const entries = getExerciseHistory(routine.exercises[0], sameDay, "Push");
        expect(entries[entries.length - 1].weight).toBe(47.5);
        expect(entries).toHaveLength(3);
    });

    it("calcula el reporte completo y tolera ejercicios sin histórico", () => {
        const report = buildRoutineReport(routine, history);
        expect(report.sessionsCount).toBe(3);
        expect(report.lastSessionDate).toBe("2026-11-10T10:00:00.000Z");
        expect(report.exercises[0].weightChange).toBe(5);
        expect(report.exercises[0].repsChange).toBe(2);
        expect(report.exercises[1].history).toHaveLength(1);
        expect(report.exercises[1].weightChange).toBe(0);
    });

    it("devuelve null sin rutina", () => {
        expect(buildRoutineReport(undefined, history)).toBeNull();
    });
});
