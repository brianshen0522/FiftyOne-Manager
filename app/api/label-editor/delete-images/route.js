import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const POST = withApiLogging(async (req) => {
  try {
    const { basePath, images } = await req.json();

    if (!basePath || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Missing basePath or images array' }, { status: 400 });
    }

    let deleted = 0;
    const errors = [];

    for (const imagePath of images) {
      try {
        const fullImagePath = path.join(basePath, imagePath);

        // Delete image file
        if (fs.existsSync(fullImagePath)) {
          fs.unlinkSync(fullImagePath);
        }

        // Delete corresponding label file
        const ext = path.extname(imagePath);
        const labelPath = imagePath.replace('images/', 'labels/').replace(ext, '.txt');
        const fullLabelPath = path.join(basePath, labelPath);

        if (fs.existsSync(fullLabelPath)) {
          fs.unlinkSync(fullLabelPath);
        }

        deleted++;
      } catch (err) {
        errors.push({ path: imagePath, error: err.message });
      }
    }

    return NextResponse.json({ deleted, errors });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
