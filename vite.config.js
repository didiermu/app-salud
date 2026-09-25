import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        hot: true,
        open: true,
    },
    plugins: [react()],
    test: {
        environment: "node",
        globals: true,
        setupFiles: ["./src/test/setup.js"],
    },
});
