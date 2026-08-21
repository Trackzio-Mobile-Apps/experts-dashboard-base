# White-label Expert Dashboard

SPA expert panel. Stack: Vite 7, React 19, React Router 7, Tailwind CSS 4.

Brand a new product with **env vars** — do not use `VITE_` or `NEXT_PUBLIC_` prefixes.

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

Set in `.env.local` before `npm run build`. They are **inlined into `dist/`**.

```
API_BASE_URL=https://your-experts-api.example.com
SOCKET_URL=https://your-experts-api.example.com   # optional; defaults to API_BASE_URL

APP_NAME=Acme
APP_TITLE=Acme Expert Portal
APP_SLUG=acme
APP_LOGO_URL=/logo.png
APP_FAVICON_URL=/favicon.png
APP_REPORT_NAME=Acme
```

`APP_SLUG` namespaces browser storage (`{slug}.expert.jwt`, etc.).

Colors, fonts, and buttons: `src/config/theme.config.ts`. Replace assets under `public/`.

## Deploy (Netlify — static `dist` only)

```bash
cp .env.example .env.local   # edit values
npm install
npm run build
```

Upload the **`dist`** folder (Deploys → Deploy manually). Do not add Netlify functions.

The expert API must allow CORS from your Netlify domain.

`dist` already includes `_redirects` so client routes work.
