import { NextResponse } from 'next/server';
import fs from 'fs';
import { getPm2LogInfo, loadInstances } from '@/lib/manager';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { name } = params;
    const { searchParams } = new URL(req.url);
    const linesParam = searchParams.get('lines');
    const requestedAllLines = linesParam && String(linesParam).toLowerCase() === 'all';
    let lineLimit = 100;
    if (requestedAllLines) {
      lineLimit = null;
    } else if (linesParam !== null) {
      const parsed = parseInt(linesParam, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        lineLimit = parsed;
      }
    }

    const instances = loadInstances();
    const instance = instances.find((item) => item.name === name);

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    const { outLogPath } = getPm2LogInfo(name);

    let stdout = '';
    const debugInfo = {
      linesRequested: lineLimit || 'all',
      outLogExists: fs.existsSync(outLogPath),
      outLogPath,
      errLogSkipped: true
    };

    if (fs.existsSync(outLogPath)) {
      try {
        const outContent = fs.readFileSync(outLogPath, 'utf-8');
        const outLines = outContent.split('\n');
        stdout = lineLimit ? outLines.slice(-lineLimit).join('\n') : outContent;
        debugInfo.outLogSize = outContent.length;
        debugInfo.outLogLineCount = outLines.length;
      } catch (err) {
        console.error('Failed to read out log:', err.message);
        debugInfo.outLogError = err.message;
      }
    }

    console.log('Log files debug:', debugInfo);

    return NextResponse.json({
      stdout: stdout || '',
      stderr: '',
      _debug: debugInfo
    });
  } catch (err) {
    return NextResponse.json({ stdout: '', stderr: err.message });
  }
}
