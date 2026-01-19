import { NextResponse } from 'next/server';
import fs from 'fs';
import { isPathInDatasetBase } from '@/lib/manager';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const GET = withApiLogging(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    if (!filePath) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    if (!isPathInDatasetBase(filePath)) {
      return NextResponse.json({ error: 'Path is outside dataset base path' }, { status: 400 });
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (!filePath.toLowerCase().endsWith('.txt')) {
      return NextResponse.json({ error: 'Only .txt files can be previewed' }, { status: 400 });
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const limit = 10000;
    const truncated = raw.length > limit;
    const content = truncated ? raw.slice(0, limit) : raw;

    return NextResponse.json({ content, truncated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
