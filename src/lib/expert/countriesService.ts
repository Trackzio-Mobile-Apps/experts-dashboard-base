import type { ApiEnvelope } from "@/lib/expert/apiClient";

export type Country = {
  code: string;
  name: string;
};

type CountriesApiData = {
  countries: Country[];
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
    const response = await fetch("/api/countries", { cache: "force-cache" });
    const envelope = (await response.json()) as ApiEnvelope<CountriesApiData>;

    if (!response.ok || envelope.error || !envelope.data?.countries) {
      throw new CountriesError(
        envelope.message || "Unable to load countries.",
      );
    }

    cachedCountries = envelope.data.countries;
    return cachedCountries;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
