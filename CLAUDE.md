# ARBA-Travel

A travel booking web application built with Next.js and PostgreSQL.

## Stack
- **Frontend/Backend:** Next.js 14+ (App Router), TypeScript (strict mode)
- **Database:** PostgreSQL
- **Styling:** TBD (Tailwind CSS recommended)
- **Auth:** TBD (NextAuth.js recommended)

## Project Structure
```
src/
├── app/              # Next.js App Router pages & API routes
│   ├── (auth)/       # Auth-related pages
│   ├── api/          # API route handlers
│   └── ...           # Feature pages
├── components/       # Reusable React components
│   ├── ui/           # Generic UI primitives
│   └── ...           # Feature components
├── lib/              # Shared utilities and helpers
├── db/               # Database client, queries, migrations
│   ├── schema.sql    # Table definitions
│   ├── migrations/   # Migration files
│   └── queries/      # Typed query functions
└── types/            # Shared TypeScript types
```

## Commands
> Update these after running `npx create-next-app`

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
npm test          # Run tests
```

## Code Style
- 2-space indentation
- TypeScript strict mode — no `any` types
- Named exports only (no default exports except Next.js pages)
- Async/await over `.then()` chains
- Handle all errors explicitly — no silent catches

## Database Conventions
- Table names: `snake_case`, plural (e.g. `bookings`, `travel_packages`)
- Primary keys: UUID (`gen_random_uuid()`)
- Timestamps: `created_at`, `updated_at` on every table
- All queries in `src/db/queries/` as typed functions — no raw SQL in components or API routes

## Security Rules
- Never commit `.env` or `.env.local`
- Never log sensitive data (passwords, tokens, card numbers)
- Always validate and sanitize user input at API boundaries
- Use parameterized queries — never interpolate user input into SQL

## Subagents Available
- `@"code-reviewer"` — Review code for quality, security, and Next.js best practices
- `@"test-writer"` — Write Jest/React Testing Library tests for a component or function
- `@"db-advisor"` — Advise on PostgreSQL schema design, queries, and migrations
