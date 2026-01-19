import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.bmp': 'image/bmp',
  '.gif': 'image/gif'
};

export const GET = withApiLogging(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const basePath = searchParams.get('basePath');
    const relativePath = searchParams.get('relativePath');
    const fullPath = searchParams.get('fullPath');

    let imagePath = fullPath;
    if (basePath && relativePath) {
      imagePath = path.join(basePath, relativePath);
    }

    if (!imagePath || !fs.existsSync(imagePath)) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const stream = fs.createReadStream(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(Readable.toWeb(stream), {
      headers: {
        'Content-Type': contentType
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
