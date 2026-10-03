import { describe, expect, it, vi } from "vitest";

const firebaseAuthMocks = vi.hoisted(() => ({
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    updateProfile: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
    Capacitor: { isNativePlatform: () => false },
}));

vi.mock("@capacitor/browser", () => ({
    Browser: { close: vi.fn(async () => {}) },
}));

vi.mock("@capacitor/app", () => ({
    App: { addListener: vi.fn() },
}));

vi.mock("../firebase", () => ({ db: undefined, auth: {} }));

vi.mock("firebase/auth", () => ({
    ...firebaseAuthMocks,
    GoogleAuthProvider: class {},
    getRedirectResult: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signInWithRedirect: vi.fn(),
    signOut: vi.fn(),
}));

import {
    describeAuthError,
    signInWithEmail,
    signUpWithEmail,
} from "./authService";

describe("describeAuthError", () => {
    it("traduce los errores conocidos de Firebase", () => {
        expect(describeAuthError({ code: "auth/popup-closed-by-user" })).toBe(
            "Cerraste la ventana de inicio de sesión.",
        );
        expect(describeAuthError({ code: "auth/network-request-failed" })).toBe(
            "Sin conexión con el servidor. Revisa tu red.",
        );
    });

    it("explica cuando Google no está habilitado en la consola", () => {
        expect(
            describeAuthError({ code: "auth/operation-not-allowed" }),
        ).toContain("consola de Firebase");
    });

    it("explica cuando el dominio no está autorizado", () => {
        expect(
            describeAuthError({ code: "auth/unauthorized-domain" }),
        ).toContain("autorizado");
    });

    it("cae en un mensaje genérico ante errores desconocidos", () => {
        expect(describeAuthError({ code: "auth/lo-que-sea" })).toBe(
            "No pudimos completar la solicitud. Inténtalo de nuevo.",
        );
        expect(describeAuthError(undefined)).toBe(
            "No pudimos completar la solicitud. Inténtalo de nuevo.",
        );
    });

    it("traduce los errores habituales de registro e inicio con correo", () => {
        expect(
            describeAuthError({ code: "auth/email-already-in-use" }),
        ).toContain("Ya existe una cuenta");
        expect(describeAuthError({ code: "auth/weak-password" })).toContain(
            "6 caracteres",
        );
        expect(
            describeAuthError({ code: "auth/invalid-credential" }),
        ).toContain("incorrectos");
    });
});

describe("autenticación por correo", () => {
    it("crea la cuenta, normaliza el correo y asigna el nombre visible", async () => {
        const user = { uid: "uid-nuevo" };
        firebaseAuthMocks.createUserWithEmailAndPassword.mockResolvedValueOnce({
            user,
        });

        await expect(
            signUpWithEmail("  atleta@example.com ", "clave123", " Ana "),
        ).resolves.toBe(user);

        expect(
            firebaseAuthMocks.createUserWithEmailAndPassword,
        ).toHaveBeenCalledWith(
            expect.anything(),
            "atleta@example.com",
            "clave123",
        );
        expect(firebaseAuthMocks.updateProfile).toHaveBeenCalledWith(user, {
            displayName: "Ana",
        });
    });

    it("inicia sesión con correo y contraseña", async () => {
        const user = { uid: "uid-existente" };
        firebaseAuthMocks.signInWithEmailAndPassword.mockResolvedValueOnce({
            user,
        });

        await expect(
            signInWithEmail(" atleta@example.com ", "clave123"),
        ).resolves.toBe(user);

        expect(
            firebaseAuthMocks.signInWithEmailAndPassword,
        ).toHaveBeenCalledWith(
            expect.anything(),
            "atleta@example.com",
            "clave123",
        );
    });
});
