'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ChannelBreakdown } from '@/types/metrics';

const CHANNEL_LABELS: Record<string, string> = {
  google_ads:   'Google Ads',
  meta:         'Meta',
  tiktok:       'TikTok',
  organic:      'Organic',
  unattributed: 'Unattributed',
};

interface ChannelBarChartProps {
  data: ChannelBreakdown[];
}

export function ChannelBarChart({ data }: ChannelBarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">No data for selected period.</p>;
  }

  const chartData = data.map((d) => ({
    ...d,
    channel: CHANNEL_LABELS[d.channel] ?? d.channel,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="leads"       name="Leads"        fill="#3b82f6" />
        <Bar dataKey="closedLeads" name="Closed Leads" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
}
