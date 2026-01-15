import { NextResponse } from 'next/server';
import {
  CONFIG,
  execPromise,
  isPortInUse,
  loadInstances,
  saveInstances,
  validatePort
} from '@/lib/manager';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    const { name } = params;
    const body = await req.json();
    const { port, datasetPath, threshold, debug, cvatSync, pentagonFormat, obbMode, classFile, autoSync } =
      body;

    const instances = loadInstances();
    const index = instances.findIndex((instance) => instance.name === name);

    if (index === -1) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    if (instances[index].status === 'online') {
      return NextResponse.json({ error: 'Cannot update running instance. Stop it first.' }, { status: 400 });
    }

    if (port !== undefined) {
      const numericPort = Number(port);
      if (!validatePort(numericPort)) {
        return NextResponse.json(
          { error: `Port must be within range ${CONFIG.portRange.start}-${CONFIG.portRange.end}` },
          { status: 400 }
        );
      }
      if (numericPort !== instances[index].port && isPortInUse(instances, numericPort, name)) {
        return NextResponse.json({ error: 'Port already in use' }, { status: 400 });
      }
      instances[index].port = numericPort;
    }

    if (datasetPath !== undefined) instances[index].datasetPath = datasetPath;
    if (threshold !== undefined) instances[index].threshold = threshold;
    if (debug !== undefined) instances[index].debug = debug;
    if (cvatSync !== undefined) instances[index].cvatSync = CONFIG.cvat.enabled ? cvatSync : false;
    if (pentagonFormat !== undefined) instances[index].pentagonFormat = pentagonFormat;
    if (obbMode !== undefined) instances[index].obbMode = obbMode || 'rectangle';
    if (classFile !== undefined) instances[index].classFile = classFile || null;
    if (autoSync !== undefined) instances[index].autoSync = autoSync;
    instances[index].updatedAt = new Date().toISOString();

    saveInstances(instances);
    return NextResponse.json(instances[index]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { name } = params;
    const instances = loadInstances();
    const index = instances.findIndex((instance) => instance.name === name);

    if (index === -1) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    if (instances[index].status === 'online') {
      await execPromise(`pm2 delete ${name}`);
    }

    instances.splice(index, 1);
    saveInstances(instances);

    return NextResponse.json({ message: 'Instance deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
