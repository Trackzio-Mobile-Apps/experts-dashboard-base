/** HttpOnly cookie holding the expert JWT. */
export const EXPERT_JWT_COOKIE = "coinzy_expert_jwt";

export function expertJwtCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export function clearedExpertJwtCookieOptions() {
  return {
    ...expertJwtCookieOptions(0),
    maxAge: 0,
  };
}
