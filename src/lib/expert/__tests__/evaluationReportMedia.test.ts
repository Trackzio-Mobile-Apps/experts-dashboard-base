// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/config";
import { getExpertMediaFetchInit } from "@/lib/expert/apiClient";
import {
  TRANSPARENT_PIXEL_DATA_URL,
  blobToDataUrl,
  fetchReportMediaAsDataUrl,
  inlineImagesInRoot,
  prefetchReportMediaDataUrls,
  redactMediaUrlForLog,
  reportMediaFetchUrl,
  unwrapReportMediaUrl,
  waitForImageLoad,
} from "@/lib/expert/evaluationReportMedia";

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const FIREBASE_URL =
  "https://firebasestorage.googleapis.com/v0/b/coinzy.appspot.com/o/coins%2Fobverse.jpg?alt=media&token=secret-token";

function pngBlob(): Blob {
  const bytes = Uint8Array.from(atob(PNG_BASE64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: "image/png" });
}

function pngResponse(): Response {
  return new Response(pngBlob(), {
    status: 200,
    headers: { "Content-Type": "image/png" },
  });
}

describe("report media URL helpers", () => {
  it("unwraps a proxied media URL back to the storage URL", () => {
    const proxied = `/api/expert/media?url=${encodeURIComponent(FIREBASE_URL)}`;
    expect(unwrapReportMediaUrl(proxied)).toBe(FIREBASE_URL);
  });

  it("builds a single encoded proxy URL and does not double-wrap", () => {
    const proxied = `/api/expert/media?url=${encodeURIComponent(FIREBASE_URL)}`;
    expect(reportMediaFetchUrl(FIREBASE_URL)).toBe(proxied);
    expect(reportMediaFetchUrl(proxied)).toBe(proxied);
  });

  it("leaves same-origin logo paths unproxied", () => {
    expect(reportMediaFetchUrl("/coinzy-logo.png")).toBe("/coinzy-logo.png");
  });

  it("redacts storage tokens from diagnostic URLs", () => {
    expect(redactMediaUrlForLog(FIREBASE_URL)).toContain("token=%5Bredacted%5D");
    expect(redactMediaUrlForLog(FIREBASE_URL)).not.toContain("secret-token");
  });
});

describe("getExpertMediaFetchInit", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("sends the existing session JWT as Bearer without putting it in the URL", () => {
    sessionStorage.setItem(STORAGE_KEYS.jwt, "test-token");
    const init = getExpertMediaFetchInit();
    const headers = new Headers(init.headers);

    expect(headers.get("Authorization")).toBe("Bearer test-token");
    expect(headers.get("Content-Type")).toBeNull();
    expect(["omit", "include"]).toContain(init.credentials);
  });
});

describe("fetchReportMediaAsDataUrl", () => {
  beforeEach(() => {
    sessionStorage.setItem(STORAGE_KEYS.jwt, "test-token");
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("converts an authenticated proxy response into a data URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(pngResponse());
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchReportMediaAsDataUrl(FIREBASE_URL);

    expect(result.failure).toBeUndefined();
    expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(requestUrl).toBe(reportMediaFetchUrl(FIREBASE_URL));
    expect(requestUrl).not.toContain("test-token");
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer test-token",
    );
  });

  it("returns a logged failure for a non-200 media response", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: true, message: "Unauthorized." }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const result = await fetchReportMediaAsDataUrl(FIREBASE_URL);

    expect(result.dataUrl).toBeNull();
    expect(result.failure).toMatchObject({
      status: 401,
      contentType: "application/json",
      reason: "HTTP 401",
    });
    expect(result.failure?.url).toBe(FIREBASE_URL);
    expect(warn).not.toHaveBeenCalled();
  });

  it("converts a Blob to a data URL", async () => {
    const dataUrl = await blobToDataUrl(pngBlob());
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(dataUrl).toContain(PNG_BASE64);
  });
});

function stubDecodedImage(image: HTMLImageElement): void {
  Object.defineProperty(image, "complete", { configurable: true, get: () => true });
  Object.defineProperty(image, "naturalWidth", { configurable: true, get: () => 1 });
  Object.defineProperty(image, "naturalHeight", { configurable: true, get: () => 1 });
  image.decode = () => Promise.resolve();
}

describe("inlineImagesInRoot", () => {
  beforeEach(() => {
    sessionStorage.setItem(STORAGE_KEYS.jwt, "test-token");
    document.body.innerHTML = "";
  });

  afterEach(() => {
    sessionStorage.clear();
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("inlines multiple remote images as data URLs and disables lazy loading", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(pngResponse()));
    vi.stubGlobal("fetch", fetchMock);

    const first = document.createElement("img");
    first.setAttribute("src", FIREBASE_URL);
    first.setAttribute("loading", "lazy");
    stubDecodedImage(first);
    const second = document.createElement("img");
    second.setAttribute(
      "src",
      "https://firebasestorage.googleapis.com/v0/b/coinzy.appspot.com/o/coins%2Freverse.jpg?alt=media&token=other",
    );
    second.setAttribute("loading", "lazy");
    stubDecodedImage(second);
    document.body.append(first, second);

    await inlineImagesInRoot(document.body, (url) => url);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(first.getAttribute("loading")).toBe("eager");
    expect(second.getAttribute("loading")).toBe("eager");
    expect(first.src).toMatch(/^data:image\//);
    expect(second.src).toMatch(/^data:image\//);
    expect(first.getAttribute("crossorigin")).toBeNull();
  });

  it("uses the transparent fallback after logging a media failure", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("Unable to fetch media.", {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const image = document.createElement("img");
    image.setAttribute("src", FIREBASE_URL);
    stubDecodedImage(image);
    document.body.append(image);

    await inlineImagesInRoot(document.body, (url) => url);

    expect(image.src).toBe(TRANSPARENT_PIXEL_DATA_URL);
    expect(warn).toHaveBeenCalled();
    const logged = warn.mock.calls[0]?.[1] as { status?: number; reason?: string };
    expect(logged.status).toBe(502);
    expect(logged.reason).toBe("HTTP 502");
  });

  it("prefers a cached data URL instead of fetching again", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const cached = `data:image/png;base64,${PNG_BASE64}`;
    const image = document.createElement("img");
    image.setAttribute("src", FIREBASE_URL);
    stubDecodedImage(image);
    document.body.append(image);

    await inlineImagesInRoot(document.body, (url) =>
      url === FIREBASE_URL ? cached : url,
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(image.src).toBe(cached);
  });
});

describe("prefetchReportMediaDataUrls", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("caches successful URLs and logs failures without throwing", async () => {
    sessionStorage.setItem(STORAGE_KEYS.jwt, "test-token");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (String(url).includes("obverse")) return Promise.resolve(pngResponse());
        return Promise.resolve(
          new Response("missing", {
            status: 404,
            headers: { "Content-Type": "text/plain" },
          }),
        );
      }),
    );

    const cache = await prefetchReportMediaDataUrls([
      FIREBASE_URL,
      "https://firebasestorage.googleapis.com/v0/b/coinzy.appspot.com/o/missing.jpg?alt=media",
    ]);

    expect(cache.get(FIREBASE_URL)).toMatch(/^data:image\//);
    expect(cache.size).toBe(1);
    expect(warn).toHaveBeenCalled();
  });
});

describe("waitForImageLoad", () => {
  it("resolves when the image already has decoded pixels", async () => {
    const image = document.createElement("img");
    Object.defineProperty(image, "complete", { value: true });
    Object.defineProperty(image, "naturalWidth", { value: 64 });
    Object.defineProperty(image, "naturalHeight", { value: 64 });
    image.decode = () => Promise.resolve();
    image.src = `data:image/png;base64,${PNG_BASE64}`;

    await expect(waitForImageLoad(image)).resolves.toBeUndefined();
  });

  it("rejects when a data URL cannot be decoded", async () => {
    const image = document.createElement("img");
    Object.defineProperty(image, "complete", { value: true });
    Object.defineProperty(image, "naturalWidth", { value: 0 });
    Object.defineProperty(image, "naturalHeight", { value: 0 });
    image.decode = () => Promise.reject(new Error("broken"));
    image.src = "data:image/png;base64,not-an-image";

    await expect(waitForImageLoad(image)).rejects.toThrow("broken");
  });
});
