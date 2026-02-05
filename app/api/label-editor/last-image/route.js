import { NextResponse } from 'next/server';
import path from 'path';
import { getInstanceByDatasetPath, getInstanceByName, updateInstanceFields } from '@/lib/db';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const POST = withApiLogging(async (req) => {
  try {
    const body = await req.json();
    const { basePath, imagePath, instanceName } = body;
    if (!basePath || !imagePath) {
      return NextResponse.json({ error: 'Missing basePath or imagePath' }, { status: 400 });
    }

    let instance;
    if (instanceName) {
      instance = await getInstanceByName(instanceName);
    } else {
      const fullImagePath = path.resolve(path.join(basePath, imagePath));
      const imagesMarker = `${path.sep}images${path.sep}`;
      const markerIndex = fullImagePath.indexOf(imagesMarker);
      const datasetRoot = markerIndex > -1 ? fullImagePath.slice(0, markerIndex) : path.resolve(basePath);
      instance = await getInstanceByDatasetPath(datasetRoot);
      if (!instance && datasetRoot !== path.resolve(basePath)) {
        instance = await getInstanceByDatasetPath(basePath);
      }
    }
    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    await updateInstanceFields(instance.name, {
      lastImagePath: imagePath,
      updatedAt: new Date().toISOString()
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

export const GET = withApiLogging(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const basePath = searchParams.get('basePath');
    const folder = searchParams.get('folder');
    if (!basePath) {
      return NextResponse.json({ error: 'Missing basePath' }, { status: 400 });
    }

    let instance = null;
    const normalizedBase = path.resolve(basePath);

    if (folder) {
      const normalizedFolder = folder.replace(/\\/g, '/').replace(/\/+$/, '');
      const datasetSuffix = normalizedFolder.replace(/\/images$/, '').replace(/^images$/, '');
      const datasetRoot = datasetSuffix
        ? path.resolve(path.join(basePath, datasetSuffix))
        : normalizedBase;
      instance = await getInstanceByDatasetPath(datasetRoot);
    }

    if (!instance) {
      instance = await getInstanceByDatasetPath(normalizedBase);
    }

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    return NextResponse.json({ lastImagePath: instance.lastImagePath || '' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
