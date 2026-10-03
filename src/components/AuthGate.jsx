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
