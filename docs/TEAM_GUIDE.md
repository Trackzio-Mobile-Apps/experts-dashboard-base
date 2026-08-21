# Expert panel — team guide

Short handoff for using this repo as a **base for a new expert app**.  
Full API catalog: [`FLOWS_AND_API.md`](./FLOWS_AND_API.md).

**Stack:** Vite + React + React Router · Expert API (`API_BASE_URL`) · Socket.IO for new offers.

---

## 1. Branch + run (first 5 minutes)

```bash
git checkout main
git pull
git checkout -b your-product-name      # new app / rebrand work lives here

cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

In `.env.local`, set the backend and brand for **this** product:

```
API_BASE_URL=https://your-experts-api.example.com
APP_NAME=Acme
APP_TITLE=Acme Expert Portal
APP_SLUG=acme
APP_LOGO_URL=/logo.png
APP_FAVICON_URL=/favicon.png
APP_REPORT_NAME=Acme
```

Optional: `SOCKET_URL` if Socket.IO is on a different host.

Then `npm run build` and upload the **`dist`** folder to Netlify (static site, no functions). Env is already inside the build.

---

## 2. What to change for a new app

Do **not** rewrite screens. Set env first, then restyle if needed.

| What | Where |
| --- | --- |
| Product name, title, logo, slug | `.env.local` — `APP_NAME`, `APP_TITLE`, `APP_LOGO_URL`, `APP_SLUG` |
| Colors, fonts, buttons | `src/config/theme.config.ts` |
| Logo / favicon / nav icons | `public/` |
| Backend URL | `.env.local` + host env (`API_BASE_URL`) |
| Package name | `package.json` → `"name"` |
| Cookie + storage namespace | `APP_SLUG` (cookie `{slug}_jwt`) |
| Evaluation **fields** (not coins anymore) | `src/lib/expert/types.ts` → `ReportContentFields` |
| Form UI for those fields | `src/lib/expert/evaluationForm.ts` |
| Form ↔ API mapping | `src/lib/expert/reportContentFields.ts` |
| Request list / media mapping | `src/lib/expert/requestMappers.ts` |

Brand identity = `APP_*` env + `theme.config.ts`.  
Data contracts = `types.ts` + mappers + form files.

---

## 3. Product flow

```
Login  →  Queue (new offers + in-progress)
       →  Open request  →  Accept  →  Fill evaluation  →  Draft / Submit report
       →  Drafts (resume incomplete)
       →  History (past work, view report / PDF)
       →  Profile (availability + reviews)
```

1. **Login** — email + password → JWT cookie → load expert profile → `/expert/queue`.
2. **Queue** — new **offers** + accepted work. Skip/reassign an offer, or open a row.
3. **Accept** — expert reviews user photos/notes, then `POST /experts/offers/:id/accept`.
4. **Evaluate** — form autosaves as a **draft report**. Submit finalizes (`isDraft: false`).
5. **Drafts** — accepted work still inside the deadline, not submitted.
6. **History** — past requests; open report modal or download PDF.
7. **Realtime** — Socket.IO `request.offered` / `withdrawn` / `accepted` refreshes the queue. If the socket is down, offers poll every 30s.

Auth cookie: `{APP_SLUG}_jwt` (local proxy) or session JWT `{APP_SLUG}.expert.jwt` (static `dist`). Browser calls `API_BASE_URL` directly when that env is set.

---

## 4. Request model

A **request** is the user’s evaluation job. An **offer** is that request shown to this expert.

### Request (`BackendRequest`)

| Field | Meaning |
| --- | --- |
| `_id` | Request id |
| `displayId` | Human id in UI (e.g. `EV-…`) |
| `coinTitle` | Title; else taken from `payload` |
| `country` | Country |
| `status` | See statuses below |
| `payload` | User-submitted content (name, notes, media) |
| `deadlineAt` | Evaluation deadline |
| `acceptedAt` / `submittedAt` / `completedAt` | Lifecycle timestamps |
| `reportId` / `report` | Linked report once a draft exists |

**Statuses you will see:** `created` → `allocating` → `offered` → `accepted` → `report_submitted` → `completed`.  
Also: `deadline_missed`, `expired`, `cancelled`, refund states.

### Offer (`BackendOffer`)

| Field | Meaning |
| --- | --- |
| `_id` | Offer id (used for accept / skip) |
| `expiresAt` | Offer window (queue deadline often `min(request.deadlineAt, offer.expiresAt)`) |
| `request` | Nested request |

### What lives in `payload` (user side)

The UI reads loosely (any of these keys work):

| UI uses | Payload keys |
| --- | --- |
| Name | `coinName` / `name` / `title` / `coinTitle` |
| Notes | `notes` / `userNotes` / `description` |
| Type | `type` / `material` / `category` |
| Media | `media` / `images` / `attachments` — groups like `{ obverse: [], reverse: [], edge: [], video }` |

### Request APIs

| Action | Backend |
| --- | --- |
| List new offers | `GET /experts/me/offers` |
| List all my requests | `GET /experts/me/requests` |
| Accepted only | `GET /experts/me/requests?status=accepted` |
| Accept | `POST /experts/offers/:offerId/accept` |
| Skip / reassign | `POST /experts/offers/:offerId/skip` |

---

## 5. Report model

A **report** is the expert’s evaluation of one request. Created on first autosave; submitted when the expert confirms.

### Report (`BackendReport`)

| Field | Meaning |
| --- | --- |
| `_id` | Report id |
| `requestId` | Parent request |
| `requestDisplayId` | Same human id as the request |
| `expertId` / `userId` | Who wrote it / who asked |
| `coinTitle` | Title copied onto the report |
| `contentFields` | Structured evaluation (source of truth) |
| `content` | Legacy flat object — ignore if `contentFields` exists |
| `attachments` | Image/video URLs copied from the request |
| `isDraft` | `true` = autosave, `false` = submitted |
| `status` | `"draft"` \| `"submitted"` |
| `submittedAt` | Set when submitted |

### `contentFields` (what the form saves)

```
contentFields
  generalInfo        coinName, currencyAndDenomination, issuer, period,
                     rulerOrGovt, yearOfMinting, mintLocation
  physicalSpecs      material, weight, dominantColor, mintingMethod
  designDetails      obverseDescription, reverseDescription, history
  valueAndRarity     rarity, currency, estimatedPriceRange
  expertAssessment   authenticity, conditionOrGrade,
                     errorsOrSpecialFeatures, recommendation
```

**Required to submit (15):** coin name, currency & denomination, issuer, year, period, ruler/govt, mint location, material, obverse, reverse, price range, rarity, authenticity, condition, recommendation.

**Optional:** weight, dominant color, minting method, history, errors/special features.

Create vs update:

```
POST /experts/reports          { requestId, contentFields, attachments, isDraft }
PUT  /experts/reports/:id      { contentFields, attachments, isDraft }
GET  /experts/reports/:id      load for form / PDF
```

- First save → `POST` with `isDraft: true` (409 = report already exists → reuse that id).
- Later saves → `PUT` with `isDraft: true` (~900ms debounce + flush on tab hide).
- Submit → same `PUT`/`POST` with `isDraft: false`.
- Local backup is always kept in `localStorage` per request id.

---

## 6. Screens (routes)

| Route | What |
| --- | --- |
| `/expert/login` | Sign in |
| `/expert/queue` | Offers + in-progress |
| `/expert/queue/:reqId` | Accept + evaluation form |
| `/expert/drafts` | Incomplete reports |
| `/expert/history` | Past work + report / PDF |
| `/expert/profile` | Profile, reviews, availability |

Signup / forgot-password pages exist as UI only — they are **not** wired to the expert API.

---

*Doc only. No application code changes.*
