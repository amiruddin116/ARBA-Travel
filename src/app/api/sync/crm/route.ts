import { NextResponse } from 'next/server';
import { validateCronSecret } from '@/lib/cron-secret';
import { syncCrm } from '@/integrations/arba-crm/sync';

export const maxDuration = 300; // 5 min — Vercel Pro limit; increase if needed

export async function POST(request: Request) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url        = new URL(request.url);
  const fullSync   = url.searchParams.get('full') === '1';

  try {
    const result = await syncCrm(fullSync);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[sync/crm] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
