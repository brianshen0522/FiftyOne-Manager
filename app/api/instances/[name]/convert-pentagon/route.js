import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  checkDatasetFormat,
  convertDatasetToPentagonFormat
} from '@/lib/manager';
import { getInstanceByName, updateInstanceFields } from '@/lib/db';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const POST = withApiLogging(async (req, { params }) => {
  try {
    const { name } = params;
    const instance = await getInstanceByName(name);

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    const datasetPath = path.resolve(instance.datasetPath);

    if (!fs.existsSync(datasetPath)) {
      return NextResponse.json({ error: 'Dataset path does not exist' }, { status: 400 });
    }

    const formatCheck = await checkDatasetFormat(datasetPath);

    if (formatCheck.format === 'obb') {
      await updateInstanceFields(name, { pentagonFormat: true });
      return NextResponse.json({
        message: 'Dataset is already in OBB format',
        alreadyConverted: true,
        formatCheck
      });
    }

    if (formatCheck.format === 'unknown') {
      return NextResponse.json(
        { error: 'Could not determine dataset format', reason: formatCheck.reason },
        { status: 400 }
      );
    }

    const result = await convertDatasetToPentagonFormat(datasetPath);

    await updateInstanceFields(name, { pentagonFormat: true });

    return NextResponse.json({
      message: 'Dataset converted to OBB format successfully',
      ...result,
      formatCheck
    });
  } catch (err) {
    console.error('Error converting to OBB format:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
