import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLeadKpis, getDailyLeads, getChannelBreakdown, getDistinctDestinasi, getDistinctProductTypes } from '@/db/queries/kpi-metrics';
import { CHANNELS } from '@/lib/channel-map';
import { MetricCard } from '@/components/dashboard/metric-card';
import { DimensionFilter } from '@/components/dashboard/dimension-filter';
import { LeadsTrendChart } from '@/components/charts/leads-trend-chart';
import { ChannelBarChart } from '@/components/charts/channel-bar-chart';
import { formatIDR, formatPct } from '@/lib/utils';
import type { KpiFilters } from '@/types/metrics';

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect('/login');

  const params = await searchParams;

  const filters: KpiFilters = {
    startDate:   params.startDate,
    endDate:     params.endDate,
    destinasi:   params.destinasi,
    productType: params.productType,
    channel:     params.channel,
  };
  // Remove undefined
  (Object.keys(filters) as (keyof KpiFilters)[]).forEach((k) => {
    if (filters[k] === undefined) delete filters[k];
  });

  const [kpis, dailyLeads, channelBreakdown, destinasiOpts, productTypeOpts] = await Promise.all([
    getLeadKpis(filters),
    getDailyLeads(filters),
    getChannelBreakdown(filters),
    getDistinctDestinasi(),
    getDistinctProductTypes(),
  ]);

  const filterOptions = {
    destinasi:   destinasiOpts,
    productType: productTypeOpts,
    channel:     [...CHANNELS],
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
        <span className="text-sm text-gray-500">{session.user?.name ?? session.user?.email}</span>
      </div>

      {/* Filters */}
      <section className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <Suspense fallback={null}>
          <DimensionFilter options={filterOptions} />
        </Suspense>
      </section>

      {/* KPI Summary Cards */}
      <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <MetricCard
          label="Total Leads"
          value={kpis.leads.toLocaleString()}
        />
        <MetricCard
          label="Closed Leads"
          value={kpis.closedLeads.toLocaleString()}
        />
        <MetricCard
          label="Closed Pax"
          value={kpis.closedPax.toLocaleString()}
          sub="adult + child + child no bed"
        />
        <MetricCard
          label="CR%"
          value={kpis.crPct !== null ? formatPct(kpis.crPct) : null}
          sub="closed / leads"
          highlight
        />
        <MetricCard
          label="CPL"
          value={kpis.cpl !== null ? formatIDR(Math.round(kpis.cpl)) : null}
          sub="cost per lead"
          highlight
        />
        <MetricCard
          label="CPP"
          value={kpis.cpp !== null ? formatIDR(Math.round(kpis.cpp)) : null}
          sub="cost per pax"
          highlight
        />
        <MetricCard
          label="Avg Pax"
          value={kpis.averagePax !== null ? kpis.averagePax.toFixed(1) : null}
          sub="per closed lead"
        />
      </section>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Leads Trend</h2>
          <LeadsTrendChart data={dailyLeads} />
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Leads by Channel</h2>
          <ChannelBarChart data={channelBreakdown} />
        </section>
      </div>

      {/* Channel breakdown table */}
      <section className="mt-6 rounded-lg border bg-white shadow-sm">
        <div className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Channel Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="pb-2 pr-4">Channel</th>
                  <th className="pb-2 pr-4 text-right">Leads</th>
                  <th className="pb-2 pr-4 text-right">Closed</th>
                  <th className="pb-2 pr-4 text-right">CR%</th>
                  <th className="pb-2 pr-4 text-right">Spend</th>
                  <th className="pb-2 pr-4 text-right">CPL</th>
                  <th className="pb-2 text-right">CPP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {channelBreakdown.map((row) => (
                  <tr key={row.channel} className="hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium capitalize">{row.channel.replace('_', ' ')}</td>
                    <td className="py-2 pr-4 text-right">{row.leads.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">{row.closedLeads.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">
                      {row.leads > 0 ? formatPct((row.closedLeads / row.leads) * 100) : '—'}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {row.spend > 0 ? formatIDR(row.spend) : '—'}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {row.cpl !== null ? formatIDR(Math.round(row.cpl)) : '—'}
                    </td>
                    <td className="py-2 text-right">
                      {row.cpp !== null ? formatIDR(Math.round(row.cpp)) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
