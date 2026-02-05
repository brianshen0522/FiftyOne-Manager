import { NextResponse } from 'next/server';
import { getInstanceByDatasetPath } from '@/lib/db';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const GET = withApiLogging(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const datasetPath = searchParams.get('datasetPath');
    if (!datasetPath) {
      return NextResponse.json({ error: 'Missing datasetPath' }, { status: 400 });
    }
    const instance = await getInstanceByDatasetPath(datasetPath);
    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }
    return NextResponse.json({ lastImagePath: instance.lastImagePath || '' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
