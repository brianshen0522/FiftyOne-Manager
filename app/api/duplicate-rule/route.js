import { NextResponse } from 'next/server';
import { getMatchingDuplicateRule } from '@/lib/manager';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const datasetPath = searchParams.get('path');

  const rule = getMatchingDuplicateRule(datasetPath || '');

  return NextResponse.json(rule);
}
