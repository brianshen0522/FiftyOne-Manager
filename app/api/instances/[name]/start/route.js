import { NextResponse } from 'next/server';
import path from 'path';
import {
  CONFIG,
  execPromise,
  loadInstances
} from '@/lib/manager';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const { name } = params;
    const instances = loadInstances();
    const instance = instances.find((item) => item.name === name);

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    try {
      await execPromise(`pm2 delete ${name}`);
    } catch (err) {
      // Ignore missing process.
    }

    const scriptPath = path.join(process.cwd(), 'start_fiftyone.py');
    const args = [instance.port, instance.datasetPath, '--iou-threshold', instance.threshold];

    if (instance.debug) {
      args.push('--debug');
    }

    if (instance.classFile) {
      args.push('--class-file', instance.classFile);
    }

    const command = `/opt/venv/bin/python ${scriptPath} ${args.join(' ')}`;

    const datasetName = path.basename(instance.datasetPath);
    const dbName = `${datasetName}_${instance.port}`;
    const mongodbUri = process.env.FIFTYONE_DATABASE_URI || 'mongodb://mongodb:27017';
    const pluginsDir = path.join(process.cwd(), 'fiftyone_plugins');

    const envVars = {
      FIFTYONE_DATABASE_URI: mongodbUri,
      FIFTYONE_DATABASE_NAME: dbName,
      FIFTYONE_PLUGINS_DIR: pluginsDir,
      MANAGER_PORT: CONFIG.managerPort,
      PUBLIC_ADDRESS: CONFIG.publicAddress
    };

    if (CONFIG.cvat.enabled && instance.cvatSync) {
      if (CONFIG.cvat.url) envVars.FIFTYONE_CVAT_URL = CONFIG.cvat.url;
      if (CONFIG.cvat.username) envVars.FIFTYONE_CVAT_USERNAME = CONFIG.cvat.username;
      if (CONFIG.cvat.password) envVars.FIFTYONE_CVAT_PASSWORD = CONFIG.cvat.password;
      if (CONFIG.cvat.email) envVars.FIFTYONE_CVAT_EMAIL = CONFIG.cvat.email;
    }

    const envString = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    const fullCommand = `${envString} pm2 start "${command}" --name ${name} --interpreter none --update-env`;
    await execPromise(fullCommand);

    return NextResponse.json({ message: 'Instance started successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
