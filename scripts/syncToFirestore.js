import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import {
    createHomeWorkoutPlan,
    buildUserRoutineStorage,
    TARGET_USER_ID,
} from "./routineGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, "../data.json");

const firebaseConfig = {
    apiKey: "AIzaSyDIKvCMRbIj_NPlyd3_9xFb8_FM9mRhE3o",
    authDomain: "app-salud-e7a98.firebaseapp.com",
    projectId: "app-salud-e7a98",
    storageBucket: "app-salud-e7a98.firebasestorage.app",
    messagingSenderId: "299955792630",
    appId: "1:299955792630:web:fe2ebf4848cac0a60c5ad7",
};

async function syncAndValidate() {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const email = process.env.FIREBASE_EMAIL;
    const password = process.env.FIREBASE_PASSWORD;

    if (email && password) {
        console.log(`Autenticando con ${email}...`);
        const cred = await signInWithEmailAndPassword(auth, email, password);
        console.log(`Sesión iniciada con UID: ${cred.user.uid}`);
    }

    const docId = `${TARGET_USER_ID}__routine-storage`;
    const userDocId = `${TARGET_USER_ID}__user-storage`;
    const docRef = doc(db, "app_storage", docId);
    const userDocRef = doc(db, "app_storage", userDocId);

    console.log(`1. Consultando datos actuales en Firestore para UID: ${TARGET_USER_ID}...`);

    let existingStorage = null;
    try {
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data()?.value) {
            existingStorage = JSON.parse(snap.data().value);
            console.log(
                `   -> Documento existente encontrado con ${existingStorage?.state?.routines?.length || 0} rutinas y ${existingStorage?.state?.customExercises?.length || 0} ejercicios personalizados.`,
            );
        } else {
            console.log("   -> El usuario aún no tenía documento de rutinas en Firestore.");
        }
    } catch (err) {
        console.warn("   -> Aviso al leer documento actual:", err.message);
    }

    if (!existingStorage?.state?.customExercises?.length) {
        try {
            const seedSnap = await getDoc(doc(db, "app_storage", "exercise-library-seed"));
            if (seedSnap.exists() && seedSnap.data()?.value) {
                const seedCustom = JSON.parse(seedSnap.data().value)?.customExercises || [];
                existingStorage = {
                    state: {
                        routines: existingStorage?.state?.routines || [],
                        customExercises: seedCustom,
                        selectedExercises: [],
                        editingRoutineId: null,
                    },
                    version: 0,
                };
                console.log(`   -> Semilla cargada con ${seedCustom.length} ejercicios personalizados.`);
            }
        } catch (err) {
            console.warn("   -> No se pudo leer exercise-library-seed:", err.message);
        }
    }

    const plan = createHomeWorkoutPlan();
    const updatedStorage = buildUserRoutineStorage(existingStorage, plan);

    console.log(`2. Guardando las ${plan.length} rutinas en Firestore (app_storage/${docId})...`);
    await setDoc(docRef, {
        value: JSON.stringify(updatedStorage),
        updatedAt: new Date().toISOString(),
    });

    if (fs.existsSync(DB_FILE)) {
        try {
            const localDb = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
            localDb[docId] = updatedStorage;
            fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), "utf-8");
        } catch {
            // ignorar error local
        }
    }

    console.log("3. Validando en Firestore que las rutinas estén registradas...");
    const verifySnap = await getDoc(docRef);
    if (!verifySnap.exists()) {
        throw new Error("El documento no existe en Firestore tras guardar.");
    }

    const verifiedData = JSON.parse(verifySnap.data().value);
    const routines = verifiedData?.state?.routines || [];

    console.log("\n✅ VALIDACIÓN EXITOSA EN FIRESTORE:");
    console.log(`   Colección: app_storage`);
    console.log(`   Documento: ${docId}`);
    console.log(`   Última actualización: ${verifySnap.data().updatedAt}`);
    console.log(`   Total de rutinas registradas para el usuario: ${routines.length}`);
    for (const r of routines) {
        console.log(`   - [${r.id}] ${r.name} (${r.exercises?.length || 0} ejercicios)`);
    }

    try {
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
            const userData = JSON.parse(userSnap.data().value);
            console.log(`   Perfil asociado:`, userData?.state?.profile);
        }
    } catch {
        // ignorar
    }

    process.exit(0);
}

syncAndValidate().catch((err) => {
    console.error("❌ Error sincronizando o validando con Firestore:", err.message || err);
    process.exit(1);
});
