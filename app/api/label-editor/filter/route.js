import { NextResponse } from 'next/server';
import { getInstanceByName, updateInstanceFields } from '@/lib/db';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

// GET: load saved filter for an instance
export const GET = withApiLogging(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    if (!name) {
      return NextResponse.json({ error: 'Missing instance name' }, { status: 400 });
    }

    const instance = await getInstanceByName(name);
    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    return NextResponse.json({
      filter: instance.filter || null,
      previewSortMode: instance.previewSortMode || null
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// POST: save filter for an instance
export const POST = withApiLogging(async (req) => {
  try {
    const body = await req.json();
    const { name, filter, previewSortMode } = body;
    if (!name) {
      return NextResponse.json({ error: 'Missing instance name' }, { status: 400 });
    }

    const instance = await getInstanceByName(name);
    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    const fields = {};
    if (Object.prototype.hasOwnProperty.call(body, 'filter')) {
      fields.filter = filter && typeof filter === 'object' ? filter : null;
    }
    if (previewSortMode !== undefined) {
      fields.previewSortMode = previewSortMode || null;
    }
    await updateInstanceFields(name, fields);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
