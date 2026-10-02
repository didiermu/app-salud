import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        hot: true,
        open: true,
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
            "Cross-Origin-Embedder-Policy": "unsafe-none",
        },
    },
    plugins: [react()],
    test: {
        environment: "node",
        globals: true,
        setupFiles: ["./src/test/setup.js"],
    },
});
