import { describe, expect, it } from "vitest";
import {
    CSV_COLUMNS,
    buildExport,
    buildExportFile,
    reportToRows,
    reportsToMarkdown,
    reportsToCsv,
    reportsToJson,
} from "./reportExport";
import { buildRoutineReport } from "./routineReport";

const routine = {
    id: "r1",
    name: "DÍA 3 — ESPALDA, BRAZOS",
    exercises: [
        { id: "e1", name: 'Remo "mancuerna"', target: "back", sets: 4, reps: 10, weight: 20, rest: 60 },
        { id: "e2", name: "Plancha", sets: 3, reps: 1, weight: 0, rest: 30 },
    ],
};
const history = [
    {
        id: "s1",
        routineName: routine.name,
        date: "2026-11-03T10:00:00.000Z",
        exercises: [{ exerciseId: "e1", name: 'Remo "mancuerna"', sets: 3, reps: 10, weight: 17.5 }],
    },
    {
        id: "s2",
        routineName: routine.name,
        date: "2026-11-10T10:00:00.000Z",
        exercises: [{ exerciseId: "e1", name: 'Remo "mancuerna"', sets: 4, reps: 10, weight: 20 }],
    },
];
const NOW = new Date("2026-11-13T12:00:00.000Z");

describe("reportExport", () => {
    it("genera filas current + history por ejercicio", () => {
        const rows = reportToRows(buildRoutineReport(routine, history));
        expect(rows.map((r) => r.record_type)).toEqual([
            "current",
            "history",
            "history",
            "current",
        ]);
        expect(rows[1]).toMatchObject({ date: "2026-11-03", weight_kg: 17.5, volume_kg: 525, is_estimated: false });
        expect(rows[0].volume_kg).toBe(800);
    });

    it("CSV: BOM, cabecera estable y escape de comillas", () => {
        const csv = reportsToCsv([buildRoutineReport(routine, history)]);
        expect(csv.startsWith("\uFEFF" + CSV_COLUMNS.join(","))).toBe(true);
        expect(csv).toContain('"Remo ""mancuerna"""');
        expect(csv.trim().split("\r\n")).toHaveLength(1 + 4);
        const parse = (line) => {
            const cells = [];
            let cur = "";
            let quoted = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (quoted) {
                    if (ch === '"' && line[i + 1] === '"') {
                        cur += '"';
                        i++;
                    } else if (ch === '"') quoted = false;
                    else cur += ch;
                } else if (ch === '"') quoted = true;
                else if (ch === ",") {
                    cells.push(cur);
                    cur = "";
                } else cur += ch;
            }
            cells.push(cur);
            return cells;
        };
        csv.trim().split("\r\n").slice(1).forEach((line) => {
            expect(parse(line)).toHaveLength(CSV_COLUMNS.length);
        });
        expect(parse(csv.trim().split("\r\n")[1])[4]).toBe('Remo "mancuerna"');
    });

    it("JSON: estructura versionada con camelCase", () => {
        const json = JSON.parse(reportsToJson([buildRoutineReport(routine, history)], NOW));
        expect(json.schemaVersion).toBe(1);
        expect(json.generatedAt).toBe(NOW.toISOString());
        const ex = json.routines[0].exercises[0];
        expect(ex.current).toEqual({ sets: 4, reps: 10, weightKg: 20, restSeconds: 60 });
        expect(ex.history).toHaveLength(2);
        expect(ex.history[0]).toMatchObject({ date: "2026-11-03", weightKg: 17.5, volumeKg: 525 });
    });

    it("Markdown: encabezados, datos actuales y tabla de histórico", () => {
        const md = reportsToMarkdown([buildRoutineReport(routine, history)], NOW);
        expect(md).toContain("# Reporte de rutinas");
        expect(md).toContain("## DÍA 3 — ESPALDA, BRAZOS");
        expect(md).toContain("**Actual:** Series: 4 · Reps: 10 · Peso: 20 kg · Descanso: 60 s");
        expect(md).toContain("| 2026-11-03 | 3 | 10 | 17.5 | 525 |");
        expect(md).toContain("_Sin historial aún._");
        const file = buildExport({ format: "md", routines: [routine], history, scope: "one", selectedRoutine: routine, now: NOW });
        expect(file.filename).toBe("reporte-dia-3-espalda-brazos-2026-11-13.md");
        expect(file.mime).toContain("text/markdown");
    });

    it("buildExportFile genera un PDF válido", async () => {
        const file = await buildExportFile({ format: "pdf", routines: [routine], history, scope: "one", selectedRoutine: routine, now: NOW });
        expect(file.filename).toBe("reporte-dia-3-espalda-brazos-2026-11-13.pdf");
        expect(file.mime).toBe("application/pdf");
        const head = await file.content.slice(0, 5).text();
        expect(head).toBe("%PDF-");
        expect(file.content.size).toBeGreaterThan(1000);
    });

    it("buildExportFile delega CSV/JSON a buildExport", async () => {
        const file = await buildExportFile({ format: "csv", routines: [routine], history, scope: "all", selectedRoutine: routine, now: NOW });
        expect(file.filename.endsWith(".csv")).toBe(true);
        expect(typeof file.content).toBe("string");
    });

    it("buildExport arma nombre de archivo y mime según formato y alcance", () => {
        const one = buildExport({ format: "csv", routines: [routine], history, scope: "one", selectedRoutine: routine, now: NOW });
        expect(one.filename).toBe("reporte-dia-3-espalda-brazos-2026-11-13.csv");
        expect(one.mime).toContain("text/csv");
        const all = buildExport({ format: "json", routines: [routine], history, scope: "all", selectedRoutine: routine, now: NOW });
        expect(all.filename).toBe("reporte-todas-las-rutinas-2026-11-13.json");
        expect(JSON.parse(all.content).routines).toHaveLength(1);
    });
});
