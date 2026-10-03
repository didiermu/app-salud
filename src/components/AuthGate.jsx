import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
    hydrateStores,
    resetStores,
    setActiveUid,
    useUserStore,
} from "../store/useStore";
import { prepareUserData } from "../services/migrationService";
import Login from "../pages/Login";

const SplashScreen = ({ message }) => (
    <div className="min-h-[100dvh] bg-neutral-50 flex flex-col items-center justify-center gap-6 font-sans px-6 text-center">
        <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
            {message || "Preparando tu espacio"}
        </p>
    </div>
);

/**
 * Puerta de autenticación.
 *
 * Espera a que Firebase Auth resuelva la sesión, y cuando hay usuario:
 *  1. Migra los datos heredados (solo para el dueño) y siembra la biblioteca.
 *  2. Fija el uid activo para que el storage escriba en su scope.
 *  3. Rehidrata los stores con sus documentos.
 *
 * Hasta que todo eso termina no renderiza las páginas, para no mostrar
 * un estado vacío o, peor, datos del usuario anterior.
 */
const AuthGate = ({ children }) => {
    const user = useAuthStore((state) => state.user);
    const initializing = useAuthStore((state) => state.initializing);
    const init = useAuthStore((state) => state.init);
    const setMigrating = useAuthStore((state) => state.setMigrating);
    const migrating = useAuthStore((state) => state.migrating);
    const [ready, setReady] = useState(false);
    const [preparationError, setPreparationError] = useState(null);

    useEffect(() => {
        const cancelledRef = { current: false };
        const unsubscribeRef = { current: null };

        const handleUser = async (authUser) => {
            if (cancelledRef.current) return;

            if (!authUser) {
                setActiveUid(null);
                resetStores();
                setReady(false);
                setMigrating(false);
                return;
            }

            setReady(false);
            setPreparationError(null);
            setMigrating(true);

            try {
                await prepareUserData(authUser);
                if (cancelledRef.current) return;
                setActiveUid(authUser.uid);
                await hydrateStores();
                if (
                    !useUserStore.getState().profile.name &&
                    authUser.displayName
                ) {
                    useUserStore
                        .getState()
                        .setProfileName(authUser.displayName);
                }
            } catch (error) {
                console.error(
                    "[AuthGate] Error preparando los datos del usuario:",
                    error,
                );
                setPreparationError(error);
            } finally {
                if (!cancelledRef.current) {
                    setMigrating(false);
                    setReady(true);
                }
            }
        };

        let unsub;
        try {
            unsub = init(handleUser);
        } catch {
            unsub = undefined;
        }

        Promise.resolve(unsub).then((maybeUnsub) => {
            if (typeof maybeUnsub !== "function") return;

            if (cancelledRef.current) {
                maybeUnsub();
            } else {
                unsubscribeRef.current = maybeUnsub;
            }
        });

        return () => {
            cancelledRef.current = true;
            if (typeof unsubscribeRef.current === "function") {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [init, setMigrating]);

    if (!user) return <Login />;
    if (preparationError) {
        return (
            <div className="min-h-[100dvh] bg-neutral-50 flex items-center justify-center px-6 font-sans">
                <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-xl">
                    <h1 className="text-lg font-black text-neutral-900">
                        No pudimos recuperar tus datos
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                        No mostraremos una cuenta vacía para evitar que tus
                        datos se sobrescriban. Revisa la conexión y vuelve a
                        intentarlo.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-6 w-full rounded-xl bg-neutral-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-neutral-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }
    if (initializing || migrating || !ready) {
        return (
            <SplashScreen
                message={
                    migrating ? "Preparando tus datos" : "Preparando tu espacio"
                }
            />
        );
    }

    return children;
};

export default AuthGate;
