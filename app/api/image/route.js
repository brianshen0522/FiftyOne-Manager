import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { withApiLogging } from '@/lib/api-logger';
import { getInstanceByName } from '@/lib/db';

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
    const instanceName = searchParams.get('i');
    const imageName = searchParams.get('n');

    let imagePath = fullPath;

    // Mode 1: Short URL with instance name + image filename (with extension)
    if (instanceName && imageName) {
      const instance = await getInstanceByName(instanceName);

      if (!instance) {
        return NextResponse.json({ error: `Instance not found: ${instanceName}` }, { status: 404 });
      }

      imagePath = path.join(instance.datasetPath, 'images', imageName);
    }
    // Mode 2: basePath + relativePath
    else if (basePath && relativePath) {
      imagePath = path.join(basePath, relativePath);
    }
    // Mode 3: fullPath (already set above)

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
