import { describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@capacitor/browser', () => ({
  Browser: { close: vi.fn(async () => {}) },
}));

vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn() },
}));

vi.mock('../firebase', () => ({ db: undefined, auth: {} }));

import { describeAuthError } from './authService';

describe('describeAuthError', () => {
  it('traduce los errores conocidos de Firebase', () => {
    expect(describeAuthError({ code: 'auth/popup-closed-by-user' })).toBe(
      'Cerraste la ventana de inicio de sesión.'
    );
    expect(describeAuthError({ code: 'auth/network-request-failed' })).toBe(
      'Sin conexión con el servidor. Revisa tu red.'
    );
  });

  it('explica cuando Google no está habilitado en la consola', () => {
    expect(describeAuthError({ code: 'auth/operation-not-allowed' })).toContain(
      'consola de Firebase'
    );
  });

  it('explica cuando el dominio no está autorizado', () => {
    expect(describeAuthError({ code: 'auth/unauthorized-domain' })).toContain(
      'autorizado'
    );
  });

  it('cae en un mensaje genérico ante errores desconocidos', () => {
    expect(describeAuthError({ code: 'auth/lo-que-sea' })).toBe(
      'No pudimos iniciar sesión. Inténtalo de nuevo.'
    );
    expect(describeAuthError(undefined)).toBe(
      'No pudimos iniciar sesión. Inténtalo de nuevo.'
    );
  });
});
