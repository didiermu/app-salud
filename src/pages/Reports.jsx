import { useMemo, useState } from "react";
import { useRoutineStore, useHistoryStore } from "../store/useStore";
import { sortRoutinesNewestFirst } from "../services/routineSorting";
import { buildRoutineReport } from "../services/routineReport";
import { buildExportFile, deliverFile } from "../services/reportExport";
import {
    BarChart3,
    ChevronDown,
    Download,
    TrendingUp,
    TrendingDown,
    Minus,
    Dumbbell,
} from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";

const EXPORT_FORMATS = [
    {
        id: "csv",
        label: "CSV (recomendado)",
        hint: "Para análisis: una fila por ejercicio y fecha",
    },
    { id: "json", label: "JSON", hint: "Estructura completa para scripts" },
    {
        id: "md",
        label: "Markdown (.md)",
        hint: "Texto con tablas, ideal para documentar o usar con IA",
    },
    { id: "pdf", label: "PDF", hint: "Documento listo para leer o imprimir" },
];

const formatDate = (iso) =>
    new Date(iso)
        .toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        .replace(/\./g, "")
        .replace(/\s+de\s+/g, " ");

const TrendIcon = ({ value }) => {
    if (value === "up")
        return <TrendingUp size={12} className="text-green-500" />;
    if (value === "down")
        return <TrendingDown size={12} className="text-red-400" />;
    if (value === "same")
        return <Minus size={12} className="text-neutral-300" />;
    return null;
};

const Stat = ({ label, value }) => (
    <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-center">
        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600">
            {label}
        </p>
        <p className="font-black text-neutral-900 text-lg tabular-nums">
            {value}
        </p>
    </div>
);

const Change = ({ value, unit = "" }) => (
    <span
        className={clsx(
            "text-[10px] font-black uppercase tracking-widest",
            value > 0 && "text-green-600",
            value < 0 && "text-red-500",
            value === 0 && "text-neutral-600",
        )}
    >
        {value > 0 ? "+" : ""}
        {value}
        {unit}
    </span>
);

const ExerciseReport = ({ item }) => {
    const { exercise, history, weightChange, repsChange } = item;
    return (
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-4">
                {exercise.imageUrl && (
                    <img
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        className="w-12 h-12 rounded-lg object-cover mix-blend-multiply flex-shrink-0"
                    />
                )}
                <div className="min-w-0">
                    <h4 className="font-bold text-neutral-900 capitalize">
                        {exercise.name}
                    </h4>
                    {exercise.target && (
                        <p className="text-xs text-neutral-600 uppercase font-bold tracking-tighter">
                            {exercise.target}
                        </p>
                    )}
                </div>
            </div>

            <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600 mb-2">
                    Datos actuales
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Stat label="Series" value={exercise.sets ?? "-"} />
                    <Stat label="Reps" value={exercise.reps ?? "-"} />
                    <Stat label="Peso (kg)" value={exercise.weight ?? 0} />
                    <Stat label="Descanso (s)" value={exercise.rest ?? "-"} />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600">
                        Histórico
                    </p>
                    {history.length > 1 && (
                        <div className="flex gap-3">
                            <span className="text-[10px] font-bold text-neutral-600 uppercase">
                                Peso <Change value={weightChange} unit=" kg" />
                            </span>
                            <span className="text-[10px] font-bold text-neutral-600 uppercase">
                                Reps <Change value={repsChange} />
                            </span>
                        </div>
                    )}
                </div>
                {history.length === 0 ? (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 bg-white rounded-lg px-3 py-2">
                        Sin historial aún
                    </p>
                ) : (
                    <div className="bg-white border border-neutral-100 rounded-xl overflow-x-auto">
                        <table className="w-full text-xs tabular-nums">
                            <thead>
                                <tr className="text-[9px] uppercase tracking-widest text-neutral-600 text-left">
                                    <th className="px-3 py-2 font-black">
                                        Fecha
                                    </th>
                                    <th className="px-3 py-2 font-black">
                                        Series
                                    </th>
                                    <th className="px-3 py-2 font-black">
                                        Reps
                                    </th>
                                    <th className="px-3 py-2 font-black">
                                        Peso
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {[...history].reverse().map((h, i) => (
                                    <tr key={`${h.date}-${i}`}>
                                        <td className="px-3 py-2 font-bold text-neutral-500 whitespace-nowrap">
                                            {formatDate(h.date)}
                                            {h.estimated && (
                                                <span
                                                    title="Sesión anterior sin detalle: se muestran los valores actuales de la rutina"
                                                    className="ml-1 text-neutral-300"
                                                >
                                                    *
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 font-black text-neutral-800">
                                            <span className="inline-flex items-center gap-1">
                                                {h.sets ?? "-"}
                                                <TrendIcon
                                                    value={h.setsTrend}
                                                />
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 font-black text-neutral-800">
                                            <span className="inline-flex items-center gap-1">
                                                {h.reps}
                                                <TrendIcon
                                                    value={h.repsTrend}
                                                />
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 font-black text-neutral-800">
                                            <span className="inline-flex items-center gap-1">
                                                {h.weight} kg
                                                <TrendIcon
                                                    value={h.weightTrend}
                                                />
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const Reports = () => {
    const { routines } = useRoutineStore();
    const { history } = useHistoryStore();
    const sorted = useMemo(() => sortRoutinesNewestFirst(routines), [routines]);
    const [selectedId, setSelectedId] = useState("");
    const [exportScope, setExportScope] = useState("one");
    const [menuOpen, setMenuOpen] = useState(false);
    const [format, setFormat] = useState("csv");
    const [exporting, setExporting] = useState(false);

    const activeId = selectedId || sorted[0]?.id || "";
    const routine = sorted.find((r) => r.id === activeId);
    const report = useMemo(
        () => buildRoutineReport(routine, history),
        [routine, history],
    );

    const handleExport = async (format) => {
        setMenuOpen(false);
        setExporting(true);
        try {
            const file = await buildExportFile({
                format,
                routines: sorted,
                history,
                scope: exportScope,
                selectedRoutine: routine,
            });
            await deliverFile(file);
        } finally {
            setExporting(false);
        }
    };

    if (sorted.length === 0) {
        return (
            <div className="p-12 text-center flex flex-col items-center">
                <BarChart3 size={48} className="text-neutral-200 mb-4" />
                <p className="text-neutral-900 font-bold text-lg mb-1">
                    Aún no tienes rutinas
                </p>
                <Link
                    to="/routines"
                    className="mt-4 flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest"
                >
                    <Dumbbell size={14} /> Crear rutina
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-3xl font-black text-neutral-900 uppercase tracking-tighter">
                    Reporte de rutina
                </h2>
                <div className="flex flex-col">
                    <label
                        htmlFor="report-routine"
                        className="text-[9px] font-black uppercase text-neutral-600 mb-1"
                    >
                        Rutina
                    </label>
                    <select
                        id="report-routine"
                        value={activeId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="bg-white border-2 border-neutral-100 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:border-neutral-900"
                    >
                        {sorted.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {report && (
                <>
                    <div className="flex flex-wrap items-center gap-2 bg-neutral-50 border border-neutral-100 rounded-2xl p-3">
                        <Download size={16} className="text-neutral-600 ml-1" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                            Exportar
                        </span>
                        <select
                            aria-label="Alcance de la exportación"
                            value={exportScope}
                            onChange={(e) => setExportScope(e.target.value)}
                            className="bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                        >
                            <option value="one">Esta rutina</option>
                            <option value="all">Todas las rutinas</option>
                        </select>
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen((o) => !o)}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                aria-label="Formato de exportación"
                                disabled={exporting}
                                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                            >
                                {EXPORT_FORMATS.find((f) => f.id === format)?.label}
                                <ChevronDown size={14} />
                            </button>
                            {menuOpen && (
                                <ul
                                    role="menu"
                                    className="absolute left-0 top-full mt-2 w-60 bg-white border border-neutral-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-neutral-100"
                                >
                                    {EXPORT_FORMATS.map((f) => (
                                        <li key={f.id} role="none">
                                            <button
                                                role="menuitem"
                                                onClick={() => { setFormat(f.id); setMenuOpen(false); }}
                                                className="w-full text-left px-4 py-3 hover:bg-neutral-50"
                                            >
                                                <span className="block text-xs font-black uppercase tracking-widest text-neutral-900">
                                                    {f.label}
                                                </span>
                                                <span className="block text-[10px] font-medium text-neutral-600 mt-0.5">
                                                    {f.hint}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            onClick={() => handleExport(format)}
                            disabled={exporting}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                        >
                            <Download size={14} />
                            {exporting ? "Generando..." : "Exportar"}
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Stat
                            label="Ejercicios"
                            value={report.exercises.length}
                        />
                        <Stat label="Sesiones" value={report.sessionsCount} />
                        <Stat
                            label="Última sesión"
                            value={
                                report.lastSessionDate
                                    ? formatDate(report.lastSessionDate)
                                    : "-"
                            }
                        />
                    </div>

                    <div className="space-y-4">
                        {report.exercises.length === 0 ? (
                            <p className="text-neutral-600 font-bold text-sm">
                                Esta rutina no tiene ejercicios.
                            </p>
                        ) : (
                            report.exercises.map((item, i) => (
                                <ExerciseReport
                                    key={`${item.exercise.id}-${i}`}
                                    item={item}
                                />
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;

