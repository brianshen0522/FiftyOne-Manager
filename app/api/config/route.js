import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/manager';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(CONFIG);
}
