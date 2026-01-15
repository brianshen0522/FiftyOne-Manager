import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const image = searchParams.get('image');
    const label = searchParams.get('label');
    const basePath = searchParams.get('basePath');
    const relativeImage = searchParams.get('relativeImage');
    const relativeLabel = searchParams.get('relativeLabel');

    let imagePath = image;
    let labelPath = label;

    if (basePath) {
      if (relativeImage) imagePath = path.join(basePath, relativeImage);
      if (relativeLabel) labelPath = path.join(basePath, relativeLabel);
    }

    if (!imagePath || !labelPath) {
      return NextResponse.json({ error: 'Missing image or label path' }, { status: 400 });
    }

    if (!fs.existsSync(imagePath)) {
      return NextResponse.json({ error: 'Image file not found' }, { status: 404 });
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const imageExt = path.extname(imagePath).toLowerCase();
    const mimeType = imageExt === '.png' ? 'image/png' : 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    let labelContent = '';
    if (fs.existsSync(labelPath)) {
      labelContent = fs.readFileSync(labelPath, 'utf-8');
    }

    return NextResponse.json({
      filename: path.basename(imagePath),
      imagePath,
      labelPath,
      relativeImage: relativeImage || imagePath,
      relativeLabel: relativeLabel || labelPath,
      basePath: basePath || '',
      imageDataUrl,
      labelContent
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
