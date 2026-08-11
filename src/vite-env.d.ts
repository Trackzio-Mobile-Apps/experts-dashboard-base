/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EXPERT_API_BASE_URL?: string;
  readonly VITE_EXPERT_SOCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
