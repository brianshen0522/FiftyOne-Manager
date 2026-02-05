import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const POST = withApiLogging(async (req) => {
  try {
    const { basePath, imagePaths } = await req.json();

    if (!basePath || !imagePaths || !Array.isArray(imagePaths)) {
      return NextResponse.json({ error: 'Missing basePath or imagePaths array' }, { status: 400 });
    }

    // Process all labels in parallel
    const labels = {};
    await Promise.all(imagePaths.map(async (imagePath) => {
      const labelPath = imagePath
        .replace('images/', 'labels/')
        .replace(/\.(jpg|jpeg|png)$/i, '.txt');
      const fullLabelPath = path.join(basePath, labelPath);

      let labelContent = '';
      try {
        if (fs.existsSync(fullLabelPath)) {
          labelContent = fs.readFileSync(fullLabelPath, 'utf-8');
        }
      } catch (err) {
        // Ignore individual file errors
      }
      labels[imagePath] = labelContent;
    }));

    return NextResponse.json({ labels });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
