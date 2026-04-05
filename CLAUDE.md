# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
```

No test suite currently exists.

## Architecture

**Reading Garden** is a single-page reading journal with a GitHub contribution graph UI. All data is stored in Vercel KV (Upstash Redis).

### Data flow

```
app/page.tsx  ──fetch──▶  /api/records          ──▶  lib/records.ts  ──▶  Vercel KV
              ──fetch──▶  /api/records/[date]
```

`app/page.tsx` fetches all records on mount and holds them in a single `RecordsData` state object. All mutations go through API routes and then update local state directly — there is no global state library.

### Key design decisions

- **Selected date lives in the URL** (`?date=YYYY-MM-DD`) via `router.replace`. This preserves selection across navigation without extra state.
- **`useSearchParams` requires Suspense** — `HomeContent` is wrapped in `<Suspense>` in `HomePage` for this reason.
- **Modal mode is a discriminated union** (`ModalMode = { type: "add" } | { type: "edit"; idx: number; initialContent: string }`). `handleModalSave` in page.tsx branches on this to call POST vs PUT.
- **Deletion and editing both use PUT** (`/api/records/[date]`) with the full updated entries array. Sending an empty array deletes the record from KV.
- **Grass level** is derived from total character count of all entries for a day (0–4 scale, defined in `lib/types.ts:getGrassLevel`).

### Storage

KV key format: `record:YYYY-MM-DD` → `ReadingRecord` JSON object.

`lib/records.ts` is the only file that imports `@vercel/kv`. All KV access goes through it.

### Env vars

Vercel KV env vars (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`) are set automatically when the Upstash Redis integration is connected in the Vercel dashboard. For local dev, copy them from Vercel project settings into `.env.local`.

### Animations

Modal open/close animations are CSS keyframes in `app/globals.css`. Close is triggered by setting a `closing` boolean state in `RecordWriteModal`, which adds a `.closing` class, then calling `onClose` after 180ms.
