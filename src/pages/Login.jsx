import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Activity, LogIn, Loader2, Mail, Lock, UserRound, Eye, EyeOff } from 'lucide-react';

/** Botón con el logo oficial de Google (los logos de marca no están en lucide). */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z" />
  </svg>
);

const Login = () => {
  const login = useAuthStore((state) => state.login);
  const loginWithEmail = useAuthStore((state) => state.loginWithEmail);
  const registerWithEmail = useAuthStore((state) => state.registerWithEmail);
  const error = useAuthStore((state) => state.error);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login();
    } catch {
      // El mensaje ya quedó en el store; el usuario ve el banner.
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch {
      // El mensaje traducido ya quedó en el store.
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    useAuthStore.getState().clearError();
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-50 flex flex-col items-center justify-center px-6 py-12 font-sans">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-neutral-900 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-neutral-200">
            <Activity size={36} />
          </div>
          <h1 className="text-4xl font-black text-neutral-900 tracking-tighter uppercase">
            Salud<span className="text-neutral-400">App</span>
          </h1>
          <p className="text-neutral-500 font-medium text-sm leading-relaxed">
            Tu entrenamiento, tus rutinas y tu progreso.
            <br />
            Inicia sesión para sincronizarlo en la nube.
          </p>
        </div>

        <div className="space-y-5">
          <form onSubmit={handleEmailSubmit} className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl shadow-neutral-200/40">
            <h2 className="text-center text-xs font-black uppercase tracking-widest text-neutral-700">
              {mode === 'register' ? 'Crear cuenta con correo' : 'Iniciar sesión con correo'}
            </h2>
            {mode === 'register' && (
              <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 focus-within:border-neutral-900">
                <UserRound size={17} className="text-neutral-400" />
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nombre"
                  aria-label="Nombre"
                  required
                  maxLength={80}
                  className="w-full py-3 text-sm outline-none"
                />
              </label>
            )}
            <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 focus-within:border-neutral-900">
              <Mail size={17} className="text-neutral-400" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Correo electrónico"
                aria-label="Correo electrónico"
                required
                className="w-full py-3 text-sm outline-none"
              />
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 focus-within:border-neutral-900">
              <Lock size={17} className="text-neutral-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Contraseña (mínimo 6 caracteres)"
                aria-label="Contraseña"
                required
                minLength={6}
                className="w-full py-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="flex-shrink-0 rounded-md p-1 text-neutral-400 transition-colors hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-neutral-700 disabled:opacity-60"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
              {mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
            <p className="text-center text-xs text-neutral-500">
              {mode === 'register' ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
              <button
                type="button"
                onClick={() => changeMode(mode === 'register' ? 'login' : 'register')}
                className="font-bold text-neutral-900 underline underline-offset-2"
              >
                {mode === 'register' ? 'Inicia sesión' : 'Regístrate'}
              </button>
            </p>
          </form>

          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-neutral-300">
            <span className="h-px flex-1 bg-neutral-200" />
            <span>o continúa con</span>
            <span className="h-px flex-1 bg-neutral-200" />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-4 bg-white border-2 border-neutral-200 hover:border-neutral-900 text-neutral-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-neutral-200/50 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60 disabled:active:scale-100"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Conectando
              </>
            ) : (
              <>
                <GoogleIcon />
                Continuar con Google
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border-2 border-red-100 text-red-600 p-4 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-neutral-300">
            <LogIn size={14} />
            <span className="text-[9px] font-bold uppercase tracking-widest">
              Acceso seguro con correo electrónico o Google
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
