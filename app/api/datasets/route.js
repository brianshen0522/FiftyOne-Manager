import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CONFIG, findDatasetFolders } from '@/lib/manager';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const GET = withApiLogging(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const depthParam = searchParams.get('depth') || searchParams.get('maxDepth');
    const parsedDepth = depthParam ? parseInt(depthParam, 10) : NaN;
    const maxDepth = Number.isFinite(parsedDepth) && parsedDepth > 0 ? parsedDepth : 5;

    const basePath = path.resolve(CONFIG.datasetBasePath);
    if (!fs.existsSync(basePath)) {
      return NextResponse.json([]);
    }
    const stat = fs.statSync(basePath);
    if (!stat.isDirectory()) {
      return NextResponse.json([]);
    }

    const datasets = findDatasetFolders(basePath, '', maxDepth);
    return NextResponse.json(datasets);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
