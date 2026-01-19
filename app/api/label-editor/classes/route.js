import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadInstances } from '@/lib/manager';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const GET = withApiLogging(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const basePath = searchParams.get('basePath');
    const defaultClasses = ['one', 'two', 'three', 'four', 'five', 'six', 'invalid'];

    if (!basePath) {
      return NextResponse.json({ classes: defaultClasses, source: 'default' });
    }

    const instances = loadInstances();
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

    const matchScore = (base, datasetPath) => {
      if (base === datasetPath) return 100000 + datasetPath.length;
      if (base.startsWith(`${datasetPath}${path.sep}`)) return datasetPath.length;
      if (datasetPath.startsWith(`${base}${path.sep}`)) return base.length - 1;
      return -1;
    };

    let instance = null;
    let bestScore = -1;
    for (const cand of baseCandidates) {
      for (const inst of instances) {
        if (!inst.datasetPath) {
          continue;
        }
        const resolved = path.resolve(inst.datasetPath);
        const resolvedReal = fs.existsSync(resolved) ? fs.realpathSync(resolved) : resolved;
        const score = Math.max(matchScore(cand, resolved), matchScore(cand, resolvedReal));
        if (score > bestScore) {
          bestScore = score;
          instance = inst;
        }
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
