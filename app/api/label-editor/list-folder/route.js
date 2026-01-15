import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const basePath = searchParams.get('basePath');
    const folder = searchParams.get('folder');

    if (!basePath || !folder) {
      return NextResponse.json({ error: 'Missing basePath or folder parameter' }, { status: 400 });
    }

    const fullPath = path.join(basePath, folder);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
    const images = [];
    const imageMeta = {};

    function scanDirectory(dir, baseDir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullItemPath = path.join(dir, item);
        const stat = fs.statSync(fullItemPath);

        if (stat.isDirectory()) {
          scanDirectory(fullItemPath, baseDir);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (imageExtensions.includes(ext)) {
            const relativePath = path.relative(baseDir, fullItemPath);
            const imagePath = path.join(folder, relativePath).replace(/\\/g, '/');
            images.push(imagePath);
            imageMeta[imagePath] = {
              ctimeMs: stat.birthtimeMs || stat.ctimeMs,
              mtimeMs: stat.mtimeMs
            };
          }
        }
      }
    }

    scanDirectory(fullPath, fullPath);
    images.sort();

    return NextResponse.json({ images, count: images.length, imageMeta });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
