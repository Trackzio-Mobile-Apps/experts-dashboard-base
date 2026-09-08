import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createExpertApiMiddleware } from "./server/expertApiMiddleware";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function applyServerEnv(env: Record<string, string>): void {
  process.env.API_BASE_URL =
    env.API_BASE_URL || env.EXPERT_API_BASE_URL || process.env.API_BASE_URL || "";
  process.env.SOCKET_URL =
    env.SOCKET_URL ||
    env.EXPERT_API_BASE_URL ||
    process.env.SOCKET_URL ||
    "";
  process.env.APP_SLUG = env.APP_SLUG || process.env.APP_SLUG || "expert";
}

export default defineConfig(({ mode, command }) => {
  // Vite's loadEnv never overwrites existing process.env. An in-process
  // restart (e.g. after editing .env.local) would otherwise keep the first
  // API_BASE_URL. Clear these so the env files are the source of truth.
  delete process.env.API_BASE_URL;
  delete process.env.EXPERT_API_BASE_URL;
  delete process.env.SOCKET_URL;

  applyServerEnv(loadEnv(mode, rootDir, ""));

  const apiMiddleware = createExpertApiMiddleware();

  return {
    envPrefix: ["APP_", "API_", "SOCKET_"],
    plugins: [
      react(),
      {
        name: "expert-api",
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
        command === "build" ? "production" : "development",
      ),
    },
  };
});
