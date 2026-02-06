import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { withApiLogging } from '@/lib/api-logger';
import { getInstanceByName } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const POST = withApiLogging(async (req) => {
  try {
    const { basePath, imagePaths, instanceName, maxSize } = await req.json();

    if (!imagePaths || !Array.isArray(imagePaths)) {
      return NextResponse.json({ error: 'Missing imagePaths array' }, { status: 400 });
    }

    let resolvedBasePath = basePath;
    if (!resolvedBasePath && instanceName) {
      const instance = await getInstanceByName(instanceName);
      if (!instance) {
        return NextResponse.json({ error: `Instance not found: ${instanceName}` }, { status: 404 });
      }
      resolvedBasePath = instance.datasetPath;
    }

    if (!resolvedBasePath) {
      return NextResponse.json({ error: 'Missing basePath or instanceName' }, { status: 400 });
    }

    const baseResolved = path.resolve(resolvedBasePath);
    const basePrefix = `${baseResolved}${path.sep}`;
    const thumbnails = {};
    const resolvedMaxSize = Number.isFinite(parseInt(maxSize, 10)) ? parseInt(maxSize, 10) : 512;

    for (const imagePath of imagePaths) {
      if (!imagePath || typeof imagePath !== 'string') {
        continue;
      }
      const fullPath = path.resolve(path.join(baseResolved, imagePath));
      if (!fullPath.startsWith(basePrefix) || !fs.existsSync(fullPath)) {
        continue;
      }

      const buffer = fs.readFileSync(fullPath);
      const resized = await sharp(buffer)
        .resize({
          width: resolvedMaxSize,
          height: resolvedMaxSize,
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 70 })
        .toBuffer();
      thumbnails[imagePath] = `data:image/jpeg;base64,${resized.toString('base64')}`;
    }

    return NextResponse.json({ thumbnails });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
