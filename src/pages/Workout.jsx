import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoutineStore } from '../store/useStore';
import { Play, Pause, ChevronRight, CheckCircle2, Timer as TimerIcon, Dumbbell, Trophy } from 'lucide-react';
import Modal from '../components/Modal';
import ExerciseLoadHistory from '../components/ExerciseLoadHistory';
import clsx from 'clsx';

const Workout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { routines, updateRoutineExercises } = useRoutineStore();

  const routine = routines.find(r => r.id === id);
  
  // 1. APLANAR LA RUTINA EN FORMATO CIRCUITO (LOOP)
  const workoutSteps = useMemo(() => {
    if (!routine || routine.exercises.length === 0) return [];
    
    const steps = [];
    const maxSets = Math.max(...routine.exercises.map(ex => ex.sets));

    for (let s = 1; s <= maxSets; s++) {
      routine.exercises.forEach((ex) => {
        if (s <= ex.sets) {
          steps.push({
            ...ex,
            currentSet: s,
            totalSets: ex.sets,
            round: s
          });
        }
      });
    }
    return steps;
  }, [routine]);

  const [currentSteps, setCurrentSteps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isExerciseTimer, setIsExerciseTimer] = useState(false);
  
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null });
  const videoRef = useRef(null);
  const gridRef = useRef(null);
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const updateDims = () => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const isDesktop = window.innerWidth >= 1024;
      const colWidth = isDesktop ? rect.width * 7 / 12 : rect.width;
      const availableH = window.innerHeight - rect.top - 24;
      const h916 = colWidth * 16 / 9;
      if (h916 <= availableH) {
        setVideoDims({ w: colWidth, h: h916 });
      } else {
        setVideoDims({ w: availableH * 9 / 16, h: availableH });
      }
    };
    updateDims();
    const observer = new ResizeObserver(updateDims);
    if (gridRef.current) observer.observe(gridRef.current);
    window.addEventListener('resize', updateDims);
    return () => { observer.disconnect(); window.removeEventListener('resize', updateDims); };
  }, []);

  // Sincronizar steps locales para permitir edición
  useEffect(() => {
    if (workoutSteps.length > 0 && currentSteps.length === 0) {
      setCurrentSteps(workoutSteps);
    }
  }, [workoutSteps, currentSteps.length]);

  const currentStep = currentSteps[currentStepIdx];
  const nextStep = currentSteps[currentStepIdx + 1];

  // Auto-play video logic to ensure both data URLs and remote URLs play when mounted/changed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.warn("Autoplay was prevented:", error);
      });
    }
  }, [currentStepIdx, isResting, isExerciseTimer, currentStep?.videoUrl, nextStep?.videoUrl]);

  // Referencia para el scroll automático del timeline
  const timelineRef = useRef(null);
  useEffect(() => {
    if (timelineRef.current) {
      const activeBtn = timelineRef.current.querySelector('.active-step');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentStepIdx]);

  const updateCurrentStepData = (field, value) => {
    setCurrentSteps(prev => {
      const next = prev.map((step, idx) => 
        idx === currentStepIdx ? { ...step, [field]: value } : step
      );

      if (field === 'reps' || field === 'weight' || field === 'notes') {
        const exId = next[currentStepIdx].id;
        return next.map((step, idx) =>
          idx > currentStepIdx && step.id === exId ? { ...step, [field]: value } : step
        );
      }

      if (field === 'totalSets') {
        const exId = next[currentStepIdx].id;
        const before = next.slice(0, currentStepIdx);
        const after = next.slice(currentStepIdx + 1);
        const cur = { ...next[currentStepIdx], totalSets: value };

        const afterWithoutEx = after.filter(s => s.id !== exId || s.round > value);

        let rebuilt = [];
        const exercises = routine.exercises;
        const maxSets = Math.max(...exercises.map(ex => ex.id === exId ? value : ex.sets));

        for (let s = 1; s <= maxSets; s++) {
          for (const ex of exercises) {
            const exSets = ex.id === exId ? value : ex.sets;
            if (s <= exSets) {
              const existing = [...before, cur, ...afterWithoutEx].find(
                step => step.id === ex.id && step.round === s
              );
              rebuilt.push(existing || {
                ...ex,
                currentSet: s,
                totalSets: exSets,
                round: s
              });
            }
          }
        }

        const curIdx = rebuilt.findIndex(s => s.id === cur.id && s.round === cur.round);
        if (curIdx >= 0) {
          const moved = rebuilt.splice(curIdx, 1)[0];
          rebuilt.splice(currentStepIdx, 0, moved);
        }

        return rebuilt;
      }

      return next;
    });
  };

  const syncRoutine = useCallback(() => {
    if (!routine) return;
    const seen = new Set();
    const unique = currentSteps
      .filter(step => {
        if (seen.has(step.id)) return false;
        seen.add(step.id);
        return true;
      })
      .map(step => ({
        id: step.id,
        sets: step.totalSets || step.sets,
        reps: step.reps,
        weight: step.weight || 0,
        rest: step.rest,
        notes: step.notes || '',
      }));
    updateRoutineExercises(routine.id, unique);
  }, [routine, currentSteps, updateRoutineExercises]);

  const finishWorkout = useCallback((isAbandoning = false) => {
    if (isAbandoning) {
       navigate('/');
    } else {
      syncRoutine();

      setModal({
        isOpen: true, type: 'success', title: '¡Misión Cumplida!',
        message: 'Entrenamiento finalizado. ¡Buen trabajo!',
        onConfirm: () => {
          setModal({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null });
          navigate('/');
        }
      });
    }
  }, [navigate, syncRoutine]);

  const handleNextStep = useCallback(() => {
    if (currentStepIdx < currentSteps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      finishWorkout();
    }
  }, [currentStepIdx, currentSteps.length, finishWorkout]);

  const skipRest = useCallback(() => {
    setIsActive(false);
    setIsResting(false);
    setIsExerciseTimer(false);
    setTimeLeft(0);
    handleNextStep();
  }, [handleNextStep]);

  // Temporizador
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      if (isResting || isExerciseTimer) {
        skipRest();
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isResting, isExerciseTimer, skipRest]);

  const startRest = () => {
    syncRoutine();
    const isLastStep = currentStepIdx === currentSteps.length - 1;
    if (currentStep.rest > 0 && !isLastStep) {
      setTimeLeft(currentStep.rest);
      setIsResting(true);
      setIsActive(true);
    } else {
      handleNextStep();
    }
  };

  const startExerciseTimer = () => {
    setTimeLeft(currentStep.timerDuration || 60); 
    setIsExerciseTimer(true);
    setIsActive(true);
  };

  if (!routine || currentSteps.length === 0) return <div className="p-20 text-center font-bold text-neutral-600">Preparando rutina...</div>;

  const activeStep = (isResting && nextStep ? nextStep : currentStep);

  const renderMedia = () => {
    const videoUrl = activeStep?.videoUrl;
    
    if (videoUrl) {
      // Detectar si es YouTube o YouTube Shorts
      const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
      const isYouTubeShort = videoUrl.includes('/shorts/');
      
      // Detectar TikTok
      const isTikTok = videoUrl.includes('tiktok.com');
      
      // Detectar Instagram Reels
      const isInstagram = videoUrl.includes('instagram.com/reel') || videoUrl.includes('instagram.com/p/');

      if (isYouTube) {
        let embedId = '';
        if (isYouTubeShort) {
          embedId = videoUrl.split('/shorts/')[1]?.split('?')[0];
        } else if (videoUrl.includes('v=')) {
          embedId = videoUrl.split('v=')[1]?.split('&')[0];
        } else if (videoUrl.includes('youtu.be/')) {
          embedId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
        }

        return (
          <iframe
            key={activeStep.id}
            src={`https://www.youtube.com/embed/${embedId}?autoplay=1&mute=1&loop=1&playlist=${embedId}&playsinline=1`}
            className="w-full h-full border-none"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        );
      }

      if (isTikTok) {
        // Extraer el ID del video de TikTok (usualmente después de /video/)
        const videoIdMatch = videoUrl.match(/\/video\/(\d+)/);
        const embedId = videoIdMatch ? videoIdMatch[1] : '';
        
        if (embedId) {
          return (
            <iframe
              key={activeStep.id}
              src={`https://www.tiktok.com/embed/v2/${embedId}`}
              className="w-full h-full border-none"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          );
        }
      }

      if (isInstagram) {
        // Convertir la URL de Instagram a su formato embed añadiendo embed a la url
        const cleanUrl = videoUrl.split('?')[0].replace(/\/$/, ''); // Remover trailing slash y queries
        return (
          <iframe
            key={activeStep.id}
            src={`${cleanUrl}/embed`}
            className="w-full h-full border-none"
            allow="autoplay; encrypted-media"
            allowFullScreen
            scrolling="no"
          />
        );
      }

      return (
        <video 
          ref={videoRef}
          key={activeStep.id}
          src={videoUrl} 
          className="w-full h-full object-cover" 
          autoPlay 
          loop 
          muted 
          playsInline
        />
      );
    }

    if (activeStep?.imageUrl) {
      return (
        <img 
          key={activeStep.id}
          src={activeStep.imageUrl} 
          alt={activeStep.name} 
          className="w-full h-full object-cover mix-blend-multiply" 
        />
      );
    }

    return <div className="w-full h-full flex items-center justify-center text-neutral-600"><Dumbbell size={60} /></div>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3 pb-6 px-4">
      
      {/* TRACKER DE PROGRESO INTERACTIVO */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-3 shadow-sm overflow-hidden">
        <div ref={timelineRef} className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {currentSteps.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={`${step.id}-${idx}`} className="flex items-center gap-3 flex-shrink-0">
                <button 
                  onClick={() => {
                    setCurrentStepIdx(idx);
                    setIsResting(false);
                    setIsExerciseTimer(false);
                    setIsActive(false);
                  }}
                  className={clsx(
                    "flex flex-col items-center gap-1 group transition-all",
                    isCurrent && "active-step"
                  )}
                >
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                    isCompleted ? "bg-green-500 border-green-200 text-white" :
                    isCurrent ? "bg-neutral-900 border-neutral-200 text-white scale-105 shadow-lg" :
                    "bg-neutral-200 border-transparent text-neutral-600 hover:bg-neutral-200"
                  )}>
                    {isCompleted ? <CheckCircle2 size={14} /> : 
                     isCurrent ? <Dumbbell size={14} className="animate-pulse" /> : 
                     <span className="text-[10px] font-bold">{idx + 1}</span>}
                  </div>
                  <span className={clsx(
                    "text-[10px] font-bold uppercase tracking-tight max-w-[50px] text-center truncate",
                    isCurrent ? "text-neutral-900" : "text-neutral-600"
                  )}>
                    S{step.currentSet}
                  </span>
                </button>
                {idx < currentSteps.length - 1 && (
                  <div className={clsx(
                    "w-6 h-[1px] rounded-full mb-4",
                    idx < currentStepIdx ? "bg-green-500" : "bg-neutral-200"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* TARJETA PRINCIPAL (BANNER) */}
        <div className={clsx(
          "lg:col-span-7 bg-white border border-neutral-200 overflow-hidden rounded-2xl flex items-center justify-center transition-all duration-700 shadow-xl",
          isResting ? "border-green-500 scale-[1.02]" : isExerciseTimer ? "border-blue-600 shadow-blue-200" : "border-neutral-900"
        )}>
          <div style={{ width: videoDims.w ? `${videoDims.w}px` : '100%', height: videoDims.h ? `${videoDims.h}px` : undefined }} className="bg-neutral-200 relative overflow-hidden">
            {renderMedia()}
            <div className="absolute top-4 left-4 flex gap-2">
               <span className={clsx(
                 "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg transition-colors",
                 isResting ? "bg-green-500 text-white" : "bg-black text-white"
               )}>
                 {isResting ? 'Prepárate' : isExerciseTimer ? 'En Tiempo' : 'Activo'}
               </span>
               <span className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg">
                 S{activeStep.currentSet} / {activeStep.totalSets}
               </span>
            </div>
          </div>
        </div>

        {/* COLUMNA DE CONTROL */}
        <div className="lg:col-span-5 space-y-3 flex flex-col">
          
          {/* TIMER CARD */}
          <div className={clsx(
            "rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 transition-all duration-500 border",
            isResting ? "bg-neutral-900 text-white border-neutral-900 shadow-xl" : 
            isExerciseTimer ? "bg-blue-600 text-white border-blue-600 shadow-xl" :
            "bg-neutral-200 text-neutral-600 border-transparent"
          )}>
            <TimerIcon size={isResting || isExerciseTimer ? 28 : 22} className={clsx((isResting || isExerciseTimer) && "animate-pulse text-green-400")} />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-0.5 opacity-60">
                {isResting ? "Descanso" : isExerciseTimer ? "Ejercicio" : "Timer"}
              </p>
              <p className="text-5xl font-bold tracking-tighter tabular-nums">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </p>
            </div>

            {(isResting || isExerciseTimer) && (
              <div className="flex gap-2 w-full">
                <button onClick={() => setIsActive(!isActive)} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-xl border border-white/10 flex items-center justify-center">
                  {isActive ? <Pause size={16}/> : <Play size={16}/>}
                </button>
                <button onClick={skipRest} className="flex-[2] py-2 bg-white text-neutral-900 font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-neutral-200 transition-all shadow-md">
                  SALTAR
                </button>
              </div>
            )}
          </div>

          {/* INFO DEL EJERCICIO */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
            <h3 className="text-xl font-bold text-neutral-900 leading-tight capitalize tracking-tighter">
              {activeStep.name}
            </h3>
            {activeStep.description && (
              <p className="text-sm text-neutral-900 leading-relaxed">{activeStep.description}</p>
            )}
            
            <div className={clsx(
              "flex gap-4 transition-opacity duration-300",
              isResting && "opacity-40"
            )}>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase text-neutral-600 mb-0.5 tracking-widest">Series</p>
                <input 
                  type="number"
                  min="1"
                  value={activeStep.totalSets}
                  onChange={(e) => updateCurrentStepData('totalSets', Math.max(1, Number(e.target.value)))}
                  disabled={isResting}
                  className="text-2xl font-bold text-neutral-900 bg-transparent w-12 outline-none border-b-2 border-transparent focus:border-neutral-200"
                />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase text-neutral-600 mb-0.5 tracking-widest">Reps</p>
                <input 
                  type="number"
                  value={activeStep.reps}
                  onChange={(e) => updateCurrentStepData('reps', Number(e.target.value))}
                  disabled={isResting}
                  className="text-2xl font-bold text-neutral-900 bg-transparent w-16 outline-none border-b-2 border-transparent focus:border-neutral-200"
                />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase text-neutral-600 mb-0.5 tracking-widest">Carga (kg)</p>
                <input 
                  type="number"
                  step="0.5"
                  value={activeStep.weight ?? ''}
                  onChange={(e) => updateCurrentStepData('weight', e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={isResting}
                  className="text-2xl font-bold text-blue-600 bg-transparent w-20 outline-none border-b-2 border-transparent focus:border-blue-200"
                />
              </div>
            </div>

            <ExerciseLoadHistory exerciseName={activeStep.name} />

            <div>
              <p className="text-[10px] font-bold uppercase text-neutral-600 mb-1 tracking-widest">Nota</p>
              <textarea
                value={activeStep.notes || ''}
                onChange={(e) => updateCurrentStepData('notes', e.target.value)}
                disabled={isResting}
                placeholder="Escribe una nota para este ejercicio..."
                rows={2}
                className="w-full text-sm text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 outline-none focus:border-neutral-400 resize-none placeholder:text-neutral-400 transition-colors"
              />
            </div>

            {!isResting && (
              <div className="flex gap-3">
                {currentStep.hasTimer && !isExerciseTimer && (
                  <button 
                    onClick={startExerciseTimer}
                    className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                  >
                    <TimerIcon size={18} /> INICIAR TIMER
                  </button>
                )}
                <button 
                  onClick={startRest}
                  className={clsx(
                    "py-3 bg-neutral-900 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95",
                    currentStep.hasTimer ? "px-6" : "w-full"
                  )}
                >
                  {currentStep.hasTimer ? <CheckCircle2 size={18} /> : "COMPLETAR SERIE"} {!currentStep.hasTimer && <ChevronRight size={18} />}
                </button>
              </div>
            )}
          </div>

          {/* LISTA DE EJERCICIOS DE LA RUTINA */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-1 flex items-center gap-2">
              <Dumbbell size={12} /> Ejercicios de la Rutina ({routine.exercises.length})
            </p>
            <div className="space-y-2">
              {routine.exercises.map((ex) => {
                const indexes = currentSteps
                  .map((s, i) => (s.id === ex.id ? i : -1))
                  .filter(i => i >= 0);
                const lastIdx = indexes[indexes.length - 1];
                const isCompleted = typeof lastIdx === 'number' && lastIdx < currentStepIdx;
                const isCurrent = activeStep?.id === ex.id;
                return (
                  <button
                    key={ex.id}
                    onClick={() => {
                      const targetIdx = currentSteps.findIndex(s => s.id === ex.id);
                      setCurrentStepIdx(targetIdx);
                      setIsResting(false);
                      setIsExerciseTimer(false);
                      setIsActive(false);
                    }}
                    className={clsx(
                      "w-full flex items-center gap-3 p-2 rounded-xl border transition-all text-left",
                      isCurrent ? "bg-neutral-900 text-white border-neutral-900" :
                      isCompleted ? "bg-green-50 border-green-200" :
                      "bg-neutral-50 border-neutral-100 hover:border-neutral-300"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-200 flex-shrink-0">
                      {ex.imageUrl ? (
                        <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover mix-blend-multiply" />
                      ) : <Dumbbell className="m-auto mt-2 text-neutral-600" size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx("text-sm font-bold capitalize truncate", isCurrent ? "text-white" : "text-neutral-900")}>
                        {ex.name}
                      </p>
                      <p className={clsx("text-[10px] font-bold uppercase tracking-wider", isCurrent ? "text-white/60" : "text-neutral-400")}>
                        {ex.sets} series × {ex.reps} reps
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : isCurrent ? (
                        <Dumbbell size={18} className="text-white animate-pulse" />
                      ) : (
                        <ChevronRight size={18} className="text-neutral-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL UI */}
      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        confirmLabel={modal.type === 'confirm' ? 'Sí, salir' : 'Volver al Inicio'}
        dismissible={modal.type !== 'success'}
        icon={modal.type === 'success' ? <Trophy size={40} /> : undefined}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
};

export default Workout;
