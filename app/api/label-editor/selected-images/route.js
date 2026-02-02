import { NextResponse } from 'next/server';
import { loadInstances, saveInstances } from '@/lib/manager';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

// GET: load selected images for an instance
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
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    return NextResponse.json({ selectedImages: instance.selectedImages || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// POST: save selected images for an instance
export const POST = withApiLogging(async (req) => {
  try {
    const { name, selectedImages } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Missing instance name' }, { status: 400 });
    }

    const instances = loadInstances();
    const instance = instances.find((i) => i.name === name);
    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    instance.selectedImages = Array.isArray(selectedImages) ? selectedImages : [];
    saveInstances(instances);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
