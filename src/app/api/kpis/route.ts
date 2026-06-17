import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLeadKpis, getDailyLeads, getDailySpend, getChannelBreakdown } from '@/db/queries/kpi-metrics';
import type { KpiFilters } from '@/types/metrics';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url     = new URL(request.url);
  const filters: KpiFilters = {
    startDate:   url.searchParams.get('startDate')   ?? undefined,
    endDate:     url.searchParams.get('endDate')     ?? undefined,
    destinasi:   url.searchParams.get('destinasi')   ?? undefined,
    productType: url.searchParams.get('productType') ?? undefined,
    channel:     url.searchParams.get('channel')     ?? undefined,
  };

  // Remove undefined keys
  (Object.keys(filters) as (keyof KpiFilters)[]).forEach((k) => {
    if (filters[k] === undefined) delete filters[k];
  });

  try {
    const [summary, dailyLeads, dailySpend, channelBreakdown] = await Promise.all([
      getLeadKpis(filters),
      getDailyLeads(filters),
      getDailySpend(filters),
      getChannelBreakdown(filters),
    ]);

    return NextResponse.json({ summary, dailyLeads, dailySpend, channelBreakdown });
  } catch (err) {
    console.error('[api/kpis]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
