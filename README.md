# Expert Webapp (Vite + React)

Expert panel SPA. Stack: Vite 7, React 19, React Router 7, Tailwind CSS 4.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

| Script | Command |
| --- | --- |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Preview | `npm run preview` |
| Test | `npm test` |

## Environment

`.env.local`:

```
EXPERT_API_BASE_URL=https://coinzy-experts-api.trackzio.com
```

Optional: `VITE_EXPERT_SOCKET_URL`

## New product / rebrand

Edit **one file**: [`src/config/theme.config.ts`](src/config/theme.config.ts)

| Change | Section |
| --- | --- |
| Name, logo, titles | `brand`, `report` |
| Fonts | `fonts` |
| Primary / secondary colors | `colors` |
| Button size & variants | `buttons` |
| Icon size / assets | `icons` |

Replace assets under `public/` (logo, favicon, nav icons).

### Domain models (API shapes)

When the backend or product fields change, update:

| Area | File |
| --- | --- |
| API / UI types | `src/lib/expert/types.ts` |
| Evaluation form fields | `src/lib/expert/evaluationForm.ts` |
| Form ↔ report mapping | `src/lib/expert/reportContentFields.ts` |
| Queue / drafts / history mapping | `src/lib/expert/requestMappers.ts` |

UI branding stays in `theme.config.ts`; data contracts stay in `types.ts` + mappers.

## Deploy

- **Netlify** — `netlify.toml` + `netlify/functions/` (set `EXPERT_API_BASE_URL`)
- **Vercel** — `vercel.json` + `api/` (set `EXPERT_API_BASE_URL`)
