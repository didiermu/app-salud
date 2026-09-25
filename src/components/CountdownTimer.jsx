import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Timer, ChevronUp, ChevronDown } from "lucide-react";
import clsx from "clsx";

const CountdownTimer = () => {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isConfiguring, setIsConfiguring] = useState(true);
    const intervalRef = useRef(null);

    const initialTotal = hours * 3600 + minutes * 60 + seconds;

    useEffect(() => {
        if (isRunning && totalSeconds > 0) {
            intervalRef.current = setInterval(() => {
                setTotalSeconds((prev) => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current);
                        setIsRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    const handleStart = () => {
        if (totalSeconds === 0 && initialTotal > 0) {
            setTotalSeconds(initialTotal);
            setIsConfiguring(false);
        }
        setIsRunning(true);
        setIsConfiguring(false);
    };

    const handlePause = () => {
        setIsRunning(false);
    };

    const handleReset = () => {
        setIsRunning(false);
        setTotalSeconds(0);
        setIsConfiguring(true);
    };

    const handleResume = () => {
        if (totalSeconds > 0) {
            setIsRunning(true);
        }
    };

    const adjustValue = (setter, value, min, max, delta) => {
        const newVal = Math.min(max, Math.max(min, value + delta));
        setter(newVal);
    };

    const formatTime = (total) => {
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        return { h, m, s };
    };

    const { h, m, s } = formatTime(totalSeconds);
    const progress = initialTotal > 0 ? ((initialTotal - totalSeconds) / initialTotal) * 100 : 0;
    const isFinished = totalSeconds === 0 && !isConfiguring && !isRunning;

    return (
        <div className={clsx(
            "rounded-2xl p-4 transition-all duration-500",
            isRunning ? "bg-blue-600 text-white" :
            isFinished ? "bg-green-500 text-white" :
            "bg-transparent"
        )}>
            <div className="flex items-center gap-2 mb-6">
                <Timer size={20} className={clsx(
                    isRunning ? "text-blue-200" : isFinished ? "text-green-200" : "text-neutral-400"
                )} />
                <h4 className={clsx(
                    "text-[10px] font-black uppercase tracking-widest",
                    isRunning ? "text-blue-200" : isFinished ? "text-green-200" : "text-neutral-400"
                )}>
                    Cronómetro
                </h4>
                {isRunning && (
                    <span className="ml-auto flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-200">Activo</span>
                    </span>
                )}
                {isFinished && (
                    <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-green-200">¡Listo!</span>
                )}
            </div>

            {isConfiguring ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-center gap-2">
                        {/* Hours */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => adjustValue(setHours, hours, 0, 23, 1)}
                                className={clsx(
                                    "p-2 rounded-xl transition-all active:scale-95",
                                    "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                )}
                            >
                                <ChevronUp size={18} />
                            </button>
                            <div className="bg-neutral-50 border-2 border-neutral-100 rounded-2xl w-20 h-24 flex items-center justify-center">
                                <span className="text-4xl font-black text-neutral-900 tabular-nums">
                                    {String(hours).padStart(2, "0")}
                                </span>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Hrs</span>
                            <button
                                onClick={() => adjustValue(setHours, hours, 0, 23, -1)}
                                className={clsx(
                                    "p-2 rounded-xl transition-all active:scale-95",
                                    "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                )}
                            >
                                <ChevronDown size={18} />
                            </button>
                        </div>

                        <span className="text-4xl font-black text-neutral-300 mt-[-10px]">:</span>

                        {/* Minutes */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => adjustValue(setMinutes, minutes, 0, 59, 1)}
                                className={clsx(
                                    "p-2 rounded-xl transition-all active:scale-95",
                                    "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                )}
                            >
                                <ChevronUp size={18} />
                            </button>
                            <div className="bg-neutral-50 border-2 border-neutral-100 rounded-2xl w-20 h-24 flex items-center justify-center">
                                <span className="text-4xl font-black text-neutral-900 tabular-nums">
                                    {String(minutes).padStart(2, "0")}
                                </span>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Min</span>
                            <button
                                onClick={() => adjustValue(setMinutes, minutes, 0, 59, -1)}
                                className={clsx(
                                    "p-2 rounded-xl transition-all active:scale-95",
                                    "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                )}
                            >
                                <ChevronDown size={18} />
                            </button>
                        </div>

                        <span className="text-4xl font-black text-neutral-300 mt-[-10px]">:</span>

                        {/* Seconds */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => adjustValue(setSeconds, seconds, 0, 59, 5)}
                                className={clsx(
                                    "p-2 rounded-xl transition-all active:scale-95",
                                    "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                )}
                            >
                                <ChevronUp size={18} />
                            </button>
                            <div className="bg-neutral-50 border-2 border-neutral-100 rounded-2xl w-20 h-24 flex items-center justify-center">
                                <span className="text-4xl font-black text-neutral-900 tabular-nums">
                                    {String(seconds).padStart(2, "0")}
                                </span>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Seg</span>
                            <button
                                onClick={() => adjustValue(setSeconds, seconds, 0, 59, -5)}
                                className={clsx(
                                    "p-2 rounded-xl transition-all active:scale-95",
                                    "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                )}
                            >
                                <ChevronDown size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Quick presets */}
                    <div className="flex gap-2 justify-center">
                        {[
                            { label: "30s", h: 0, m: 0, s: 30 },
                            { label: "1m", h: 0, m: 1, s: 0 },
                            { label: "3m", h: 0, m: 3, s: 0 },
                            { label: "5m", h: 0, m: 5, s: 0 },
                            { label: "10m", h: 0, m: 10, s: 0 },
                        ].map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => { setHours(preset.h); setMinutes(preset.m); setSeconds(preset.s); }}
                                className={clsx(
                                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                    hours === preset.h && minutes === preset.m && seconds === preset.s
                                        ? "bg-neutral-900 text-white"
                                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                                )}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={initialTotal === 0}
                        className="w-full py-4 bg-neutral-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-xl shadow-neutral-200"
                    >
                        <Play size={16} /> Iniciar Cronómetro
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Time display */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                            <span className={clsx(
                                "text-7xl font-black tabular-nums tracking-tighter",
                                isRunning ? "text-white" : isFinished ? "text-white" : "text-neutral-900"
                            )}>
                                {String(h).padStart(2, "0")}
                            </span>
                            <span className={clsx(
                                "text-7xl font-black tabular-nums",
                                isRunning ? "text-blue-300 animate-pulse" : isFinished ? "text-green-300 animate-pulse" : "text-neutral-300"
                            )}>:</span>
                            <span className={clsx(
                                "text-7xl font-black tabular-nums tracking-tighter",
                                isRunning ? "text-white" : isFinished ? "text-white" : "text-neutral-900"
                            )}>
                                {String(m).padStart(2, "0")}
                            </span>
                            <span className={clsx(
                                "text-7xl font-black tabular-nums",
                                isRunning ? "text-blue-300 animate-pulse" : isFinished ? "text-green-300 animate-pulse" : "text-neutral-300"
                            )}>:</span>
                            <span className={clsx(
                                "text-7xl font-black tabular-nums tracking-tighter",
                                isRunning ? "text-white" : isFinished ? "text-white" : "text-neutral-900"
                            )}>
                                {String(s).padStart(2, "0")}
                            </span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className={clsx(
                        "h-2 rounded-full overflow-hidden",
                        isRunning ? "bg-blue-500/30" : isFinished ? "bg-green-500/30" : "bg-neutral-100"
                    )}>
                        <div
                            className={clsx(
                                "h-full rounded-full transition-all duration-1000",
                                isRunning ? "bg-white" : isFinished ? "bg-white" : "bg-neutral-900"
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex gap-3">
                        {isRunning ? (
                            <button
                                onClick={handlePause}
                                className="flex-1 py-4 bg-white/20 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-white/30 transition-all active:scale-95"
                            >
                                <Pause size={16} /> Pausar
                            </button>
                        ) : (
                            <button
                                onClick={totalSeconds > 0 ? handleResume : handleStart}
                                className="flex-1 py-4 bg-white text-neutral-900 font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-neutral-100 transition-all active:scale-95 shadow-xl"
                            >
                                <Play size={16} /> {totalSeconds > 0 ? "Reanudar" : "Iniciar"}
                            </button>
                        )}
                        <button
                            onClick={handleReset}
                            className={clsx(
                                "p-4 rounded-2xl flex items-center justify-center transition-all active:scale-95",
                                isRunning || isFinished
                                    ? "bg-white/20 text-white hover:bg-white/30"
                                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                            )}
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CountdownTimer;
