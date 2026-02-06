import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { withApiLogging } from '@/lib/api-logger';
import { getInstanceByName } from '@/lib/db';
import { CONFIG } from '@/lib/manager';

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
    const resolvedMaxSize = Number.isFinite(parseInt(maxSize, 10)) ? parseInt(maxSize, 10) : 512;

    const boundary = '----ThumbnailBatch';
    const parts = [];

    for (const imagePath of imagePaths) {
      if (!imagePath || typeof imagePath !== 'string') {
        continue;
      }
      const fullPath = path.resolve(path.join(baseResolved, imagePath));
      if (!fullPath.startsWith(basePrefix) || !fs.existsSync(fullPath)) {
        continue;
      }

      const buffer = fs.readFileSync(fullPath);
      const safeName = encodeURIComponent(imagePath);

      if (CONFIG.thumbnailQuality >= 100) {
        const ext = path.extname(fullPath).toLowerCase();
        const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp' };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const header = `--${boundary}\r\nContent-Disposition: form-data; name="${safeName}"\r\nContent-Type: ${contentType}\r\nContent-Length: ${buffer.length}\r\n\r\n`;
        parts.push(Buffer.from(header));
        parts.push(buffer);
      } else {
        const resized = await sharp(buffer)
          .resize({
            width: resolvedMaxSize,
            height: resolvedMaxSize,
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: CONFIG.thumbnailQuality })
          .toBuffer();
        const header = `--${boundary}\r\nContent-Disposition: form-data; name="${safeName}"\r\nContent-Type: image/jpeg\r\nContent-Length: ${resized.length}\r\n\r\n`;
        parts.push(Buffer.from(header));
        parts.push(resized);
      }
      parts.push(Buffer.from('\r\n'));
    }

    parts.push(Buffer.from(`--${boundary}--\r\n`));
    const body = Buffer.concat(parts);

    return new Response(body, {
      headers: {
        'Content-Type': `multipart/mixed; boundary=${boundary}`,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
