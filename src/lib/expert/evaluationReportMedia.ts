import { getExpertMediaFetchInit } from "@/lib/expert/apiClient";
import { isUnusableMediaUrl } from "@/lib/expert/mediaUrls";

export const REPORT_MEDIA_PROXY_PATH = "/api/expert/media";
export const TRANSPARENT_PIXEL_DATA_URL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const MEDIA_FETCH_TIMEOUT_MS = 20_000;
const IMAGE_LOAD_TIMEOUT_MS = 20_000;
const MAX_CANVAS_IMAGE_EDGE_PX = 1600;
const LOG_PREFIX = "[evaluation-report-pdf]";

export type ReportMediaFetchFailure = {
  url: string;
  proxyUrl: string;
  status?: number;
  contentType?: string;
  reason: string;
};

export type FetchReportMediaResult = {
  dataUrl: string | null;
  failure?: ReportMediaFetchFailure;
};

export function unwrapReportMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  try {
    const parsed = trimmed.startsWith("/")
      ? new URL(trimmed, "http://localhost")
      : new URL(trimmed);
    const isProxy =
      parsed.pathname === REPORT_MEDIA_PROXY_PATH ||
      parsed.pathname.endsWith("/api/expert/media");
    if (isProxy) {
      const nested = parsed.searchParams.get("url")?.trim();
      if (nested) return unwrapReportMediaUrl(nested);
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

export function reportMediaFetchUrl(url: string): string {
  const original = unwrapReportMediaUrl(url);
  if (!original) return "";
  if (original.startsWith("data:") || original.startsWith("blob:")) {
    return original;
  }
  if (original.startsWith("/")) return original;
  if (isUnusableMediaUrl(original)) return "";
  return `${REPORT_MEDIA_PROXY_PATH}?url=${encodeURIComponent(original)}`;
}

export function redactMediaUrlForLog(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) {
    const mime = trimmed.slice(5, trimmed.indexOf(";")) || "unknown";
    return `data:${mime};[redacted]`;
  }

  try {
    const parsed = trimmed.startsWith("/")
      ? new URL(trimmed, "http://localhost")
      : new URL(trimmed);
    for (const key of ["token", "Signature", "X-Amz-Signature", "X-Goog-Signature"]) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, "[redacted]");
      }
    }
    const nested = parsed.searchParams.get("url");
    if (nested) {
      parsed.searchParams.set("url", redactMediaUrlForLog(nested));
    }
    if (trimmed.startsWith("/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
    return parsed.toString();
  } catch {
    return trimmed.split("?")[0] ?? trimmed;
  }
}

export function logReportMediaFailure(failure: ReportMediaFetchFailure): void {
  console.warn(`${LOG_PREFIX} image inlining failed`, {
    url: redactMediaUrlForLog(failure.url),
    proxyUrl: redactMediaUrlForLog(failure.proxyUrl),
    status: failure.status ?? null,
    contentType: failure.contentType ?? null,
    reason: failure.reason,
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Unable to read media as a data URL."));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Unable to read media as a data URL."));
    };
    reader.readAsDataURL(blob);
  });
}

function isSvgMedia(type: string): boolean {
  return /svg|xml/i.test(type);
}

function isHeicMedia(type: string): boolean {
  return /heic|heif/i.test(type);
}

async function blobToCanvasFriendlyDataUrl(blob: Blob): Promise<string> {
  const type = blob.type || "application/octet-stream";
  if (isSvgMedia(type)) {
    return blobToDataUrl(blob);
  }

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      const scale = Math.min(
        1,
        MAX_CANVAS_IMAGE_EDGE_PX / Math.max(bitmap.width, bitmap.height, 1),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        bitmap.close();
        return blobToDataUrl(blob);
      }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      return canvas.toDataURL("image/png");
    } catch (error) {
      console.warn(`${LOG_PREFIX} createImageBitmap failed; using original bytes`, {
        contentType: type,
        reason: error instanceof Error ? error.message : "decode failed",
      });
    }
  }

  return blobToDataUrl(blob);
}

export async function fetchReportMediaAsDataUrl(
  url: string,
): Promise<FetchReportMediaResult> {
  const originalUrl = unwrapReportMediaUrl(url);
  if (originalUrl.startsWith("data:")) {
    return { dataUrl: originalUrl };
  }
  if (originalUrl.startsWith("blob:")) {
    return { dataUrl: originalUrl };
  }

  const fetchUrl = reportMediaFetchUrl(originalUrl);
  if (!fetchUrl) {
    return {
      dataUrl: null,
      failure: {
        url: originalUrl,
        proxyUrl: "",
        reason: "unusable or empty media URL",
      },
    };
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), MEDIA_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      fetchUrl,
      getExpertMediaFetchInit(controller.signal),
    );
    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok) {
      return {
        dataUrl: null,
        failure: {
          url: originalUrl,
          proxyUrl: fetchUrl,
          status: response.status,
          contentType,
          reason: `HTTP ${response.status}`,
        },
      };
    }

    const blob = await response.blob();
    if (!blob.size) {
      return {
        dataUrl: null,
        failure: {
          url: originalUrl,
          proxyUrl: fetchUrl,
          status: response.status,
          contentType: blob.type || contentType,
          reason: "empty media body",
        },
      };
    }

    const effectiveType = blob.type || contentType;
    if (isHeicMedia(effectiveType)) {
      console.warn(`${LOG_PREFIX} HEIC/HEIF may not render in PDF capture`, {
        url: redactMediaUrlForLog(originalUrl),
        contentType: effectiveType,
      });
    }

    return { dataUrl: await blobToCanvasFriendlyDataUrl(blob) };
  } catch (error) {
    const reason =
      error instanceof DOMException && error.name === "AbortError"
        ? "request timed out"
        : error instanceof Error
          ? error.message
          : "fetch failed";
    return {
      dataUrl: null,
      failure: {
        url: originalUrl,
        proxyUrl: fetchUrl,
        reason,
      },
    };
  } finally {
    window.clearTimeout(timer);
  }
}

export function prepareExportImageElement(image: HTMLImageElement): void {
  image.removeAttribute("loading");
  image.setAttribute("loading", "eager");
  image.loading = "eager";
  image.removeAttribute("crossorigin");
}

function imageHasRenderablePixels(image: HTMLImageElement): boolean {
  return image.naturalWidth > 0 && image.naturalHeight > 0;
}

export function waitForImageLoad(image: HTMLImageElement): Promise<void> {
  const src = image.currentSrc || image.src;
  if (!src) {
    return Promise.reject(new Error("Image has no src"));
  }

  const finishDecoded = async () => {
    if (typeof image.decode === "function") {
      await image.decode();
    }
    if (!imageHasRenderablePixels(image)) {
      throw new Error("Image decoded with zero size");
    }
  };

  if (image.complete) {
    return finishDecoded();
  }

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
      window.clearTimeout(timer);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onLoad = () => {
      void finishDecoded().then(() => finish()).catch((error) => {
        finish(error instanceof Error ? error : new Error("Image failed to decode"));
      });
    };
    const onError = () => {
      finish(new Error("Image failed to load"));
    };
    const timer = window.setTimeout(() => {
      finish(new Error("Image load timed out"));
    }, IMAGE_LOAD_TIMEOUT_MS);

    image.addEventListener("load", onLoad);
    image.addEventListener("error", onError);

    if (image.complete) {
      onLoad();
    }
  });
}

function applyTransparentFallback(image: HTMLImageElement): void {
  prepareExportImageElement(image);
  image.src = TRANSPARENT_PIXEL_DATA_URL;
}

function resolveCachedDataUrl(
  rawSrc: string,
  resolveMediaUrl: (url: string) => string,
): string {
  const originalUrl = unwrapReportMediaUrl(rawSrc);
  const candidates = [originalUrl, rawSrc.trim()];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const resolved = resolveMediaUrl(candidate);
    if (resolved.startsWith("data:")) return resolved;
  }
  return "";
}

async function inlineSingleExportImage(
  image: HTMLImageElement,
  resolveMediaUrl: (url: string) => string,
): Promise<void> {
  prepareExportImageElement(image);

  const rawSrc = (image.getAttribute("src") || image.src || "").trim();
  if (!rawSrc) return;

  if (rawSrc === TRANSPARENT_PIXEL_DATA_URL) {
    return;
  }

  if (rawSrc.startsWith("data:")) {
    try {
      await waitForImageLoad(image);
    } catch (error) {
      logReportMediaFailure({
        url: rawSrc,
        proxyUrl: "",
        reason:
          error instanceof Error ? error.message : "data URL image failed to load",
      });
      applyTransparentFallback(image);
    }
    return;
  }

  let dataUrl = resolveCachedDataUrl(rawSrc, resolveMediaUrl);
  if (!dataUrl) {
    const result = await fetchReportMediaAsDataUrl(rawSrc);
    if (result.dataUrl) {
      dataUrl = result.dataUrl;
    } else if (result.failure) {
      logReportMediaFailure(result.failure);
    }
  }

  if (dataUrl && dataUrl !== TRANSPARENT_PIXEL_DATA_URL) {
    image.src = dataUrl;
    try {
      await waitForImageLoad(image);
      return;
    } catch (error) {
      logReportMediaFailure({
        url: unwrapReportMediaUrl(rawSrc),
        proxyUrl: reportMediaFetchUrl(rawSrc),
        reason:
          error instanceof Error
            ? error.message
            : "inlined image failed to load before capture",
      });
    }
  }

  applyTransparentFallback(image);
}

/** Replace remote <img> URLs in an export clone with canvas-safe data URLs. */
export async function inlineImagesInRoot(
  root: ParentNode,
  resolveMediaUrl: (url: string) => string = reportMediaFetchUrl,
): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((image) => inlineSingleExportImage(image, resolveMediaUrl)),
  );
}

export async function prefetchReportMediaDataUrls(
  urls: Iterable<string>,
): Promise<Map<string, string>> {
  const cache = new Map<string, string>();
  const unique = [...new Set([...urls].map((url) => url.trim()).filter(Boolean))];

  await Promise.all(
    unique.map(async (url) => {
      const result = await fetchReportMediaAsDataUrl(url);
      if (result.dataUrl) {
        cache.set(url, result.dataUrl);
        cache.set(unwrapReportMediaUrl(url), result.dataUrl);
        return;
      }
      if (result.failure) logReportMediaFailure(result.failure);
    }),
  );

  return cache;
}
