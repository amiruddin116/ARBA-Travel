#!/usr/bin/env npx tsx
/**
 * Standalone CRM sync script — runs on the user's machine (or a VPS) while VPN is active.
 *
 * Phase 1 (local): Run manually or via cron + scheduled OS wake.
 *   macOS setup:
 *     1. sudo pmset repeat wakeorpoweron MTWRFSU 23:58:00   # wake at 11:58pm
 *     2. crontab -e  →  add:  0 0 * * * cd /path/to/arba-travel && npx tsx scripts/sync-crm.ts >> /tmp/arba-crm-sync.log 2>&1
 *   Windows:
 *     Task Scheduler → "Wake the computer to run this task" checkbox
 *
 * Phase 2 (VPS): Copy this script and .env.local to a VPS with OpenVPN, add system cron — no code changes.
 *
 * Usage:
 *   npx tsx scripts/sync-crm.ts          # incremental sync
 *   npx tsx scripts/sync-crm.ts --full   # full re-sync
 */

import 'dotenv/config';
import { syncCrm } from '../src/integrations/arba-crm/sync';

const fullSync = process.argv.includes('--full');

console.log(`[sync-crm] Starting ${fullSync ? 'FULL' : 'incremental'} sync at ${new Date().toISOString()}`);

syncCrm(fullSync)
  .then((result) => {
    console.log(`[sync-crm] Done in ${result.durationMs}ms`);
    console.log(`  recordsIn:  ${result.recordsIn}`);
    console.log(`  recordsOut: ${result.recordsOut}`);
    if (result.errors.length > 0) {
      console.warn(`  errors (${result.errors.length}):`);
      result.errors.forEach((e) => console.warn(`    - ${e}`));
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('[sync-crm] Fatal error:', err);
    process.exit(1);
  });
