import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    createHomeWorkoutPlan,
    buildUserRoutineStorage,
    TARGET_USER_ID,
} from "./routineGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, "../data.json");
const EXPORT_DIR = path.resolve(__dirname, "../exports");
const EXPORT_FILE = path.join(EXPORT_DIR, `routine_${TARGET_USER_ID}.json`);

const run = () => {
    console.log(`Generando rutina para el usuario: ${TARGET_USER_ID}...`);

    let dbData = {};
    if (fs.existsSync(DB_FILE)) {
        try {
            dbData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        } catch (e) {
            console.error("Error leyendo data.json:", e);
            dbData = {};
        }
    }

    const plan = createHomeWorkoutPlan();
    const userStorageKey = `${TARGET_USER_ID}__routine-storage`;

    const existingUserStorage = dbData[userStorageKey] || null;
    const updatedStorage = buildUserRoutineStorage(existingUserStorage, plan);

    dbData[userStorageKey] = updatedStorage;

    // Aseguramos que data.json tenga el cambio guardado
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
    console.log(`✅ Base de datos local (data.json) actualizada en clave '${userStorageKey}'.`);

    // Guardamos copia de exportación
    if (!fs.existsSync(EXPORT_DIR)) {
        fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }

    const exportPayload = {
        uid: TARGET_USER_ID,
        docId: userStorageKey,
        collection: "app_storage",
        createdAt: new Date().toISOString(),
        planSummary: plan.map((r) => ({
            id: r.id,
            name: r.name,
            totalExercises: r.exercises.length,
            exercises: r.exercises.map((e) => `${e.name} (${e.sets} series x ${e.reps || e.timerDuration + 's'})`),
        })),
        storageValue: updatedStorage,
    };

    fs.writeFileSync(EXPORT_FILE, JSON.stringify(exportPayload, null, 2), "utf-8");
    console.log(`✅ Archivo de exportación generado en: ${EXPORT_FILE}`);

    return exportPayload;
};

run();

