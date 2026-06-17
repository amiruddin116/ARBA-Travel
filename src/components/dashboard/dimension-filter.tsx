'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface FilterOptions {
  destinasi:   string[];
  productType: string[];
  channel:     string[];
}

interface DimensionFilterProps {
  options: FilterOptions;
}

const CHANNEL_LABELS: Record<string, string> = {
  google_ads:    'Google Ads',
  meta:          'Meta Ads',
  tiktok:        'TikTok Ads',
  organic:       'Organic',
  unattributed:  'Unattributed',
};

export function DimensionFilter({ options }: DimensionFilterProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap gap-3">
      {/* Date range */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">From</label>
        <input
          type="date"
          value={searchParams.get('startDate') ?? ''}
          onChange={(e) => updateParam('startDate', e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </div>
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">To</label>
        <input
          type="date"
          value={searchParams.get('endDate') ?? ''}
          onChange={(e) => updateParam('endDate', e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </div>

      {/* Destinasi */}
      <select
        value={searchParams.get('destinasi') ?? ''}
        onChange={(e) => updateParam('destinasi', e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      >
        <option value="">All Destinations</option>
        {options.destinasi.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Product type */}
      <select
        value={searchParams.get('productType') ?? ''}
        onChange={(e) => updateParam('productType', e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      >
        <option value="">All Types</option>
        {options.productType.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* Channel */}
      <select
        value={searchParams.get('channel') ?? ''}
        onChange={(e) => updateParam('channel', e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      >
        <option value="">All Channels</option>
        {options.channel.map((c) => (
          <option key={c} value={c}>{CHANNEL_LABELS[c] ?? c}</option>
        ))}
      </select>
    </div>
  );
}
