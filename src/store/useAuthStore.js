import { create } from 'zustand';
import { auth } from '../firebase';
import {
  completeNativeSignIn,
  describeAuthError,
  listenForNativeRedirect,
  signInWithGoogle,
  signOut,
  subscribeToAuth,
} from '../services/authService';

/**
 * Estado de sesión del usuario.
 *
 * `initializing` cubre tanto la resolución inicial de Firebase Auth como
 * la migración de datos legados, para que la UI no llegue a renderizar
 * las páginas con datos sin scope.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  initializing: true,
  migrating: false,
  error: null,

  setMigrating: (migrating) => set({ migrating }),
  clearError: () => set({ error: null }),

  login: async () => {
    set({ error: null });
    try {
      await signInWithGoogle();
      if (auth.currentUser) {
        set({ user: auth.currentUser });
      }
    } catch (error) {
      set({ error: describeAuthError(error), initializing: false });
      throw error;
    }
  },

  logout: async () => {
    await signOut();
    set({ user: null, error: null });
  },

  /** Punto de entrada único: se llama una vez desde `AuthGate`. */
  init: async (onUserAuthenticated) => {
    set({ initializing: true });

    // Recupera el usuario si volvimos de un redirect nativo.
    try {
      const redirectUser = await completeNativeSignIn();
      if (redirectUser) {
        set({ user: redirectUser, initializing: true });
        await onUserAuthenticated?.(redirectUser);
        set({ initializing: false });
        return subscribeToAuth(
          (user) => {
            if (!user) {
              set({ user: null, initializing: false });
            }
          },
          (error) => {
            set({ error: describeAuthError(error), initializing: false });
          }
        );
      }
    } catch (error) {
      set({ error: describeAuthError(error) });
    }

    listenForNativeRedirect(() => {
      completeNativeSignIn()
        .then(async (user) => {
          if (user) {
            set({ user, initializing: true });
            await onUserAuthenticated?.(user);
            set({ initializing: false });
          }
        })
        .catch((error) => set({ error: describeAuthError(error), initializing: false }));
    });

    return subscribeToAuth(
      (user) => {
        if (user) {
          set({ user, initializing: false });
          onUserAuthenticated?.(user);
        } else {
          set({ user: null, initializing: false });
        }
      },
      (error) => {
        set({ error: describeAuthError(error), initializing: false });
      }
    );
  },

  isReady: () => !get().initializing,
}));
