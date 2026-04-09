import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDistinctDestinasi, getDistinctProductTypes } from '@/db/queries/kpi-metrics';
import { CHANNELS } from '@/lib/channel-map';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [destinasiOptions, productTypeOptions] = await Promise.all([
    getDistinctDestinasi(),
    getDistinctProductTypes(),
  ]);

  return NextResponse.json({
    destinasi:   destinasiOptions,
    productType: productTypeOptions,
    channel:     [...CHANNELS],
  });
}
