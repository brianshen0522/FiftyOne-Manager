import { NextResponse } from 'next/server';
import path from 'path';
import { loadInstances, CONFIG } from '@/lib/manager';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const GET = withApiLogging(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Missing instance name' }, { status: 400 });
    }

    const instances = loadInstances();
    const instance = instances.find((i) => i.name === name);

    if (!instance) {
      return NextResponse.json({ error: `Instance not found: ${name}` }, { status: 404 });
    }

    const basePath = path.resolve(CONFIG.datasetBasePath).replace(/\/+$/, '');
    const datasetPath = instance.datasetPath || '';

    // Calculate relative folder path
    let folder = '';
    if (datasetPath.startsWith(`${basePath}/`)) {
      const relativePath = datasetPath.slice(basePath.length + 1).replace(/\/+$/, '');
      folder = relativePath.endsWith('/images') || relativePath === 'images'
        ? relativePath
        : `${relativePath}/images`;
    }

    return NextResponse.json({
      basePath,
      folder,
      obbMode: instance.obbMode || 'rectangle',
      lastImagePath: instance.lastImagePath || '',
      instanceName: instance.name,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
