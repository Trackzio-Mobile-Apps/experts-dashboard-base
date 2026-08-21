/**
 * White-label env (company standard).
 *
 * Client-safe vars: `APP_*`, `API_BASE_URL`, `SOCKET_URL`
 * (not VITE_ / NEXT_PUBLIC_). Values are inlined at `npm run build`.
 */

function readAppEnv(key: string): string {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof value === "string" ? value.trim() : "";
}

export function getAppSlug(): string {
  const slug = readAppEnv("APP_SLUG")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  return slug || "expert";
}

export const appEnv = {
  name: readAppEnv("APP_NAME"),
  title: readAppEnv("APP_TITLE"),
  logoUrl: readAppEnv("APP_LOGO_URL"),
  faviconUrl: readAppEnv("APP_FAVICON_URL"),
  reportName: readAppEnv("APP_REPORT_NAME"),
  slug: getAppSlug(),
  apiBaseUrl: readAppEnv("API_BASE_URL").replace(/\/$/, ""),
  socketUrl: readAppEnv("SOCKET_URL").replace(/\/$/, ""),
};

export function storageKey(suffix: string): string {
  return `${getAppSlug()}.${suffix}`;
}

export const STORAGE_KEYS = {
  profile: storageKey("expert.profile"),
  jwt: storageKey("expert.jwt"),
  loginSuccess: storageKey("expert.loginSuccess"),
  accountDisabled: storageKey("expert.accountDisabled"),
  evalDraftPrefix: storageKey("expert.evalDraft."),
  evalReportIdPrefix: storageKey("expert.evalReportId."),
  extendedProfilePrefix: storageKey("expert.extendedProfile."),
  deadlineExceededToast: storageKey("expert.deadlineExceededToast"),
  evaluationDueSoonPrompt: storageKey("expert.showEvaluationDueSoonPrompt"),
};
