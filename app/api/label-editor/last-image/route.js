import { NextResponse } from 'next/server';
import path from 'path';
import { loadInstances, saveInstances } from '@/lib/manager';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { basePath, imagePath } = body;
    if (!basePath || !imagePath) {
      return NextResponse.json({ error: 'Missing basePath or imagePath' }, { status: 400 });
    }

    const instances = loadInstances();
    const fullImagePath = path.resolve(path.join(basePath, imagePath));
    const instance = instances.find((item) => {
      const datasetRoot = path.resolve(item.datasetPath);
      return fullImagePath.startsWith(`${datasetRoot}${path.sep}`) || fullImagePath === datasetRoot;
    });
    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    instance.lastImagePath = imagePath;
    instance.updatedAt = new Date().toISOString();
    saveInstances(instances);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const basePath = searchParams.get('basePath');
    const folder = searchParams.get('folder');
    if (!basePath) {
      return NextResponse.json({ error: 'Missing basePath' }, { status: 400 });
    }

    const instances = loadInstances();
    let instance = null;
    const normalizedBase = path.resolve(basePath);

    if (folder) {
      const normalizedFolder = folder.replace(/\\/g, '/').replace(/\/+$/, '');
      const datasetSuffix = normalizedFolder.replace(/\/images$/, '').replace(/^images$/, '');
      const datasetRoot = datasetSuffix
        ? path.resolve(path.join(basePath, datasetSuffix))
        : normalizedBase;
      instance = instances.find((item) => path.resolve(item.datasetPath) === datasetRoot) || null;
    }

    if (!instance) {
      instance = instances.find((item) => path.resolve(item.datasetPath) === normalizedBase) || null;
    }

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    return NextResponse.json({ lastImagePath: instance.lastImagePath || '' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
