/**
 * Seed queue / history test data on the live expert API.
 *
 * Usage:
 *   ADMIN_API_KEY=... USER_JWT_SHARED_SECRET=... node scripts/seed-expert-panel-live.mjs
 *
 * Optional env:
 *   EXPERT_API_BASE_URL   (default: https://coinzy-experts-api.trackzio.com)
 *   EXPERT_EMAIL          (default: shreyans+expert@trackzio.com)
 *   EXPERT_PASSWORD       (default: Tr@ckzi0)
 *   SEED_MOBILE_USER_ID   (default: coinzy-panel-test-user)
 */

import crypto from "node:crypto";

const BASE_URL = (
  process.env.EXPERT_API_BASE_URL ?? "https://coinzy-experts-api.trackzio.com"
).replace(/\/$/, "");
const ADMIN_KEY = process.env.ADMIN_API_KEY ?? "";
const USER_JWT_SECRET = process.env.USER_JWT_SHARED_SECRET ?? "";
const EXPERT_EMAIL = process.env.EXPERT_EMAIL ?? "shreyans+expert@trackzio.com";
const EXPERT_PASSWORD = process.env.EXPERT_PASSWORD ?? "Tr@ckzi0";
const MOBILE_USER_ID = process.env.SEED_MOBILE_USER_ID ?? "coinzy-panel-test-user";

const DEMO_REQUESTS = [
  {
    coinName: "1943 Lincoln Steel Penny",
    type: "US Coin",
    valueInr: 12500,
    notes: "Found in grandfather's collection.",
  },
  {
    coinName: "Mughal Silver Rupee",
    type: "Indian Coin",
    valueInr: 45000,
    notes: "Shah Jahan era — needs authentication.",
  },
  {
    coinName: "Victorian Gold Sovereign",
    type: "UK Coin",
    valueInr: 89000,
    notes: "1887 Jubilee issue with minor edge wear.",
  },
  {
    coinName: "Roman Denarius",
    type: "Ancient Coin",
    valueInr: 32000,
    notes: "Unclear emperor portrait on obverse.",
  },
  {
    coinName: "East India Company 1/2 Anna",
    type: "Indian Coin",
    valueInr: 8500,
    notes: "1835 issue with green patina.",
  },
];

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signUserJwt(secret, payload) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${header}.${body}.${signature}`;
}

async function api(method, path, { body, token, admin = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (admin) headers["x-admin-key"] = ADMIN_KEY;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { error: true, message: text, data: {} };
  }

  return { status: response.status, json };
}

function assertOk(label, result, allowed = [200, 201]) {
  if (!allowed.includes(result.status) || result.json?.error) {
    throw new Error(
      `${label} failed (${result.status}): ${result.json?.message ?? "unknown error"}`,
    );
  }
  return result.json.data;
}

function normalizeId(value) {
  if (typeof value === "string") return value;
  if (value?.$oid) return value.$oid;
  if (value?.buffer) {
    const bytes = Object.values(value.buffer);
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return String(value);
}

async function ensureMobileUser() {
  const list = await api("GET", "/admin/users", { admin: true });
  assertOk("list users", list);

  const users = list.json.data.users ?? [];
  if (users.length > 0) {
    const user = users[0];
    console.log(`Using existing mobile user: ${user.email ?? user._id}`);
    return user;
  }

  if (!USER_JWT_SECRET) {
    throw new Error(
      "No mobile users exist and USER_JWT_SHARED_SECRET is not set. " +
        "Set USER_JWT_SHARED_SECRET to create a test user via GET /users/me.",
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const token = signUserJwt(USER_JWT_SECRET, {
    userId: MOBILE_USER_ID,
    name: "Panel Test User",
    email: "panel.test@trackzio.com",
    iat: now,
    exp: now + 60 * 60,
  });

  const me = await api("GET", "/users/me", { token });
  assertOk("create mobile user", me);
  const user = me.json.data.user;
  console.log(`Created mobile user: ${user._id}`);
  return user;
}

async function ensureCredits(userId, minimum = 10) {
  const list = await api("GET", "/admin/users", { admin: true });
  assertOk("refresh users", list);
  const user = (list.json.data.users ?? []).find(
    (item) => normalizeId(item._id) === normalizeId(userId),
  );
  const balance = user?.creditBalance ?? 0;
  if (balance >= minimum) {
    console.log(`Mobile user credits: ${balance}`);
    return;
  }

  const needed = minimum - balance;
  const adjust = await api("POST", `/admin/users/${userId}/credits/adjust`, {
    admin: true,
    body: { amount: needed, reason: "seed_expert_panel" },
  });
  assertOk("grant credits", adjust);
  console.log(`Granted ${needed} credits (balance now ${adjust.json.data.creditBalance})`);
}

async function createRequestsForUser(userId) {
  const created = [];
  for (const item of DEMO_REQUESTS) {
    const result = await api("POST", `/admin/users/${userId}/requests`, {
      admin: true,
      body: {
        country: "IN",
        payload: {
          coinName: item.coinName,
          type: item.type,
          valueInr: item.valueInr,
          notes: item.notes,
          media: [
            {
              kind: "image",
              src: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400",
              alt: item.coinName,
            },
          ],
        },
      },
    });
    assertOk(`create request: ${item.coinName}`, result, [201]);
    const request = result.json.data.request;
    created.push(request);
    console.log(`Created request: ${item.coinName} (${normalizeId(request._id)})`);
  }
  return created;
}

async function loginExpert() {
  const result = await api("POST", "/experts/login", {
    body: { email: EXPERT_EMAIL, password: EXPERT_PASSWORD },
  });
  assertOk("expert login", result);
  return result.json.data.token;
}

async function getOffers(expertToken) {
  const result = await api("GET", "/experts/me/offers", { token: expertToken });
  assertOk("list offers", result);
  return result.json.data.offers ?? [];
}

async function getRequests(expertToken) {
  const result = await api("GET", "/experts/me/requests", { token: expertToken });
  assertOk("list requests", result);
  return result.json.data.requests ?? [];
}

async function acceptOffer(expertToken, offerId) {
  const result = await api("POST", `/experts/offers/${offerId}/accept`, {
    token: expertToken,
  });
  assertOk(`accept offer ${offerId}`, result);
  return result.json.data;
}

async function submitReport(expertToken, requestId, coinName) {
  const result = await api("POST", "/reports", {
    token: expertToken,
    body: {
      requestId,
      content: {
        summary: `Authentication report for ${coinName}`,
        grade: "VF-30",
        estimatedValueInr: 42000,
        notes: "Seed report for expert panel UI testing.",
      },
      attachments: [],
    },
  });
  assertOk(`submit report for ${requestId}`, result, [201]);
  return result.json.data;
}

async function main() {
  if (!ADMIN_KEY) {
    throw new Error("ADMIN_API_KEY is required.");
  }

  console.log(`Seeding expert panel data via ${BASE_URL}\n`);

  const user = await ensureMobileUser();
  const userId = normalizeId(user._id);
  await ensureCredits(userId, DEMO_REQUESTS.length + 2);
  await createRequestsForUser(userId);

  const expertToken = await loginExpert();
  let offers = await getOffers(expertToken);
  console.log(`\nExpert offers: ${offers.length}`);
  console.log("[expert] GET /experts/me/offers", JSON.stringify(offers, null, 2));

  if (offers.length > 0) {
    const accepted = await acceptOffer(expertToken, normalizeId(offers[0]._id));
    console.log(
      `Accepted offer for: ${accepted.request?.payload?.coinName ?? accepted.request?._id}`,
    );
  }

  offers = await getOffers(expertToken);
  if (offers.length > 0) {
    const accepted = await acceptOffer(expertToken, normalizeId(offers[0]._id));
    const requestId = normalizeId(accepted.request._id);
    const coinName = accepted.request?.payload?.coinName ?? "Completed evaluation";
    await submitReport(expertToken, requestId, coinName);
    console.log(`Submitted report for: ${coinName}`);
  }

  const requests = await getRequests(expertToken);
  console.log(`\nExpert assigned requests: ${requests.length}`);
  console.log("[expert] GET /experts/me/requests", JSON.stringify(requests, null, 2));

  const pendingOffers = await getOffers(expertToken);
  console.log("\nDone.");
  console.log(`  Pending offers (queue): ${pendingOffers.length}`);
  console.log(`  Assigned requests (history/drafts): ${requests.length}`);
  console.log(`  Login: ${EXPERT_EMAIL}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
