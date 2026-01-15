import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const label = searchParams.get('label');
    const basePath = searchParams.get('basePath');
    const relativeLabel = searchParams.get('relativeLabel');

    let labelPath = label;

    if (basePath && relativeLabel) {
      labelPath = path.join(basePath, relativeLabel);
    }

    if (!labelPath) {
      return NextResponse.json({ error: 'Missing label path' }, { status: 400 });
    }

    let labelContent = '';
    if (fs.existsSync(labelPath)) {
      labelContent = fs.readFileSync(labelPath, 'utf-8');
    }

    return NextResponse.json({ labelPath, labelContent });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
