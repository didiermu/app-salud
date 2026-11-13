import { buildRoutineReport } from "./routineReport";

/**
 * Exportación del reporte.
 *
 * Formato recomendado para análisis: CSV "largo" (tidy data), una fila por
 * ejercicio y fecha. Se abre directo en Excel/Sheets y se carga con
 * pandas, R o cualquier herramienta de BI sin transformar. Fechas ISO
 * 8601, punto decimal, columnas con nombre estable en snake_case.
 *
 * También se ofrece JSON (estructura anidada) para reutilizar el reporte
 * completo en scripts o futuras integraciones.
 */

export const CSV_COLUMNS = [
    "record_type", // history | current
    "routine_id",
    "routine_name",
    "exercise_id",
    "exercise_name",
    "target",
    "date", // YYYY-MM-DD (vacío en current)
    "sets",
    "reps",
    "weight_kg",
    "volume_kg", // sets * reps * weight_kg
    "rest_s",
    "is_estimated", // true: sesión antigua sin detalle
];

const csvCell = (value) => {
    if (value === null || value === undefined) return "";
    const s = String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const volume = (sets, reps, weight) => {
    const s = Number(sets);
    const r = Number(reps);
    const w = Number(weight);
    if (![s, r, w].every(Number.isFinite)) return "";
    return Math.round(s * r * w * 100) / 100;
};

const isoDay = (iso) => new Date(iso).toISOString().slice(0, 10);

/** Filas planas de un reporte de rutina. */
export const reportToRows = (report) => {
    const rows = [];
    const { routine } = report;
    report.exercises.forEach(({ exercise, history }) => {
        const base = {
            routine_id: routine.id,
            routine_name: routine.name,
            exercise_id: exercise.id,
            exercise_name: exercise.name,
            target: exercise.target ?? "",
        };
        rows.push({
            ...base,
            record_type: "current",
            date: "",
            sets: exercise.sets ?? "",
            reps: exercise.reps ?? "",
            weight_kg: exercise.weight ?? 0,
            volume_kg: volume(exercise.sets, exercise.reps, exercise.weight ?? 0),
            rest_s: exercise.rest ?? "",
            is_estimated: "",
        });
        history.forEach((h) => {
            rows.push({
                ...base,
                record_type: "history",
                date: isoDay(h.date),
                sets: h.sets ?? "",
                reps: h.reps ?? "",
                weight_kg: h.weight ?? 0,
                volume_kg: volume(h.sets, h.reps, h.weight ?? 0),
                rest_s: "",
                is_estimated: Boolean(h.estimated),
            });
        });
    });
    return rows;
};

/** CSV con BOM UTF-8 para que Excel respete los acentos. */
export const reportsToCsv = (reports) => {
    const lines = [CSV_COLUMNS.join(",")];
    reports.forEach((report) => {
        reportToRows(report).forEach((row) => {
            lines.push(CSV_COLUMNS.map((c) => csvCell(row[c])).join(","));
        });
    });
    return `\uFEFF${lines.join("\r\n")}\r\n`;
};

export const reportsToJson = (reports, now = new Date()) =>
    JSON.stringify(
        {
            schemaVersion: 1,
            generatedAt: now.toISOString(),
            routines: reports.map((report) => ({
                id: report.routine.id,
                name: report.routine.name,
                sessionsCount: report.sessionsCount,
                lastSessionDate: report.lastSessionDate,
                exercises: report.exercises.map(({ exercise, history }) => ({
                    id: exercise.id,
                    name: exercise.name,
                    target: exercise.target ?? null,
                    current: {
                        sets: exercise.sets ?? null,
                        reps: exercise.reps ?? null,
                        weightKg: exercise.weight ?? 0,
                        restSeconds: exercise.rest ?? null,
                    },
                    history: history.map((h) => ({
                        date: isoDay(h.date),
                        sets: h.sets ?? null,
                        reps: h.reps ?? null,
                        weightKg: h.weight ?? 0,
                        volumeKg: volume(h.sets, h.reps, h.weight ?? 0),
                        isEstimated: Boolean(h.estimated),
                    })),
                })),
            })),
        },
        null,
        2,
    );

const mdCell = (v) => String(v ?? "-").replace(/\|/g, "\\|");
const mdDate = (iso) => new Date(iso).toISOString().slice(0, 10);

/** Markdown legible, con tablas GFM por rutina y ejercicio. */
export const reportsToMarkdown = (reports, now = new Date()) => {
    const out = [
        "# Reporte de rutinas",
        "",
        `Generado: ${mdDate(now)}`,
        "",
    ];
    reports.forEach((report) => {
        out.push(
            `## ${mdCell(report.routine.name)}`,
            "",
            `- Sesiones registradas: ${report.sessionsCount}`,
            `- Última sesión: ${report.lastSessionDate ? mdDate(report.lastSessionDate) : "-"}`,
            "",
        );
        report.exercises.forEach(({ exercise: ex, history }) => {
            out.push(
                `### ${mdCell(ex.name)}`,
                "",
                `**Actual:** Series: ${ex.sets ?? "-"} · Reps: ${ex.reps ?? "-"} · Peso: ${ex.weight ?? 0} kg · Descanso: ${ex.rest ?? "-"} s`,
                "",
            );
            if (history.length === 0) {
                out.push("_Sin historial aún._", "");
                return;
            }
            out.push(
                "| Fecha | Series | Reps | Peso (kg) | Volumen (kg) |",
                "| --- | ---: | ---: | ---: | ---: |",
            );
            history.forEach((h) => {
                out.push(
                    `| ${mdDate(h.date)}${h.estimated ? " *" : ""} | ${mdCell(h.sets)} | ${mdCell(h.reps)} | ${h.weight ?? 0} | ${volume(h.sets, h.reps, h.weight ?? 0) || 0} |`,
                );
            });
            out.push("");
        });
        out.push(
            "\\* Sesión anterior sin detalle: se usan los valores actuales de la rutina.",
            "",
        );
    });
    return out.join("\n");
};

const slug = (text) =>
    String(text)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "reporte";

export const buildExport = ({
    format,
    routines,
    history,
    scope,
    selectedRoutine,
    now = new Date(),
}) => {
    const source = scope === "all" ? routines : [selectedRoutine];
    const reports = source
        .filter(Boolean)
        .map((r) => buildRoutineReport(r, history));
    const day = now.toISOString().slice(0, 10);
    const name =
        scope === "all" ? "todas-las-rutinas" : slug(selectedRoutine?.name);
    const FILES = {
        csv: { ext: "csv", mime: "text/csv;charset=utf-8" },
        json: { ext: "json", mime: "application/json" },
        md: { ext: "md", mime: "text/markdown;charset=utf-8" },
    };
    const file = FILES[format] || FILES.json;
    const builders = {
        csv: () => reportsToCsv(reports),
        md: () => reportsToMarkdown(reports, now),
        json: () => reportsToJson(reports, now),
    };
    return {
        filename: `reporte-${name}-${day}.${file.ext}`,
        mime: file.mime,
        content: (builders[format] || builders.json)(),
    };
};

const isMobileDevice = () =>
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

/**
 * Entrega el archivo según la plataforma:
 *  1. Escritorio con File System Access API (Chrome/Edge): abre la ventana
 *     "Guardar como".
 *  2. Móvil: hoja de compartir del sistema.
 *  3. Resto (Safari/Firefox de escritorio): descarga directa del navegador.
 */
export const deliverFile = async ({ filename, mime, content }) => {
    const file = new File([content], filename, { type: mime });

    if (typeof window.showSaveFilePicker === "function") {
        try {
            const ext = filename.slice(filename.lastIndexOf("."));
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [
                    {
                        description: filename,
                        accept: { [mime.split(";")[0]]: [ext] },
                    },
                ],
            });
            const writable = await handle.createWritable();
            await writable.write(file);
            await writable.close();
            return;
        } catch (err) {
            if (err?.name === "AbortError") return;
            // Sin activación de usuario u otro fallo: cae a la descarga.
        }
    } else if (isMobileDevice() && navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: filename });
            return;
        } catch (err) {
            if (err?.name === "AbortError") return;
        }
    }

    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};


const formatPdfDate = (iso) =>
    new Date(iso)
        .toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        .replace(/\./g, '')
        .replace(/\s+de\s+/g, ' ');

/** Genera el PDF del reporte (carga jsPDF solo cuando se necesita). */
export const reportsToPdfBlob = async (reports, now = new Date()) => {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
    ]);
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 40;
    let first = true;

    reports.forEach((report) => {
        if (!first) pdf.addPage();
        first = false;
        let y = 50;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.text(report.routine.name, left, y);
        y += 18;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        pdf.text(
            'Generado: ' + formatPdfDate(now) +
                '  |  Sesiones: ' + report.sessionsCount +
                '  |  Ultima sesion: ' +
                (report.lastSessionDate ? formatPdfDate(report.lastSessionDate) : '-'),
            left,
            y
        );
        pdf.setTextColor(0);
        y += 14;

        autoTable(pdf, {
            startY: y,
            head: [['Ejercicio', 'Series', 'Reps', 'Peso (kg)', 'Descanso (s)']],
            body: report.exercises.map(({ exercise: ex }) => [
                ex.name,
                ex.sets ?? '-',
                ex.reps ?? '-',
                ex.weight ?? 0,
                ex.rest ?? '-',
            ]),
            headStyles: { fillColor: [23, 23, 23] },
            styles: { fontSize: 9 },
            theme: 'grid',
        });

        report.exercises.forEach(({ exercise: ex, history }) => {
            const startY = pdf.lastAutoTable.finalY + 18;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            const needsSpace = startY > pdf.internal.pageSize.getHeight() - 90;
            if (needsSpace) pdf.addPage();
            const titleY = needsSpace ? 50 : startY;
            pdf.text('Historico - ' + ex.name, left, titleY);
            autoTable(pdf, {
                startY: titleY + 6,
                head: [['Fecha', 'Series', 'Reps', 'Peso (kg)', 'Volumen (kg)']],
                body: history.length
                    ? history.map((h) => [
                          formatPdfDate(h.date) + (h.estimated ? ' *' : ''),
                          h.sets ?? '-',
                          h.reps ?? '-',
                          h.weight ?? 0,
                          volume(h.sets, h.reps, h.weight ?? 0),
                      ])
                    : [['Sin historial aun', '', '', '', '']],
                headStyles: { fillColor: [115, 115, 115] },
                styles: { fontSize: 8 },
                theme: 'striped',
            });
        });
    });

    return pdf.output('blob');
};

/** Igual que buildExport pero también soporta PDF (asíncrono). */
export const buildExportFile = async (opts) => {
    if (opts.format !== 'pdf') return buildExport(opts);
    const { routines, history, scope, selectedRoutine, now = new Date() } = opts;
    const source = scope === 'all' ? routines : [selectedRoutine];
    const reports = source.filter(Boolean).map((r) => buildRoutineReport(r, history));
    const name = scope === 'all' ? 'todas-las-rutinas' : slug(selectedRoutine?.name);
    return {
        filename: 'reporte-' + name + '-' + now.toISOString().slice(0, 10) + '.pdf',
        mime: 'application/pdf',
        content: await reportsToPdfBlob(reports, now),
    };
};
