import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { checkDatasetFormat, loadInstances } from '@/lib/manager';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const GET = withApiLogging(async (req, { params }) => {
  try {
    const { name } = params;
    const instances = loadInstances();
    const instance = instances.find((item) => item.name === name);

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    const datasetPath = path.resolve(instance.datasetPath);

    if (!fs.existsSync(datasetPath)) {
      return NextResponse.json({ error: 'Dataset path does not exist' }, { status: 400 });
    }

    const formatCheck = await checkDatasetFormat(datasetPath);
    return NextResponse.json(formatCheck);
  } catch (err) {
    console.error('Error checking format:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
