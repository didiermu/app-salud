const MUSCLE_GROUPS = {
  'Pecho + Tríceps': ['chest', 'triceps'],
  'Espalda + Bíceps': ['back', 'biceps'],
  'Pierna + Core': ['quadriceps', 'hamstrings', 'glutes', 'calves', 'core'],
  'Hombro + Brazo': ['shoulders', 'biceps', 'triceps'],
  'Full body': ['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes'],
  'Upper- fuerza': ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  'Upper - hiper': ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  'Lower - pierna': ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  'Lower - intensidad': ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  'Torso - Fuerza': ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  'Torso - Hipertrofia': ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  'Pierna': ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  'Pierna + Hombro': ['quadriceps', 'hamstrings', 'glutes', 'calves', 'shoulders'],
};

function parseRoutineHistory() {
  return [
    { date: '2025-03-23', routine: 'Pecho + Tríceps', day: 1 },
    { date: '2025-03-24', routine: 'Pierna + Core', day: 3 },
    { date: '2025-03-26', routine: 'Espalda + Bíceps', day: 2 },
    { date: '2025-03-28', routine: 'Hombro + Brazo', day: 4 },
    { date: '2025-03-30', routine: 'Pecho + Tríceps', day: 1 },
    { date: '2025-03-31', routine: 'Pierna + Core', day: 3 },
    { date: '2025-04-02', routine: 'Espalda + Bíceps', day: 2 },
    { date: '2025-04-03', routine: 'Full body', day: 5 },
    { date: '2025-04-06', routine: 'Hombro + Brazo', day: 4 },
    { date: '2025-04-07', routine: 'Pecho + Tríceps', day: 1 },
    { date: '2025-04-09', routine: 'Pierna + Core', day: 3 },
    { date: '2025-04-12', routine: 'Espalda + Bíceps', day: 2 },
    { date: '2025-04-13', routine: 'Upper- fuerza', day: 1 },
    { date: '2025-04-15', routine: 'Lower - pierna', day: 2 },
    { date: '2025-04-16', routine: 'Upper - hiper', day: 3 },
    { date: '2025-04-20', routine: 'Lower - intensidad', day: 4 },
    { date: '2025-04-21', routine: 'Upper- fuerza', day: 1 },
    { date: '2025-04-23', routine: 'Lower - pierna', day: 2 },
    { date: '2025-04-27', routine: 'Upper - hiper', day: 3 },
    { date: '2025-04-28', routine: 'Lower - intensidad', day: 4 },
    { date: '2025-04-30', routine: 'Upper- fuerza', day: 1 },
    { date: '2025-05-01', routine: 'Lower - pierna', day: 2 },
    { date: '2025-05-04', routine: 'Upper - hiper', day: 3 },
    { date: '2025-05-05', routine: 'Lower - intensidad', day: 4 },
    { date: '2025-05-07', routine: 'Upper- fuerza', day: 1 },
    { date: '2025-05-11', routine: 'Lower - pierna', day: 2 },
    { date: '2025-05-12', routine: 'Upper - hiper', day: 3 },
    { date: '2025-05-14', routine: 'Lower - intensidad', day: 4 },
    { date: '2025-05-16', routine: 'Upper- fuerza', day: 1 },
    { date: '2025-05-19', routine: 'Lower - pierna', day: 2 },
    { date: '2025-05-20', routine: 'Upper - hiper', day: 3 },
    { date: '2025-05-22', routine: 'Lower - pierna', day: 2 },
    { date: '2025-05-27', routine: 'Upper - hiper', day: 3 },
    { date: '2025-05-28', routine: 'Lower - intensidad', day: 4 },
    { date: '2025-05-30', routine: 'Upper- fuerza', day: 1 },
    { date: '2025-06-01', routine: 'Lower - pierna', day: 2 },
    { date: '2025-06-02', routine: 'Upper - hiper', day: 3 },
    { date: '2025-06-08', routine: 'Lower - intensidad', day: 4 },
    { date: '2025-06-09', routine: 'Upper- fuerza', day: 1 },
    { date: '2025-06-15', routine: 'Lower - pierna', day: 2 },
    { date: '2025-06-16', routine: 'Upper - hiper', day: 3 },
    { date: '2025-06-20', routine: 'Lower - intensidad', day: 4 },
    { date: '2025-06-23', routine: 'Upper- fuerza', day: 1 },
    { date: '2025-07-06', routine: 'Upper- fuerza', day: 1 },
    { date: '2025-07-07', routine: 'Lower - pierna', day: 2 },
    { date: '2025-07-18', routine: 'Upper- fuerza', day: 1 },
    { date: '2025-07-20', routine: 'Lower - pierna', day: 2 },
    { date: '2025-07-22', routine: 'Upper - hiper', day: 3 },
    { date: '2025-07-23', routine: 'Pierna + Hombro', day: 4 },
    { date: '2025-07-27', routine: 'Torso - Fuerza', day: 1 },
    { date: '2025-07-28', routine: 'Pierna', day: 2 },
    { date: '2025-07-30', routine: 'Torso - Hipertrofia', day: 3 },
    { date: '2025-08-04', routine: 'Pierna + Hombro', day: 4 },
    { date: '2025-08-05', routine: 'Torso - Fuerza', day: 1 },
    { date: '2025-08-09', routine: 'Pierna', day: 2 },
    { date: '2025-08-10', routine: 'Torso - Hipertrofia', day: 3 },
    { date: '2025-08-12', routine: 'Pierna + Hombro', day: 4 },
    { date: '2025-08-14', routine: 'Torso - Fuerza', day: 1 },
    { date: '2025-08-17', routine: 'Pierna', day: 2 },
  ];
}

function categorizeRoutine(name) {
  if (!name) return 'mixed';
  const lower = name.toLowerCase();
  if (lower.includes('fuerza')) return 'strength';
  if (lower.includes('hiper') || lower.includes('hipertrofia')) return 'hypertrophy';
  if (lower.includes('intensidad')) return 'intensity';
  if (lower.includes('pierna') || lower.includes('lower')) return 'legs';
  if (lower.includes('upper') || lower.includes('torso')) return 'upper';
  return 'mixed';
}

function analyzeSessionPatterns(history) {
  if (!history || history.length === 0) return null;

  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastSession = sorted[0];
  const daysSinceLastSession = Math.floor(
    (Date.now() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24)
  );

  const routineCounts = {};
  history.forEach(s => {
    const name = s.routine || s.routineName || '';
    routineCounts[name] = (routineCounts[name] || 0) + 1;
  });

  const mostFrequent = Object.entries(routineCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }));

  const muscleFatigue = {};
  history.slice(0, 8).forEach(s => {
    const name = s.routine || s.routineName || '';
    const muscles = MUSCLE_GROUPS[name] || [];
    muscles.forEach(m => {
      muscleFatigue[m] = (muscleFatigue[m] || 0) + 1;
    });
  });

  const sortedByDate = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const recentMonth = sortedByDate.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    return (now - d) < 30 * 24 * 60 * 60 * 1000;
  });

  const weeklyFrequency = recentMonth.length / 4;

  const lastRoutineType = categorizeRoutine(lastSession.routine || lastSession.routineName);

  return {
    lastSession,
    daysSinceLastSession,
    mostFrequent,
    muscleFatigue,
    weeklyFrequency: Math.round(weeklyFrequency * 10) / 10,
    totalSessions: history.length,
    lastRoutineType,
  };
}

function analyzeExerciseProgression(history) {
  const sessionsWithExercises = history
    .filter(s => s.exercises && s.exercises.length > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sessionsWithExercises.length < 2) return null;

  const exerciseHistory = {};
  sessionsWithExercises.forEach(session => {
    session.exercises.forEach(ex => {
      const key = ex.name;
      if (!exerciseHistory[key]) exerciseHistory[key] = [];
      exerciseHistory[key].push({
        date: session.date,
        weight: ex.weight || 0,
        reps: ex.reps || 0,
        sets: ex.sets || 0,
        volume: (ex.weight || 0) * (ex.reps || 0) * (ex.sets || 0),
      });
    });
  });

  const progressions = [];
  const stagnations = [];

  Object.entries(exerciseHistory).forEach(([name, entries]) => {
    if (entries.length < 2) return;

    const latest = entries[entries.length - 1];
    const previous = entries[entries.length - 2];

    const weightDiff = latest.weight - previous.weight;
    const repsDiff = latest.reps - previous.reps;
    const volumeDiff = latest.volume - previous.volume;

    if (weightDiff > 0) {
      progressions.push({
        name,
        type: 'weight',
        from: previous.weight,
        to: latest.weight,
        diff: weightDiff,
        sessions: entries.length,
        lastDate: latest.date,
      });
    } else if (repsDiff > 0) {
      progressions.push({
        name,
        type: 'reps',
        from: previous.reps,
        to: latest.reps,
        diff: repsDiff,
        sessions: entries.length,
        lastDate: latest.date,
      });
    } else if (volumeDiff > 0) {
      progressions.push({
        name,
        type: 'volume',
        from: previous.volume,
        to: latest.volume,
        diff: volumeDiff,
        sessions: entries.length,
        lastDate: latest.date,
      });
    } else if (weightDiff === 0 && repsDiff === 0) {
      stagnations.push({
        name,
        currentWeight: latest.weight,
        currentReps: latest.reps,
        sessions: entries.length,
        lastDate: latest.date,
      });
    }
  });

  return {
    totalExercisesTracked: Object.keys(exerciseHistory).length,
    sessionsWithExerciseData: sessionsWithExercises.length,
    progressions,
    stagnations,
    exerciseHistory,
  };
}

function generateProgressionSuggestions(progressionData) {
  if (!progressionData) return [];

  const suggestions = [];

  progressionData.stagnations.forEach(ex => {
    if (ex.sessions >= 3) {
      suggestions.push({
        type: 'progression',
        title: `Progresar: ${ex.name}`,
        message: `Llevas ${ex.sessions} sesiones en ${ex.currentWeight}kg x ${ex.currentReps} reps. Es hora de subir carga (+2.5kg) o agregar 2 reps.`,
        exercise: ex.name,
        priority: 1,
      });
    }
  });

  progressionData.progressions.forEach(p => {
    if (p.type === 'weight') {
      suggestions.push({
        type: 'achievement',
        title: `${p.name}: +${p.diff}kg`,
        message: `Subiste de ${p.from}kg a ${p.to}kg. ¡Progreso real! Mantén esta tendencia.`,
        exercise: p.name,
        priority: 3,
      });
    }
  });

  const totalVolumeSessions = {};
  progressionData.exerciseHistory && Object.entries(progressionData.exerciseHistory).forEach(([, entries]) => {
    entries.forEach(e => {
      if (e.volume > 0) {
        if (!totalVolumeSessions[e.date]) totalVolumeSessions[e.date] = 0;
        totalVolumeSessions[e.date] += e.volume;
      }
    });
  });

  const volumeTimeline = Object.entries(totalVolumeSessions)
    .sort(([a], [b]) => new Date(a) - new Date(b));

  if (volumeTimeline.length >= 2) {
    const lastVol = volumeTimeline[volumeTimeline.length - 1][1];
    const prevVol = volumeTimeline[volumeTimeline.length - 2][1];
    if (prevVol > 0) {
      const pctChange = ((lastVol - prevVol) / prevVol * 100).toFixed(0);
      if (Number(pctChange) > 0) {
        suggestions.push({
          type: 'achievement',
          title: 'Volumen subiendo',
          message: `Tu volumen total subió ${pctChange}% respecto a la sesión anterior. Estás progresando.`,
          priority: 2,
        });
      } else if (Number(pctChange) < -10) {
        suggestions.push({
          type: 'warning',
          title: 'Volumen bajó',
          message: `Tu volumen total bajó ${Math.abs(pctChange)}%. Revisa si estás descansando demasiado o bajando carga.`,
          priority: 1,
        });
      }
    }
  }

  return suggestions.slice(0, 4);
}

function generateRoutineSuggestions(analysis) {
  if (!analysis) {
    return [{
      type: 'info',
      title: '¡Comienza tu journey!',
      message: 'Registra tu primera sesión para que pueda analizar tu progreso y darte sugerencias personalizadas.',
      routine: null,
      priority: 1,
    }];
  }

  const suggestions = [];
  const { daysSinceLastSession, weeklyFrequency } = analysis;

  if (daysSinceLastSession >= 4) {
    suggestions.push({
      type: 'warning',
      title: '¡Volvamos al ring!',
      message: `Llevas ${daysSinceLastSession} días sin entrenar. La constancia es la clave del progreso.`,
      routine: null,
      priority: 1,
    });
  }

  if (daysSinceLastSession <= 1 && daysSinceLastSession >= 0) {
    suggestions.push({
      type: 'success',
      title: '¡Ritmo perfecto!',
      message: 'Estás en un excelente ritmo de entrenamiento. Mantén esta disciplina.',
      routine: null,
      priority: 3,
    });
  }

  if (weeklyFrequency < 3) {
    suggestions.push({
      type: 'tip',
      title: 'Frecuencia recomendada',
      message: `Estás entrenando ~${weeklyFrequency} veces por semana. Para mejores resultados, apunta a 4-5 sesiones.`,
      routine: null,
      priority: 2,
    });
  }

  if (weeklyFrequency >= 4) {
    suggestions.push({
      type: 'success',
      title: '¡Excelente frecuencia!',
      message: `Con ~${weeklyFrequency} sesiones/semana, estás en el rango óptimo para progresar.`,
      routine: null,
      priority: 3,
    });
  }

  return suggestions;
}

export function getCoachAdvice(_userRoutines = [], userHistory = [], userProfile = {}) {
  const routineHistory = parseRoutineHistory();

  const normalizedUserHistory = userHistory.map(h => ({
    ...h,
    routine: h.routine || h.routineName || '',
  }));

  const allHistory = [...normalizedUserHistory];

  routineHistory.forEach(rh => {
    const exists = allHistory.some(h => h.routine === rh.routine &&
      new Date(h.date).toDateString() === new Date(rh.date).toDateString());
    if (!exists) {
      allHistory.push({
        id: `parsed-${rh.date}`,
        routine: rh.routine,
        routineName: rh.routine,
        date: new Date(rh.date).toISOString(),
        exercisesCount: 0,
        status: 'Completado',
      });
    }
  });

  const sessionAnalysis = analyzeSessionPatterns(allHistory);
  const progressionData = analyzeExerciseProgression(allHistory);

  const routineSuggestions = generateRoutineSuggestions(sessionAnalysis);
  const progressionSuggestions = generateProgressionSuggestions(progressionData);

  const allSuggestions = [...progressionSuggestions, ...routineSuggestions]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4);

  const userSessionsWithExercises = userHistory.filter(s => s.exercises && s.exercises.length > 0);
  const totalVolume = userSessionsWithExercises.reduce((acc, s) => acc + (s.totalVolume || 0), 0);

  const weightHistory = userProfile.healthHistory || [];
  const latestWeight = userProfile.weight || 0;
  const previousWeight = weightHistory.length > 1 ? weightHistory[1]?.weight : null;

  return {
    analysis: sessionAnalysis,
    progression: progressionData,
    suggestions: allSuggestions,
    summary: {
      lastWorkout: sessionAnalysis ? (sessionAnalysis.lastSession.routine || sessionAnalysis.lastSession.routineName) : null,
      daysSince: sessionAnalysis ? sessionAnalysis.daysSinceLastSession : null,
      frequency: sessionAnalysis ? sessionAnalysis.weeklyFrequency : null,
      totalSessions: sessionAnalysis ? sessionAnalysis.totalSessions : 0,
      exercisesTracked: progressionData ? progressionData.totalExercisesTracked : 0,
      totalVolume,
      bodyWeight: latestWeight,
      bodyWeightChange: previousWeight ? (latestWeight - previousWeight).toFixed(1) : null,
      progressionsCount: progressionData ? progressionData.progressions.length : 0,
      stagnationsCount: progressionData ? progressionData.stagnations.length : 0,
    },
  };
}
