# Coinzy Expert Webapp (Vite + React)

Expert panel web app for Coinzy. This folder is a **Vite** build of the expert panel (not Next.js).

> Full documentation (tech stack, every flow, edge cases, test cases, white-label / new app, model-change playbook): **[docs/WEBAPP_GUIDE.md](./docs/WEBAPP_GUIDE.md)**

## Stack

| Layer | Tool |
| --- | --- |
| Bundler / dev server | **Vite 7** |
| UI | React 19 + React Router 7 + Tailwind CSS 4 |
| Theme / white-label | `src/config/theme.config.ts` |
| API proxy / session | Vite middleware (`server/expertApiMiddleware.ts`) |
| Unit tests | Vitest |

## Setup

```bash
cd coinzy-expert-webapp-next-vite
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev       # Vite dev server + API middleware
npm run build     # production build → dist/
npm run preview   # serve dist with API middleware
npm run start     # alias for preview
npm test          # Vitest unit tests
```

## Environment

See `.env.example`.

- `EXPERT_API_BASE_URL` — server middleware proxy target
- `VITE_EXPERT_API_BASE_URL` / `VITE_EXPERT_SOCKET_URL` — optional browser-visible overrides

## Rebrand / new app

Edit **`src/config/theme.config.ts`** (colors, buttons, icons, brand name/logo), replace assets in `public/`, point `.env.local` at your API. Details in [docs/WEBAPP_GUIDE.md §10](./docs/WEBAPP_GUIDE.md#10-theme--white-label-new-app-in-minutes).

## Deploy on Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com) → **Add New Project** → import the repo.
3. Framework preset: **Vite** (or leave auto). Build: `npm run build`, Output: `dist`.
4. Set environment variable (Production + Preview):
   - `EXPERT_API_BASE_URL` = `https://coinzy-experts-api.trackzio.com`
   - Optional: `VITE_EXPERT_SOCKET_URL` = same URL
5. Deploy. SPA routes use `vercel.json` rewrites; `/api/expert/*` and `/api/countries` are serverless functions under `api/`.
