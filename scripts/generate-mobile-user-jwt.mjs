/**
 * Generate a mobile-user JWT for Postman / API testing.
 *
 * Usage:
 *   USER_JWT_SHARED_SECRET=your-secret node scripts/generate-mobile-user-jwt.mjs
 *
 * Optional:
 *   SEED_MOBILE_USER_ID=postman-test-user-1
 *   MOBILE_USER_NAME="Postman Test User"
 *   MOBILE_USER_EMAIL=postman@test.com
 */

import crypto from "node:crypto";

const secret = process.env.USER_JWT_SHARED_SECRET ?? "";
const userId = process.env.SEED_MOBILE_USER_ID ?? "postman-test-user-1";
const name = process.env.MOBILE_USER_NAME ?? "Postman Test User";
const email = process.env.MOBILE_USER_EMAIL ?? "postman@test.com";

if (!secret) {
  console.error("Set USER_JWT_SHARED_SECRET (from coinzy-experts-api deployment env).");
  process.exit(1);
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

const now = Math.floor(Date.now() / 1000);
const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const body = base64Url(
  JSON.stringify({
    userId,
    name,
    email,
    iat: now,
    exp: now + 60 * 60 * 24,
  }),
);
const signature = crypto
  .createHmac("sha256", secret)
  .update(`${header}.${body}`)
  .digest("base64")
  .replace(/=/g, "")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");

const token = `${header}.${body}.${signature}`;

console.log("Mobile user JWT (paste into Postman Authorization: Bearer ...):\n");
console.log(token);
console.log("\nThen call:");
console.log("  GET https://coinzy-experts-api.trackzio.com/users/me");
console.log("\nPayload used:");
console.log(JSON.stringify({ userId, name, email }, null, 2));
