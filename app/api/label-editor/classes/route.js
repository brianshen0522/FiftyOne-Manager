import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getInstanceByName, getInstanceByDatasetPath } from '@/lib/db';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const GET = withApiLogging(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const basePath = searchParams.get('basePath');
    const instanceName = searchParams.get('instanceName');
    const defaultClasses = ['one', 'two', 'three', 'four', 'five', 'six', 'invalid'];

    // Direct lookup by instance name — no ambiguity
    if (instanceName) {
      const inst = await getInstanceByName(instanceName);
      if (inst && inst.classFile && fs.existsSync(inst.classFile)) {
        const content = fs.readFileSync(inst.classFile, 'utf-8');
        const classes = content.split('\n').map((line) => line.trim()).filter(Boolean);
        if (classes.length > 0) {
          return NextResponse.json({ classes, source: 'classFile', classFile: inst.classFile });
        }
      }
      return NextResponse.json({ classes: defaultClasses, source: 'default' });
    }

    if (!basePath) {
      return NextResponse.json({ classes: defaultClasses, source: 'default' });
    }

    const normalizedBase = path.resolve(basePath);
    const baseCandidates = new Set([normalizedBase]);
    if (fs.existsSync(normalizedBase)) {
      baseCandidates.add(fs.realpathSync(normalizedBase));
    }
    [normalizedBase, ...baseCandidates].forEach((candidate) => {
      if (candidate.endsWith(`${path.sep}images`)) {
        baseCandidates.add(candidate.slice(0, -(`${path.sep}images`).length));
      }
      if (candidate.endsWith(`${path.sep}labels`)) {
        baseCandidates.add(candidate.slice(0, -(`${path.sep}labels`).length));
      }
    });

    let instance = null;
    for (const cand of baseCandidates) {
      instance = await getInstanceByDatasetPath(cand);
      if (instance) {
        break;
      }
    }

    if (!instance || !instance.classFile) {
      return NextResponse.json({ classes: defaultClasses, source: 'default' });
    }

    if (!fs.existsSync(instance.classFile)) {
      return NextResponse.json({ classes: defaultClasses, source: 'default' });
    }

    const content = fs.readFileSync(instance.classFile, 'utf-8');
    const classes = content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (classes.length === 0) {
      return NextResponse.json({ classes: defaultClasses, source: 'default' });
    }

    return NextResponse.json({ classes, source: 'classFile', classFile: instance.classFile });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
