import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks de Firebase Auth ---
const authState = { currentUser: null };

vi.mock("../firebase", () => ({
    db: undefined,
    // Se resuelve en cada acceso para poder mover currentUser entre tests.
    get auth() {
        return authState;
    },
}));

vi.mock("../services/authService", () => ({
    signInWithEmail: vi.fn(async () => DIDIER),
    signInWithGoogle: vi.fn(async () => ({ uid: "uid-web" })),
    signUpWithEmail: vi.fn(async () => DIDIER),
    signOut: vi.fn(async () => {}),
    completeNativeSignIn: vi.fn(async () => null),
    listenForNativeRedirect: vi.fn(() => () => {}),
    subscribeToAuth: vi.fn((onUser) => {
        authState.onUser = onUser;
        onUser(authState.currentUser);
        return () => {};
    }),
    describeAuthError: vi.fn(() => "mensaje"),
}));

import { useAuthStore } from "./useAuthStore";

const DIDIER = {
    uid: "uid-didier",
    email: "didiermu3@gmail.com",
    displayName: "Didier",
};

beforeEach(() => {
    authState.currentUser = null;
    authState.onUser = null;
    useAuthStore.setState({
        user: null,
        initializing: true,
        migrating: false,
        error: null,
    });
});

describe("useAuthStore", () => {
    it("arranca en initializing hasta que la sesión se resuelve", () => {
        expect(useAuthStore.getState().initializing).toBe(true);
        expect(useAuthStore.getState().user).toBeNull();
    });

    it("guarda el usuario cuando Firebase Auth lo notifica", async () => {
        await useAuthStore.getState().init(() => {});

        authState.onUser(DIDIER);

        expect(useAuthStore.getState().user).toEqual(DIDIER);
        expect(useAuthStore.getState().initializing).toBe(false);
    });

    it("ejecuta el callback con el usuario para que AuthGate prepare sus datos", async () => {
        const onUserAuthenticated = vi.fn();
        await useAuthStore.getState().init(onUserAuthenticated);

        authState.onUser(DIDIER);

        expect(onUserAuthenticated).toHaveBeenCalledWith(DIDIER);
    });

    it("deja de inicializar al cerrar sesión", async () => {
        await useAuthStore.getState().init(() => {});

        authState.onUser(DIDIER);
        authState.onUser(null);

        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().initializing).toBe(false);
    });

    it("no llama al callback de preparación cuando no hay sesión", async () => {
        const onUserAuthenticated = vi.fn();
        await useAuthStore.getState().init(onUserAuthenticated);

        authState.onUser(null);

        expect(onUserAuthenticated).not.toHaveBeenCalled();
    });

    it("login deja el usuario en el store", async () => {
        authState.currentUser = DIDIER;

        await useAuthStore.getState().login();

        expect(useAuthStore.getState().user).toEqual(DIDIER);
        expect(useAuthStore.getState().error).toBeNull();
    });

    it("login propaga el error en el store", async () => {
        const { signInWithGoogle } = await import("../services/authService");
        signInWithGoogle.mockRejectedValueOnce({
            code: "auth/popup-closed-by-user",
        });

        await expect(useAuthStore.getState().login()).rejects.toThrow();

        expect(useAuthStore.getState().error).toBe("mensaje");
    });

    it("inicia sesión con correo y guarda el usuario", async () => {
        await useAuthStore
            .getState()
            .loginWithEmail("didier@example.com", "clave123");

        expect(useAuthStore.getState().user).toEqual(DIDIER);
        expect(useAuthStore.getState().error).toBeNull();
    });

    it("registra por correo con nombre y guarda el usuario", async () => {
        const { signUpWithEmail } = await import("../services/authService");

        await useAuthStore
            .getState()
            .registerWithEmail("ana@example.com", "clave123", "Ana");

        expect(signUpWithEmail).toHaveBeenCalledWith(
            "ana@example.com",
            "clave123",
            "Ana",
        );
        expect(useAuthStore.getState().user).toEqual(DIDIER);
    });

    it("logout limpia el usuario y el error", async () => {
        await useAuthStore.getState().init(() => {});
        authState.onUser(DIDIER);
        useAuthStore.setState({ error: "algo" });

        await useAuthStore.getState().logout();

        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().error).toBeNull();
    });

    it("clearError borra el mensaje de error", async () => {
        useAuthStore.setState({ error: "algo" });
        useAuthStore.getState().clearError();
        expect(useAuthStore.getState().error).toBeNull();
    });
});
