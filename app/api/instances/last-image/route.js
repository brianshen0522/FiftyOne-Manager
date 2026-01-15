import { NextResponse } from 'next/server';
import path from 'path';
import { loadInstances } from '@/lib/manager';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const datasetPath = searchParams.get('datasetPath');
    if (!datasetPath) {
      return NextResponse.json({ error: 'Missing datasetPath' }, { status: 400 });
    }
    const instances = loadInstances();
    const normalizedPath = path.resolve(datasetPath);
    const instance = instances.find((item) => path.resolve(item.datasetPath) === normalizedPath);
    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }
    return NextResponse.json({ lastImagePath: instance.lastImagePath || '' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
