import { NextResponse } from 'next/server';
import { validateCronSecret } from '@/lib/cron-secret';
import { tiktokConnector } from '@/integrations/tiktok/connector';
import { format, subDays } from 'date-fns';

export const maxDuration = 300;

async function handleSync(request: Request) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url       = new URL(request.url);
  const endDate   = url.searchParams.get('end')   ?? format(new Date(), 'yyyy-MM-dd');
  const startDate = url.searchParams.get('start') ?? format(subDays(new Date(), 1), 'yyyy-MM-dd');

  try {
    const result = await tiktokConnector.sync(startDate, endDate);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[sync/tiktok]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const GET  = handleSync;
export const POST = handleSync;
