import { useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, Dumbbell, Zap, BarChart3, Scale } from 'lucide-react';
import { getCoachAdvice } from '../services/routineAnalyzer';
import { useRoutineStore, useHistoryStore, useUserStore } from '../store/useStore';
import clsx from 'clsx';

const ICON_MAP = {
  warning: <AlertTriangle size={16} className="text-orange-500" />,
  success: <CheckCircle size={16} className="text-green-500" />,
  suggestion: <Sparkles size={16} className="text-blue-500" />,
  tip: <Lightbulb size={16} className="text-yellow-500" />,
  variation: <TrendingUp size={16} className="text-purple-500" />,
  info: <Brain size={16} className="text-neutral-500" />,
  progression: <Dumbbell size={16} className="text-blue-600" />,
  achievement: <Zap size={16} className="text-green-600" />,
};

const COLOR_MAP = {
  warning: 'border-orange-200 bg-orange-50/50',
  success: 'border-green-200 bg-green-50/50',
  suggestion: 'border-blue-200 bg-blue-50/50',
  tip: 'border-yellow-200 bg-yellow-50/50',
  variation: 'border-purple-200 bg-purple-50/50',
  info: 'border-neutral-200 bg-neutral-50/50',
  progression: 'border-blue-200 bg-blue-50/50',
  achievement: 'border-green-200 bg-green-50/50',
};

const CoachWidget = () => {
  const { routines } = useRoutineStore();
  const { history } = useHistoryStore();
  const { profile } = useUserStore();
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const result = getCoachAdvice(routines, history, profile);
    setAdvice(result);
    setLoading(false);
  }, [routines, history, profile]);

  if (loading || !advice) return null;

  const { suggestions, summary, progression } = advice;

  return (
    <div className="bg-white border-2 border-neutral-100 rounded-[2rem] overflow-hidden shadow-sm">
      <div className="bg-neutral-900 px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-white font-black text-sm uppercase tracking-widest">Tu Coach IA</h3>
          <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Análisis personalizado</p>
        </div>
      </div>

      {summary && (
        <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Dumbbell size={12} className="text-neutral-400" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Último</p>
                <p className="text-xs font-black text-neutral-900 truncate">{summary.lastWorkout || 'Sin datos'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 size={12} className="text-neutral-400" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Frecuencia</p>
                <p className="text-xs font-black text-neutral-900">{summary.frequency || 0} x/sem</p>
              </div>
            </div>
            {summary.exercisesTracked > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <Zap size={12} className="text-blue-500" />
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Ejercicios</p>
                    <p className="text-xs font-black text-neutral-900">{summary.exercisesTracked} seguimiento</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={12} className="text-green-500" />
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Progresiones</p>
                    <p className="text-xs font-black text-neutral-900">{summary.progressionsCount} subidas</p>
                  </div>
                </div>
              </>
            )}
            {summary.bodyWeight > 0 && (
              <div className="flex items-center gap-2">
                <Scale size={12} className="text-neutral-400" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Peso</p>
                  <p className="text-xs font-black text-neutral-900">
                    {summary.bodyWeight} kg
                    {summary.bodyWeightChange && (
                      <span className={clsx(
                        "ml-1 text-[10px]",
                        Number(summary.bodyWeightChange) > 0 ? "text-red-500" : "text-green-500"
                      )}>
                        {Number(summary.bodyWeightChange) > 0 ? '+' : ''}{summary.bodyWeightChange}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
            {summary.totalVolume > 0 && (
              <div className="flex items-center gap-2">
                <BarChart3 size={12} className="text-blue-500" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Volumen Total</p>
                  <p className="text-xs font-black text-neutral-900">{(summary.totalVolume / 1000).toFixed(1)}k kg</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {suggestions.length === 0 ? (
          <div className="p-4 rounded-2xl border-2 border-neutral-200 bg-neutral-50/50">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0"><Brain size={16} className="text-neutral-400" /></div>
              <div>
                <h4 className="font-black text-neutral-900 text-sm uppercase tracking-tight">Sigue entrenando</h4>
                <p className="text-neutral-600 text-xs font-medium mt-1 leading-relaxed">
                  Registra más sesiones con datos de ejercicios para obtener análisis de progresión.
                </p>
              </div>
            </div>
          </div>
        ) : (
          suggestions.map((s, i) => (
            <div
              key={i}
              className={clsx(
                "p-4 rounded-2xl border-2 transition-all",
                COLOR_MAP[s.type] || COLOR_MAP.info
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{ICON_MAP[s.type] || ICON_MAP.info}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-neutral-900 text-sm uppercase tracking-tight">{s.title}</h4>
                  <p className="text-neutral-600 text-xs font-medium mt-1 leading-relaxed">{s.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {progression && progression.stagnations.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
            <h4 className="font-black text-yellow-800 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertTriangle size={14} /> Ejercicios estancados
            </h4>
            <div className="space-y-1.5">
              {progression.stagnations.slice(0, 3).map((ex, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-yellow-900 truncate flex-1">{ex.name}</span>
                  <span className="text-yellow-700 font-medium ml-2">{ex.currentWeight}kg x {ex.currentReps}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachWidget;
