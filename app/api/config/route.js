import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/manager';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const GET = withApiLogging(async () => {
  return NextResponse.json(CONFIG);
});
