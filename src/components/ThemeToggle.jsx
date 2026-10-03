import { useState } from "react";
import { Moon, Sun } from "lucide-react";

const getInitialTheme = () => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
};

const ThemeToggle = ({ className = "" }) => {
    const [isDark, setIsDark] = useState(getInitialTheme);

    const toggleTheme = () => {
        const nextIsDark = !isDark;
        document.documentElement.classList.toggle("dark", nextIsDark);
        try {
            localStorage.setItem(
                "saludapp-theme",
                nextIsDark ? "dark" : "light",
            );
        } catch {
            // El tema sigue funcionando aunque el navegador bloquee localStorage.
        }
        setIsDark(nextIsDark);
    };

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
            title={isDark ? "Activar tema claro" : "Activar tema oscuro"}
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${className}`}
        >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
    );
};

export default ThemeToggle;
