import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import { createHomeWorkoutPlan, buildUserRoutineStorage, TARGET_USER_ID } from "./routineGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = "/Users/didier/.config/configstore/firebase-tools.json";
const PROJECT_ID = "app-salud-e7a98";
const DOC_ID = `${TARGET_USER_ID}__routine-storage`;

function getAccessToken() {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    const token = config.tokens?.access_token;
    if (!token) throw new Error("No access_token found in firebase-tools.json");
    return token;
}

function firestoreRequest(method, docPath, body = null) {
    return new Promise((resolve, reject) => {
        const token = getAccessToken();
        const urlPath = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;

        const req = https.request(
            {
                hostname: "firestore.googleapis.com",
                port: 443,
                path: urlPath,
                method: method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    try {
                        const parsed = data ? JSON.parse(data) : {};
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsed);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                        }
                    } catch (e) {
                        reject(new Error(`Failed to parse response (HTTP ${res.statusCode}): ${data}`));
                    }
                });
            },
        );

        req.on("error", reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function main() {
    console.log(`--- GESTIÓN DIRECTA EN FIRESTORE VÍA ADMIN TOKEN ---`);
    console.log(`Proyecto: ${PROJECT_ID}`);
    console.log(`Usuario Objetivo UID: ${TARGET_USER_ID}`);
    console.log(`Documento destino: app_storage/${DOC_ID}\n`);

    // 1. Consultar estado actual
    console.log("1. Consultando documento actual en Firestore...");
    let existingValue = null;
    try {
        const currentDoc = await firestoreRequest("GET", `app_storage/${DOC_ID}`);
        console.log("   -> Documento existente encontrado en Firestore.");
        const rawString = currentDoc.fields?.value?.stringValue;
        if (rawString) {
            existingValue = JSON.parse(rawString);
            console.log(`   -> Rutinas existentes: ${existingValue?.state?.routines?.length || 0}`);
        }
    } catch (err) {
        if (err.message.includes("404")) {
            console.log("   -> El documento aún no existe en Firestore (404 Not Found).");
        } else {
            console.warn("   -> Aviso al leer:", err.message);
        }
    }

    // 2. Si no tiene biblioteca personalizada, intentar traerla de exercise-library-seed
    if (!existingValue?.state?.customExercises?.length) {
        try {
            const seedDoc = await firestoreRequest("GET", "app_storage/exercise-library-seed");
            const seedRaw = seedDoc.fields?.value?.stringValue;
            if (seedRaw) {
                const seedCustom = JSON.parse(seedRaw)?.customExercises || [];
                existingValue = {
                    state: {
                        routines: existingValue?.state?.routines || [],
                        customExercises: seedCustom,
                        selectedExercises: [],
                        editingRoutineId: null,
                    },
                    version: 0,
                };
                console.log(`   -> Biblioteca semilla importada con ${seedCustom.length} ejercicios personalizados.`);
            }
        } catch {
            console.log("   -> No se encontró exercise-library-seed global.");
        }
    }

    // 3. Generar el plan de 3 días en casa
    const plan = createHomeWorkoutPlan();
    const newStorageState = buildUserRoutineStorage(existingValue, plan);
    const valueString = JSON.stringify(newStorageState);
    const nowIso = new Date().toISOString();

    // 4. Escribir directamente a Firestore (PATCH o POST)
    console.log(`\n2. Guardando las 3 rutinas en Firestore (app_storage/${DOC_ID})...`);
    const documentBody = {
        fields: {
            value: { stringValue: valueString },
            updatedAt: { stringValue: nowIso },
        },
    };

    const savedDoc = await firestoreRequest("PATCH", `app_storage/${DOC_ID}`, documentBody);
    console.log("   -> Documento guardado exitosamente en Firestore.");

    // 5. Validar leyendo nuevamente desde Firestore
    console.log("\n3. Validando directamente en Firestore que las rutinas estén registradas...");
    const verifyDoc = await firestoreRequest("GET", `app_storage/${DOC_ID}`);
    const verifyString = verifyDoc.fields?.value?.stringValue;
    if (!verifyString) {
        throw new Error("El documento no contiene el campo 'value'.");
    }

    const verifiedState = JSON.parse(verifyString);
    const verifiedRoutines = verifiedState?.state?.routines || [];

    console.log("\n=======================================================");
    console.log("🎉 VALIDACIÓN COMPLETADA CON ÉXITO EN FIRESTORE");
    console.log("=======================================================");
    console.log(`ID del Documento: ${DOC_ID}`);
    console.log(`Actualizado en: ${verifyDoc.fields?.updatedAt?.stringValue}`);
    console.log(`Total de rutinas registradas para el usuario: ${verifiedRoutines.length}`);
    verifiedRoutines.forEach((r, idx) => {
        console.log(`\n  [Rutina ${idx + 1}] "${r.name}" (ID: ${r.id})`);
        console.log(`   Ejercicios (${r.exercises?.length || 0}):`);
        r.exercises.forEach((ex, exIdx) => {
            const detail = ex.hasTimer ? `${ex.timerDuration}s` : `${ex.reps} reps`;
            console.log(`     ${exIdx + 1}. ${ex.name} -> ${ex.sets} series x ${detail} | Peso: ${ex.weight} kg | Descanso: ${ex.rest}s`);
        });
    });
}

main().catch((err) => {
    console.error("❌ Error en adminFirestore:", err.message);
    process.exit(1);
});

