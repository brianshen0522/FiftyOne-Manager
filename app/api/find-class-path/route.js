import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { CONFIG, containsClassFiles } from '@/lib/manager';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const GET = withApiLogging(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const targetPath = searchParams.get('path');
    const basePath = CONFIG.datasetBasePath;

    if (!targetPath) {
      return NextResponse.json({ path: '' });
    }

    const resolvedTarget = path.resolve(targetPath);
    const resolvedBase = path.resolve(basePath);

    if (!resolvedTarget.startsWith(resolvedBase)) {
      return NextResponse.json({ path: '' });
    }

    let currentPath = resolvedTarget;

    while (currentPath.length >= resolvedBase.length) {
      if (fs.existsSync(currentPath) && containsClassFiles(currentPath)) {
        const relativePath = path.relative(resolvedBase, currentPath);
        return NextResponse.json({ path: relativePath || '' });
      }

      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) break;
      currentPath = parentPath;
    }

    return NextResponse.json({ path: '' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
