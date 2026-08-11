import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createExpertApiMiddleware } from "./server/expertApiMiddleware";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  // Prefer server-side EXPERT_API_BASE_URL, then Vite public vars.
  process.env.EXPERT_API_BASE_URL =
    env.EXPERT_API_BASE_URL ||
    env.VITE_EXPERT_API_BASE_URL ||
    process.env.EXPERT_API_BASE_URL ||
    "";
  process.env.VITE_EXPERT_API_BASE_URL =
    env.VITE_EXPERT_API_BASE_URL ||
    process.env.EXPERT_API_BASE_URL ||
    "";
  process.env.VITE_EXPERT_SOCKET_URL =
    env.VITE_EXPERT_SOCKET_URL ||
    env.VITE_EXPERT_API_BASE_URL ||
    process.env.EXPERT_API_BASE_URL ||
    "";

  const apiMiddleware = createExpertApiMiddleware();

  return {
    plugins: [
      react(),
      {
        name: "coinzy-expert-api",
        configureServer(server) {
          server.middlewares.use(apiMiddleware);
        },
        configurePreviewServer(server) {
          server.middlewares.use(apiMiddleware);
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "./src"),
      },
    },
    server: {
      port: 3000,
    },
    preview: {
      port: 3000,
    },
    build: {
      outDir: "dist",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;

            if (id.includes("socket.io")) {
              return "socket-vendor";
            }

            if (
              id.includes("/react-dom/") ||
              id.includes("/react/") ||
              id.includes("react-router") ||
              id.includes("scheduler")
            ) {
              return "react-vendor";
            }
          },
        },
      },
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        mode === "production" ? "production" : "development",
      ),
    },
  };
});
