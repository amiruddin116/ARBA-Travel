'use client';

import { cn } from '@/lib/utils';

interface MetricCardProps {
  label:     string;
  value:     string | number | null;
  sub?:      string;
  highlight?: boolean;
  className?: string;
}

export function MetricCard({ label, value, sub, highlight, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-5 shadow-sm',
        highlight && 'border-blue-200 bg-blue-50',
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">
        {value === null ? <span className="text-gray-400 text-2xl">—</span> : value}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
