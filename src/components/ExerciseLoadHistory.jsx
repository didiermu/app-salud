import { useHistoryStore } from "../store/useStore";
import { TrendingUp, TrendingDown, Minus, History } from "lucide-react";
import clsx from "clsx";

const ExerciseLoadHistory = ({ exerciseName, maxEntries = 5 }) => {
    const { history } = useHistoryStore();

    const rawEntries = history
        .filter((s) => s.exercises && s.exercises.length > 0)
        .flatMap((s) =>
            s.exercises
                .filter(
                    (ex) =>
                        ex.name.toLowerCase() === exerciseName.toLowerCase(),
                )
                .map((ex) => ({
                    date: s.date,
                    weight: ex.weight || 0,
                    reps: ex.reps,
                    sets: ex.sets,
                })),
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const byDay = new Map();
    rawEntries.forEach((entry) => {
        const day = new Date(entry.date).toISOString().slice(0, 10);
        byDay.set(day, entry);
    });

    const historyEntries = [...byDay.values()].slice(-maxEntries);

    if (historyEntries.length === 0) {
        return (
            <div className="flex items-center gap-2 py-2 px-3 bg-neutral-50 rounded-lg">
                <History size={14} className="text-neutral-300" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                    Sin historial aún
                </span>
            </div>
        );
    }

    const formatDate = (iso) => {
        const d = new Date(iso);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    };

    return (
        <div className="flex items-center gap-2 py-2 px-3 bg-neutral-50 rounded-lg overflow-x-auto scrollbar-hide">
            <History size={14} className="text-neutral-400 flex-shrink-0" />
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {historyEntries.map((entry, i) => {
                    const prev = i > 0 ? historyEntries[i - 1] : null;
                    const weightTrend = prev
                        ? entry.weight > prev.weight
                            ? "up"
                            : entry.weight < prev.weight
                              ? "down"
                              : "same"
                        : null;
                    const repsTrend = prev
                        ? entry.reps > prev.reps
                            ? "up"
                            : entry.reps < prev.reps
                              ? "down"
                              : "same"
                        : null;
                    const changed =
                        prev &&
                        (entry.weight !== prev.weight ||
                            entry.reps !== prev.reps);

                    return (
                        <div
                            key={entry.date}
                            className="flex items-center gap-1"
                        >
                            <span className="text-xs font-bold text-neutral-400">
                                {formatDate(entry.date)}
                            </span>
                            <div
                                className={clsx(
                                    "px-1.5 py-0.5 rounded text-xs font-black tabular-nums flex items-center gap-0.5",
                                    changed
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-neutral-100 text-neutral-500",
                                )}
                            >
                                <span>{entry.reps} reps</span>
                                <span className="text-neutral-300">-</span>
                                <span>
                                    {entry.weight > 0
                                        ? `${entry.weight} kg`
                                        : "0kg"}
                                </span>
                            </div>
                            {weightTrend === "up" && (
                                <TrendingUp
                                    size={12}
                                    className="text-green-500"
                                />
                            )}
                            {weightTrend === "down" && (
                                <TrendingDown
                                    size={12}
                                    className="text-red-400"
                                />
                            )}
                            {repsTrend === "up" && (
                                <TrendingUp
                                    size={12}
                                    className="text-green-500"
                                />
                            )}
                            {repsTrend === "down" && (
                                <TrendingDown
                                    size={12}
                                    className="text-red-400"
                                />
                            )}
                            {!changed &&
                                weightTrend === "same" &&
                                repsTrend === "same" && (
                                    <Minus
                                        size={12}
                                        className="text-neutral-300"
                                    />
                                )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ExerciseLoadHistory;
