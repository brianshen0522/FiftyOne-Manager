import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { resolveImagePath, triggerLabelSync } from '@/lib/manager';
import { findInstanceForLabel } from '@/lib/db';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const POST = withApiLogging(async (req) => {
  try {
    const body = await req.json();
    const { labelPath, content, basePath, relativeLabelPath } = body;

    let fullLabelPath = labelPath;
    if (basePath && relativeLabelPath) {
      fullLabelPath = path.join(basePath, relativeLabelPath);
    }

    if (!fullLabelPath) {
      return NextResponse.json({ error: 'Missing label path' }, { status: 400 });
    }

    const labelDir = path.dirname(fullLabelPath);
    if (!fs.existsSync(labelDir)) {
      fs.mkdirSync(labelDir, { recursive: true });
    }

    fs.writeFileSync(fullLabelPath, content || '', 'utf-8');

    const instance = await findInstanceForLabel({ basePath, fullLabelPath });
    if (instance && instance.autoSync) {
      let relativePath = relativeLabelPath
        ? relativeLabelPath.replace(/\\/g, '/')
        : path.relative(instance.datasetPath, fullLabelPath).replace(/\\/g, '/');
      if (relativePath && !relativePath.startsWith('labels/') && fullLabelPath) {
        relativePath = path.relative(instance.datasetPath, fullLabelPath).replace(/\\/g, '/');
      }
      const imagePath = resolveImagePath(instance, relativePath, fullLabelPath);
      if (imagePath) {
        triggerLabelSync(instance, imagePath, fullLabelPath);
      } else {
        console.warn('Label sync skipped: image path not found for', fullLabelPath);
      }
    }

    return NextResponse.json({ success: true, message: 'Labels saved successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
