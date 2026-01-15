import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { basePath, images } = body;

    if (!basePath || !images || !Array.isArray(images)) {
      return NextResponse.json({ error: 'Missing basePath or images array' }, { status: 400 });
    }

    const metadata = {};

    for (const imagePath of images) {
      try {
        const labelPath = imagePath
          .replace('images/', 'labels/')
          .replace(/\.(jpg|jpeg|png|bmp|gif)$/i, '.txt');
        const fullLabelPath = path.join(basePath, labelPath);

        let labelContent = '';
        if (fs.existsSync(fullLabelPath)) {
          labelContent = fs.readFileSync(fullLabelPath, 'utf-8');
        }

        const lines = labelContent.trim().split('\n').filter((line) => line.trim());
        const annotations = [];

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const classId = parseInt(parts[0], 10);
            if (!Number.isNaN(classId)) {
              annotations.push(classId);
            }
          }
        }

        const classes = [...new Set(annotations)];

        metadata[imagePath] = {
          classes,
          count: annotations.length
        };
      } catch (err) {
        metadata[imagePath] = {
          classes: [],
          count: 0
        };
      }
    }

    return NextResponse.json({ metadata });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
