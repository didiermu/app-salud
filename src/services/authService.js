/**
 * Servicio de Autenticación.
 *
 * Login con Google. En web usa popup; en nativo (Capacitor) usa
 * redirect porque Google bloquea OAuth dentro de WebViews,
 * interceptando el retorno con @capacitor/browser + @capacitor/app.
 */

import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App as CapacitorApp } from "@capacitor/app";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    getRedirectResult,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    signOut as firebaseSignOut,
    updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";

const NATIVE_REDIRECT_PATH = "/__auth__";

const isNative = () => Capacitor.isNativePlatform();

/**
 * Traduce los errores de Firebase a mensajes en español
 * para poder mostrarlos en la UI sin filtrar tecnicismos.
 */
export const describeAuthError = (error) => {
    const code = error?.code || "";

    const known = {
        "auth/popup-closed-by-user": "Cerraste la ventana de inicio de sesión.",
        "auth/cancelled-popup-request": "Ya hay un inicio de sesión en curso.",
        "auth/popup-blocked":
            "El navegador bloqueó la ventana de acceso. Inténtalo de nuevo.",
        "auth/network-request-failed":
            "Sin conexión con el servidor. Revisa tu red.",
        "auth/account-exists-with-different-credential":
            "Esta cuenta ya existe con otro método de acceso.",
        "auth/too-many-requests": "Demasiados intentos. Espera un momento.",
        "auth/operation-not-allowed":
            "Este método de acceso no está habilitado en Firebase. Actívalo en la consola de Firebase, en Authentication > Proveedores.",
        "auth/unauthorized-domain":
            "Este dominio no está autorizado en la consola de Firebase.",
        "auth/email-already-in-use":
            "Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.",
        "auth/invalid-email":
            "El correo electrónico no tiene un formato válido.",
        "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
        "auth/missing-password": "Escribe tu contraseña para continuar.",
        "auth/invalid-credential": "El correo o la contraseña son incorrectos.",
        "auth/user-not-found": "El correo o la contraseña son incorrectos.",
        "auth/wrong-password": "El correo o la contraseña son incorrectos.",
        "auth/user-disabled":
            "Esta cuenta está deshabilitada. Contacta con soporte.",
    };

    return (
        known[code] || "No pudimos completar la solicitud. Inténtalo de nuevo."
    );
};

/** Crea una cuenta con correo y contraseña, y guarda el nombre visible. */
export const signUpWithEmail = async (email, password, name) => {
    const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
    );
    await updateProfile(credential.user, { displayName: name.trim() });
    return credential.user;
};

/** Inicia sesión con una cuenta de correo y contraseña. */
export const signInWithEmail = async (email, password) => {
    const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
    );
    return credential.user;
};

/** Cierra la Custom Tab si el login nativo quedó abierto. */
const closeNativeBrowser = async () => {
    if (!isNative()) return;
    try {
        await Browser.close();
    } catch {
        // Si la pestaña ya estaba cerrada no hay nada que hacer.
    }
};

export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    if (isNative()) {
        await closeNativeBrowser();
        await signInWithRedirect(auth, provider);
        return null;
    }

    try {
        const credential = await signInWithPopup(auth, provider);
        return credential.user;
    } catch (error) {
        // Fallback automático a redirect si el popup se ve limitado por COOP.
        const code = error?.code || "";
        if (
            code === "auth/popup-blocked" ||
            code === "auth/unauthorized-domain"
        ) {
            await signInWithRedirect(auth, provider);
            return null;
        }
        throw error;
    }
};

export const signOut = async () => {
    await closeNativeBrowser();
    await firebaseSignOut(auth);
};

/**
 * Recupera el usuario tras un redirect nativo.
 * En web no hay nada que recuperar: el redirect nunca ocurre.
 */
export const completeNativeSignIn = async () => {
    if (!isNative()) return null;
    const credential = await getRedirectResult(auth);
    if (!credential) return null;
    await closeNativeBrowser();
    return credential.user;
};

/**
 * Suscribe a los cambios de sesión.
 * Devuelve la función para cancelar la suscripción.
 */
export const subscribeToAuth = (onUser, onError) =>
    onAuthStateChanged(
        auth,
        (user) => onUser(user),
        (error) => onError?.(error),
    );

/**
 * Conecta el retorno del navegador nativo con la resolución del redirect.
 * En web es un no-op.
 */
export const listenForNativeRedirect = (onReturn) => {
    if (!isNative()) return () => {};

    const handler = ({ url }) => {
        if (url?.includes(NATIVE_REDIRECT_PATH)) onReturn();
    };

    CapacitorApp.addListener("appUrlOpen", handler);
    return () => {};
};

export { auth };
