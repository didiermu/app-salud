import React, { useEffect, useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    NavLink,
    useLocation,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Catalog from "./pages/Catalog";
import Routines from "./pages/Routines";
import Workout from "./pages/Workout";
import CountdownTimer from "./components/CountdownTimer";
import AuthGate from "./components/AuthGate";
import ThemeToggle from "./components/ThemeToggle";
import { useAuthStore } from "./store/useAuthStore";
import {
    LayoutDashboard,
    User,
    Dumbbell,
    Search,
    Activity,
    Timer,
    X,
    LogOut,
} from "lucide-react";
import clsx from "clsx";

// Componente para restaurar el scroll al cambiar de página
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

// Componente para manejar la estructura de navegación dinámica
const Layout = ({ children }) => {
    const [showTimerModal, setShowTimerModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navItems = [
        { path: "/", label: "Inicio", icon: <LayoutDashboard size={24} /> },
        { path: "/catalog", label: "Explorar", icon: <Search size={24} /> },
        { path: "/routines", label: "Planes", icon: <Dumbbell size={24} /> },
        { path: "/profile", label: "Perfil", icon: <User size={24} /> },
    ];

    return (
        <div className="min-h-[100dvh] bg-neutral-50 flex flex-col font-sans">
            {/* 💻 TOP NAVIGATION (Solo Desktop) */}
            <nav className="hidden md:block bg-white border-b border-neutral-100 sticky top-0 z-[100] shadow-sm">
                <div className="max-w-7xl mx-auto px-8 h-20 flex justify-between items-center">
                    <Link
                        to="/"
                        className="text-2xl font-black text-neutral-900 tracking-tighter flex items-center gap-2"
                    >
                        <Activity className="text-blue-600" />
                        SALUD<span className="text-neutral-400">APP</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTimerModal(true)}
                            className="p-2.5 rounded-2xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-all"
                            title="Cronómetro"
                        >
                            <Timer size={20} />
                        </button>
                        <ThemeToggle />
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    clsx(
                                        "px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all",
                                        isActive
                                            ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200/50"
                                            : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
                                    )
                                }
                            >
                                {React.cloneElement(item.icon, { size: 18 })}
                                <span className="uppercase tracking-widest text-[10px]">
                                    {item.label}
                                </span>
                            </NavLink>
                        ))}
                        {user?.photoURL && (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || "Tu perfil"}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-2xl object-cover border-2 border-neutral-100 ml-1"
                            />
                        )}
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="p-2.5 rounded-2xl text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all"
                            title="Cerrar sesión"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* 📱 BOTTOM NAVIGATION (Solo Mobile - Estilo App Nativa) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-neutral-100 z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div className="flex justify-around items-center px-2 py-3 h-20">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="w-full h-full"
                        >
                            {({ isActive }) => (
                                <div
                                    className={clsx(
                                        "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all relative",
                                        isActive
                                            ? "text-neutral-900"
                                            : "text-neutral-400",
                                    )}
                                >
                                    <div
                                        className={clsx(
                                            "p-1.5 rounded-xl transition-all duration-300",
                                            isActive
                                                ? "bg-neutral-100 scale-110"
                                                : "bg-transparent scale-100",
                                        )}
                                    >
                                        {item.icon}
                                    </div>
                                    <span
                                        className={clsx(
                                            "text-[9px] font-bold tracking-widest uppercase transition-all duration-300",
                                            isActive
                                                ? "opacity-100 translate-y-0"
                                                : "opacity-0 -translate-y-1 absolute bottom-0",
                                        )}
                                    >
                                        {item.label}
                                    </span>
                                </div>
                            )}
                        </NavLink>
                    ))}
                    <button
                        onClick={() => setShowTimerModal(true)}
                        className="w-full h-full flex flex-col items-center justify-center space-y-1 text-neutral-400"
                    >
                        <div className="p-1.5 rounded-xl">
                            <Timer size={24} />
                        </div>
                    </button>
                </div>
            </nav>

            {/* Barra de cuenta (Solo Mobile) */}
            <div className="md:hidden bg-white border-b border-neutral-100 px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    {user?.photoURL && (
                        <img
                            src={user.photoURL}
                            alt={user.displayName || "Tu perfil"}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover bg-neutral-100 shrink-0"
                        />
                    )}
                    <div className="min-w-0">
                        <p className="text-[11px] font-black text-neutral-900 truncate leading-tight">
                            {user?.displayName || "Atleta"}
                        </p>
                        <p className="text-[9px] font-bold text-neutral-400 truncate leading-tight">
                            {user?.email}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="p-2.5 rounded-2xl text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all shrink-0"
                        title="Cerrar sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Modal Cronómetro */}
            {showTimerModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div
                        className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm"
                        onClick={() => setShowTimerModal(false)}
                    />
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-500">
                        <button
                            onClick={() => setShowTimerModal(false)}
                            className="absolute top-4 right-4 p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors text-neutral-600"
                        >
                            <X size={18} />
                        </button>
                        <CountdownTimer />
                    </div>
                </div>
            )}

            {/* Modal de Confirmación: Cerrar Sesión */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div
                        className="absolute inset-0 bg-neutral-900/90 backdrop-blur-md"
                        onClick={() => setShowLogoutModal(false)}
                    />
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 relative z-10 flex flex-col items-center text-center shadow-2xl">
                        <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6 shadow-xl">
                            <LogOut size={36} />
                        </div>
                        <h3 className="text-3xl font-black text-neutral-900 uppercase tracking-tighter mb-2">
                            ¿Cerrar Sesión?
                        </h3>
                        <p className="text-neutral-500 font-bold text-sm mb-8 leading-relaxed">
                            Tus rutinas y registros se guardan en la nube.
                            Podrás volver a entrar cuando quieras con tu cuenta
                            de Google.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-4 bg-neutral-100 text-neutral-600 font-bold rounded-2xl hover:bg-neutral-200 transition-colors uppercase tracking-widest text-[10px]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    setShowLogoutModal(false);
                                    logout();
                                }}
                                className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-200 uppercase tracking-widest text-[10px]"
                            >
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 📌 MAIN CONTENT */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8 pt-4 md:pt-8">
                {children}
            </main>
        </div>
    );
};

function App() {
    return (
        <Router>
            <ScrollToTop />
            <AuthGate>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/catalog" element={<Catalog />} />
                        <Route path="/routines" element={<Routines />} />
                        <Route path="/workout/:id" element={<Workout />} />
                    </Routes>
                </Layout>
            </AuthGate>
        </Router>
    );
}

export default App;
