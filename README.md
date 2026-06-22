# OTA Analyzer

## Introduction

OTA Analyzer is a tool to inspect and visualize Android OTA packages. It runs entirely in the browser; your OTA package is never uploaded.

## Get Started

Open https://android.github.io/analyseOTA/ to access the hosted version.

## Develop

Requirements: Node.js 20+

```bash
npm install
npm run dev
```

Other scripts:

- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build locally
- `npm run test` — run unit tests with Vitest
- `npm run typecheck` — TypeScript check

## Stack

- Vue 3 + Vite + TypeScript
- Pinia for state management
- Vuetify 3 for UI
- ECharts for charts
- Core OTA parsing logic in `src/services/` (migrated from the original project)
