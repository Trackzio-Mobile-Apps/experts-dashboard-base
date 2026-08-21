/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_NAME?: string;
  readonly APP_TITLE?: string;
  readonly APP_SLUG?: string;
  readonly APP_LOGO_URL?: string;
  readonly APP_FAVICON_URL?: string;
  readonly APP_REPORT_NAME?: string;
  readonly API_BASE_URL?: string;
  readonly SOCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
