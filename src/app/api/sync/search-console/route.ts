import { NextResponse } from 'next/server';
import { validateCronSecret } from '@/lib/cron-secret';
import { searchConsoleConnector } from '@/integrations/search-console/connector';
import { format, subDays } from 'date-fns';

export const maxDuration = 300;

async function handleSync(request: Request) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url       = new URL(request.url);
  const endDate   = url.searchParams.get('end')   ?? format(new Date(), 'yyyy-MM-dd');
  const startDate = url.searchParams.get('start') ?? format(subDays(new Date(), 3), 'yyyy-MM-dd');
  // GSC data has ~3-day delay, so default to 3 days ago

  try {
    const result = await searchConsoleConnector.sync(startDate, endDate);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[sync/search-console]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const GET  = handleSync;
export const POST = handleSync;
