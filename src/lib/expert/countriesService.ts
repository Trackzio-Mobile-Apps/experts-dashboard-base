const COUNTRIES_API_URL =
  "https://countriesnow.space/api/v0.1/countries/iso";

export type Country = {
  code: string;
  name: string;
};

export class CountriesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CountriesError";
  }
}

let cachedCountries: Country[] | null = null;
let inflight: Promise<Country[]> | null = null;

export function resolveCountryLabel(
  value: string,
  countries: Country[],
): string {
  const trimmed = value.trim();
  if (!trimmed) return "—";

  const byCode = countries.find(
    (country) => country.code.toUpperCase() === trimmed.toUpperCase(),
  );
  if (byCode) return byCode.name;

  const byName = countries.find(
    (country) => country.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (byName) return byName.name;

  return trimmed;
}

export function resolveCountryCode(
  value: string,
  countries: Country[],
): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const byCode = countries.find(
    (country) => country.code.toUpperCase() === trimmed.toUpperCase(),
  );
  if (byCode) return byCode.code;

  const byName = countries.find(
    (country) => country.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (byName) return byName.code;

  return trimmed;
}

export async function getCountries(): Promise<Country[]> {
  if (cachedCountries) return cachedCountries;
  if (inflight) return inflight;

  inflight = (async () => {
    const response = await fetch(COUNTRIES_API_URL, { cache: "force-cache" });
    if (!response.ok) {
      throw new CountriesError("Unable to load countries.");
    }

    const payload = (await response.json()) as {
      error?: boolean;
      data?: Array<{ name: string; Iso2: string }>;
    };

    if (payload.error || !Array.isArray(payload.data)) {
      throw new CountriesError("Unable to load countries.");
    }

    cachedCountries = payload.data
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

    return cachedCountries;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
