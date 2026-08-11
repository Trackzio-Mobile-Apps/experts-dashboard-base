import type { VercelRequest, VercelResponse } from "@vercel/node";
import { COUNTRIES_API_URL } from "./_lib/expertBackend";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const response = await fetch(COUNTRIES_API_URL, { cache: "no-store" });
    if (!response.ok) {
      return res.status(502).json({
        error: true,
        message: "Countries service returned an error.",
        data: [],
      });
    }

    const payload = (await response.json()) as {
      error: boolean;
      data: Array<{ name: string; Iso2: string }>;
    };

    if (payload.error || !Array.isArray(payload.data)) {
      return res.status(502).json({
        error: true,
        message: "Unable to load countries.",
        data: [],
      });
    }

    const countries = payload.data
      .filter(
        (item) =>
          typeof item.name === "string" &&
          item.name.trim() &&
          typeof item.Iso2 === "string" &&
          item.Iso2.trim(),
      )
      .map((item) => ({
        code: item.Iso2.trim().toUpperCase(),
        name: item.name.trim(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({
      error: false,
      message: null,
      data: { countries },
    });
  } catch {
    return res.status(502).json({
      error: true,
      message: "Unable to reach countries service.",
      data: [],
    });
  }
}
