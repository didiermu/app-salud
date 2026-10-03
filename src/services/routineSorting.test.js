import { describe, expect, it } from "vitest";
import { sortRoutinesNewestFirst } from "./routineSorting";

describe("sortRoutinesNewestFirst", () => {
    it("ordena desde la más nueva hasta la más antigua sin mutar el arreglo", () => {
        const routines = [
            { id: "old", createdAt: "2025-01-01T12:00:00.000Z" },
            { id: "new", createdAt: "2026-01-01T12:00:00.000Z" },
            { id: "middle", createdAt: "2025-06-01T12:00:00.000Z" },
        ];

        expect(
            sortRoutinesNewestFirst(routines).map((routine) => routine.id),
        ).toEqual(["new", "middle", "old"]);
        expect(routines[0].id).toBe("old");
    });

    it("coloca las rutinas sin fecha o con fecha inválida al final", () => {
        const routines = [
            { id: "missing" },
            { id: "new", createdAt: "2026-01-01T12:00:00.000Z" },
            { id: "invalid", createdAt: "not-a-date" },
        ];

        expect(
            sortRoutinesNewestFirst(routines).map((routine) => routine.id),
        ).toEqual(["new", "missing", "invalid"]);
    });
});
