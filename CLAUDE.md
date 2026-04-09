# ARBA-Travel

A marketing performance dashboard for ARBA Travel, built with Next.js and PostgreSQL.

## Stack
- **Frontend/Backend:** Next.js 14+ (App Router), TypeScript (strict mode)
- **Database:** PostgreSQL (Neon)
- **CRM source:** MySQL at crm.arbatravel.com (requires VPN — sync via local script)
- **Styling:** Tailwind CSS v4
- **Auth:** NextAuth.js v5 (Credentials provider)

## Project Structure
```
src/
├── app/
│   ├── (auth)/login/         # Login page
│   ├── (dashboard)/          # Main dashboard
│   └── api/
│       ├── auth/             # NextAuth route
│       ├── kpis/             # KPI data endpoint
│       ├── filters/          # Filter dimension values
│       └── sync/             # Platform sync routes (GET+POST)
├── components/
│   ├── charts/               # Recharts wrappers
│   └── dashboard/            # KPI cards, filters
├── db/
│   ├── schema.sql            # PostgreSQL table definitions
│   ├── schema.ts             # Drizzle ORM schema
│   └── queries/
│       └── kpi-metrics.ts    # CPL, CPP, CR%, Avg Pax queries
├── integrations/
│   ├── arba-crm/             # MySQL CRM sync
│   ├── google-ads/           # Google Ads connector
│   ├── meta/                 # Meta Ads connector
│   ├── tiktok/               # TikTok Ads connector
│   └── search-console/       # Google Search Console connector
├── lib/
│   ├── db.ts                 # Neon PostgreSQL client
│   ├── crm-db.ts             # MySQL CRM client
│   ├── auth.ts               # NextAuth config
│   ├── channel-map.ts        # ad_id → channel mapping
│   └── cron-secret.ts        # Cron auth helper
└── types/
    └── metrics.ts            # KpiFilters, LeadKpis, etc.
scripts/
└── sync-crm.ts               # Standalone CRM sync (run locally with VPN)
```

## Commands

```bash
npm run dev            # Start development server
npm run build          # Production build
npm run start          # Start production server
npm run lint           # Run ESLint
npm run db:push        # Push schema to Neon via Drizzle
npm run db:studio      # Open Drizzle Studio
npm run sync:crm       # Incremental CRM sync (VPN required)
npm run sync:crm:full  # Full CRM re-sync (VPN required)
```

## Code Style
- 2-space indentation
- TypeScript strict mode — no `any` types
- Named exports only (no default exports except Next.js pages)
- Async/await over `.then()` chains
- Handle all errors explicitly — no silent catches

## Database Conventions
- Table names: `snake_case`, plural (e.g. `leads`, `ad_metrics`)
- Primary keys: UUID (`gen_random_uuid()`)
- Timestamps: `created_at`, `updated_at` on every table
- All queries in `src/db/queries/` as typed functions — no raw SQL in components or API routes

## Key Business Rules
- **Pax count** = `adult + child + child_no_bed` (infant excluded)
- **Closed lead** = CRM Status IN ('Modified', 'Payment', 'Closed')
- **Deduplication** = by normalized phone number (`dedup_key`); first occurrence kept, duplicates marked `is_duplicate = TRUE` and excluded from KPI counts
- **Channel attribution** = mapped from CRM `ad_id` field via `src/lib/channel-map.ts`
- **KPIs**: CPL = spend / leads · CPP = spend / closed_pax · CR% = closed/leads × 100 · Avg Pax = closed_pax / closed_leads

## CRM Sync Setup (local machine)
Phase 1: Local machine with VPN
1. Copy `.env.example` → `.env.local`, fill in `DATABASE_URL` and `CRM_DATABASE_URL`
2. Activate VPN (required to reach crm.arbatravel.com:3306)
3. Run full sync once: `npm run sync:crm:full`
4. Schedule nightly at midnight:
   - **macOS**: `sudo pmset repeat wakeorpoweron MTWRFSU 23:58:00`
     then `crontab -e` → `0 0 * * * cd /path/to/arba-travel && npm run sync:crm >> /tmp/arba-crm-sync.log 2>&1`
   - **Windows**: Task Scheduler → "Wake the computer to run this task"

Phase 2: Move `scripts/sync-crm.ts` + `.env.local` to a VPS with OpenVPN — no code changes needed.

## Security Rules
- Never commit `.env` or `.env.local`
- Never log sensitive data (passwords, tokens, card numbers)
- Always validate and sanitize user input at API boundaries
- Use parameterized queries — never interpolate user input into SQL

## Subagents Available
- `@"code-reviewer"` — Review code for quality, security, and Next.js best practices
- `@"test-writer"` — Write Jest/React Testing Library tests for a component or function
- `@"db-advisor"` — Advise on PostgreSQL schema design, queries, and migrations
