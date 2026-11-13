/**
 * Servicio generador de planes de entrenamiento estructurados.
 * Genera el plan "Rutina de entrenamiento en casa — 3 días por semana"
 * adaptado a la arquitectura de Zustand y Firestore de la app.
 */

import { DEFAULT_SEQUENCE_MODE } from "../src/services/routineSequence.js";
import { scopedDocId, STORAGE_KEYS } from "../src/services/storageScope.js";

export const TARGET_USER_ID = "QAeRbLSZSrh3HDqzHPFiaO4irjx2";

const DEFAULT_EXERCISE_IMAGE =
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop";

export const createHomeWorkoutPlan = () => {
    const now = new Date().toISOString();

    const day1Exercises = [
        {
            id: "home-dia1-sentadilla-goblet",
            name: "Sentadilla goblet",
            bodyPart: "Piernas",
            target: "Cuádriceps y glúteos",
            equipment: "Mancuerna de 10 lb (4.5 kg)",
            imageUrl:
                "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Mancuerna frente al pecho; baja controladamente y empuja con toda la planta del pie.",
                "Rango sugerido: 12–15 repeticiones.",
                "Sustituye a: Sentadilla con barra.",
            ],
            sets: 3,
            reps: 15,
            rest: 90,
            weight: 4.5,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia1-puente-gluteo-una-pierna",
            name: "Puente de glúteo a una pierna",
            bodyPart: "Piernas",
            target: "Glúteos e isquios",
            equipment: "Tapete",
            imageUrl:
                "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Eleva la cadera sin arquear la espalda; mantén 2 segundos arriba.",
                "10–15 repeticiones por pierna.",
                "Sustituye a: Empuje de cadera.",
            ],
            sets: 3,
            reps: 12,
            rest: 90,
            weight: 0,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia1-desplantes-atras",
            name: "Desplantes hacia atrás",
            bodyPart: "Piernas",
            target: "Cuádriceps y glúteos",
            equipment: "Mancuernas de 10 lb (4.5 kg)",
            imageUrl:
                "https://images.unsplash.com/photo-1434682881908-b43d0467b798?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Da un paso atrás, flexiona ambas rodillas a 90° y vuelve empujando con la pierna delantera.",
                "10–12 repeticiones por pierna.",
                "Sustituye a: Prensa de piernas.",
            ],
            sets: 3,
            reps: 12,
            rest: 90,
            weight: 4.5,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia1-caminata-talones-puente",
            name: "Caminata de talones desde puente",
            bodyPart: "Piernas",
            target: "Isquiotibiales",
            equipment: "Tapete",
            imageUrl:
                "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Desde un puente, aleja los talones gradualmente y regresa sin dejar caer la cadera.",
                "8–12 repeticiones.",
                "Sustituye a: Curl de isquios acostado.",
            ],
            sets: 2,
            reps: 10,
            rest: 60,
            weight: 0,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia1-sentadilla-isometrica-pared",
            name: "Sentadilla isométrica en pared",
            bodyPart: "Piernas",
            target: "Cuádriceps",
            equipment: "Pared",
            imageUrl:
                "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Mantén la espalda contra la pared y las rodillas alineadas a 90°.",
                "Duración isométrica: 30–45 segundos por serie.",
                "Sustituye a: Extensiones de piernas.",
            ],
            sets: 2,
            reps: 1,
            rest: 60,
            weight: 0,
            hasTimer: true,
            timerDuration: 45,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia1-elevaciones-talones-una-pierna",
            name: "Elevaciones de talones a una pierna",
            bodyPart: "Pantorrillas",
            target: "Pantorrillas",
            equipment: "Apoyo firme",
            imageUrl:
                "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Usa un apoyo para equilibrarte; sube y baja lentamente.",
                "15–20 repeticiones por pierna.",
                "Sustituye a: Pantorrillas en máquina.",
            ],
            sets: 2,
            reps: 20,
            rest: 60,
            weight: 0,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
    ];

    const day2Exercises = [
        {
            id: "home-dia2-press-pecho-suelo",
            name: "Press de pecho en el suelo",
            bodyPart: "Pecho",
            target: "Pectorales",
            equipment: "Mancuernas de 10 lb (4.5 kg) y tapete",
            imageUrl:
                "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Acostada boca arriba, empuja las mancuernas al techo y baja con control.",
                "10–15 repeticiones.",
                "Sustituye a: Press plano.",
            ],
            sets: 3,
            reps: 12,
            rest: 75,
            weight: 4.5,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia2-remo-unilateral-mancuerna",
            name: "Remo unilateral con mancuerna",
            bodyPart: "Espalda",
            target: "Dorsales y espalda media",
            equipment: "Mancuerna de 10 lb (4.5 kg) y apoyo firme",
            imageUrl:
                "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Apóyate en una superficie firme y lleva el codo hacia la cadera sin girar el torso.",
                "12–15 repeticiones por lado.",
                "Sustituye a: Polea al pecho.",
            ],
            sets: 3,
            reps: 15,
            rest: 75,
            weight: 4.5,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia2-elevaciones-laterales",
            name: "Elevaciones laterales",
            bodyPart: "Hombros",
            target: "Deltoides lateral",
            equipment: "Mancuernas de 5 lb (2.3 kg)",
            imageUrl:
                "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Levanta los brazos hasta la altura de los hombros sin balancearte.",
                "12–20 repeticiones con tempo controlado.",
            ],
            sets: 2,
            reps: 15,
            rest: 60,
            weight: 2.3,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia2-remo-inclinado-dos-mancuernas",
            name: "Remo inclinado con dos mancuernas",
            bodyPart: "Espalda",
            target: "Espalda alta y media",
            equipment: "Mancuernas de 10 lb (4.5 kg)",
            imageUrl:
                "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Bisagra de cadera con espalda neutra; lleva los codos hacia atrás.",
                "12–15 repeticiones.",
            ],
            sets: 2,
            reps: 12,
            rest: 60,
            weight: 4.5,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia2-curl-biceps",
            name: "Curl de bíceps",
            bodyPart: "Brazos",
            target: "Bíceps",
            equipment: "Mancuernas de 5 o 10 lb (2.3–4.5 kg)",
            imageUrl:
                "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Codos junto al cuerpo; evita el impulso y contrae arriba.",
                "12–15 repeticiones.",
            ],
            sets: 2,
            reps: 12,
            rest: 60,
            weight: 2.3,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia2-extension-triceps-cabeza",
            name: "Extensión de tríceps sobre la cabeza",
            bodyPart: "Brazos",
            target: "Tríceps",
            equipment: "Mancuerna de 10 lb (4.5 kg)",
            imageUrl:
                "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Sostén una mancuerna con ambas manos; flexiona y extiende los codos con brazos verticales.",
                "12–15 repeticiones.",
                "Sustituye a: Tríceps en polea.",
            ],
            sets: 2,
            reps: 12,
            rest: 60,
            weight: 4.5,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia2-dead-bug",
            name: "Dead bug",
            bodyPart: "Abdomen",
            target: "Core y abdomen",
            equipment: "Tapete",
            imageUrl:
                "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Extiende brazo y pierna contrarios sin despegar la zona lumbar del suelo.",
                "10–12 repeticiones por lado.",
            ],
            sets: 2,
            reps: 12,
            rest: 45,
            weight: 0,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
    ];

    const day3Exercises = [
        {
            id: "home-dia3-hip-thrust-mancuerna",
            name: "Hip thrust con mancuerna",
            bodyPart: "Piernas",
            target: "Glúteos",
            equipment: "Sofá/apoyo firme y mancuerna de 10 lb (4.5 kg)",
            imageUrl:
                "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Espalda alta apoyada en sofá firme, mancuerna sobre cadera; eleva y contrae glúteos.",
                "12–20 repeticiones.",
                "Sustituye a: Empuje de cadera en máquina.",
            ],
            sets: 3,
            reps: 15,
            rest: 90,
            weight: 4.5,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia3-peso-muerto-rumano",
            name: "Peso muerto rumano con mancuernas",
            bodyPart: "Piernas",
            target: "Isquiotibiales y glúteos",
            equipment: "Mancuernas de 10 lb (4.5 kg)",
            imageUrl:
                "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Lleva la cadera atrás, espalda neutra y mancuernas cerca de las piernas.",
                "12–15 repeticiones.",
                "Sustituye a: Peso muerto con barra.",
            ],
            sets: 3,
            reps: 12,
            rest: 90,
            weight: 4.5,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia3-sentadilla-bulgara",
            name: "Sentadilla búlgara",
            bodyPart: "Piernas",
            target: "Cuádriceps y glúteos",
            equipment: "Sofá/apoyo y mancuernas",
            imageUrl:
                "https://images.unsplash.com/photo-1434682881908-b43d0467b798?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Pie trasero en apoyo estable, baja con control; ligera inclinación de torso para enfatizar glúteos.",
                "10–12 repeticiones por pierna.",
                "Sustituye a: Búlgara en Smith.",
            ],
            sets: 3,
            reps: 10,
            rest: 90,
            weight: 2.3,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia3-aperturas-inversas",
            name: "Aperturas inversas con mancuernas",
            bodyPart: "Espalda",
            target: "Hombro posterior y espalda alta",
            equipment: "Mancuernas de 5 lb (2.3 kg)",
            imageUrl:
                "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Torso inclinado, abre los brazos con ligera flexión de codos; trabaja hombro posterior y espalda alta.",
                "12–15 repeticiones.",
            ],
            sets: 2,
            reps: 12,
            rest: 60,
            weight: 2.3,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia3-flexiones-inclinadas",
            name: "Flexiones inclinadas",
            bodyPart: "Pecho",
            target: "Pectorales y tríceps",
            equipment: "Superficie estable (sofá o apoyo)",
            imageUrl:
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Manos en superficie estable, cuerpo alineado y descenso controlado.",
                "8–15 repeticiones.",
                "Sustituye a: Press inclinado con mancuernas.",
            ],
            sets: 2,
            reps: 10,
            rest: 60,
            weight: 0,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
        {
            id: "home-dia3-press-hombros-mancuernas",
            name: "Press de hombros con mancuernas",
            bodyPart: "Hombros",
            target: "Deltoides",
            equipment: "Mancuernas de 5–10 lb (2.3–4.5 kg)",
            imageUrl:
                "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop",
            videoUrl: "",
            instructions: [
                "Empuja hacia arriba sin arquear la zona lumbar. Controla la bajada a 90°.",
                "10–15 repeticiones.",
            ],
            sets: 2,
            reps: 12,
            rest: 60,
            weight: 2.3,
            hasTimer: false,
            timerDuration: 60,
            sequence: DEFAULT_SEQUENCE_MODE,
        },
    ];

    return [
        {
            id: "home-workout-dia-1",
            name: "Día 1 — Piernas y glúteos",
            exercises: day1Exercises,
            createdAt: now,
        },
        {
            id: "home-workout-dia-2",
            name: "Día 2 — Torso y abdomen",
            exercises: day2Exercises,
            createdAt: now,
        },
        {
            id: "home-workout-dia-3",
            name: "Día 3 — Cuerpo completo",
            exercises: day3Exercises,
            createdAt: now,
        },
    ];
};

/**
 * Combina las nuevas rutinas dentro del estado del usuario preservando
 * rutinas preexistentes que no coincidan en id o nombre.
 */
export const buildUserRoutineStorage = (existingState = null, newRoutines = []) => {
    const prevRoutines = existingState?.state?.routines || [];
    const prevCustomExercises = existingState?.state?.customExercises || [];

    const newRoutineIds = new Set(newRoutines.map((r) => r.id));
    const newRoutineNames = new Set(newRoutines.map((r) => r.name.toLowerCase()));

    // Filtra las que se van a sobreescribir/actualizar
    const filteredPrev = prevRoutines.filter(
        (r) => !newRoutineIds.has(r.id) && !newRoutineNames.has(r.name.toLowerCase())
    );

    const mergedRoutines = [...filteredPrev, ...newRoutines];

    return {
        state: {
            routines: mergedRoutines,
            selectedExercises: [],
            customExercises: prevCustomExercises,
            editingRoutineId: null,
        },
        version: 0,
    };
};
