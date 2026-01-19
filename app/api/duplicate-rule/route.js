import { NextResponse } from 'next/server';
import { getMatchingDuplicateRule } from '@/lib/manager';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const GET = withApiLogging(async (request) => {
  const { searchParams } = new URL(request.url);
  const datasetPath = searchParams.get('path');

  const rule = getMatchingDuplicateRule(datasetPath || '');

  return NextResponse.json(rule);
});
