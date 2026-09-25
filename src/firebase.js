import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: REEMPLAZA ESTE OBJETO CON LA CONFIGURACIÓN REAL DE TU PROYECTO DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyDIKvCMRbIj_NPlyd3_9xFb8_FM9mRhE3o",
    authDomain: "app-salud-e7a98.firebaseapp.com",
    projectId: "app-salud-e7a98",
    storageBucket: "app-salud-e7a98.firebasestorage.app",
    messagingSenderId: "299955792630",
    appId: "1:299955792630:web:fe2ebf4848cac0a60c5ad7",
    measurementId: "G-8C7GNG24VE",
};

let app;
let db;

try {
    // Inicializamos Firebase
    app = initializeApp(firebaseConfig);
    // Inicializamos Firestore (Base de datos)
    db = getFirestore(app);
} catch (error) {
    console.error("Error al inicializar Firebase. Revisa tu configuración.", error);
}

export { db };
