const fs = require('fs');
const path = require('path');

async function run() {
  const instancesPath = path.join(process.cwd(), 'instances.json', 'instances.json');
  if (!fs.existsSync(instancesPath)) {
    console.error(`instances.json not found at ${instancesPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(instancesPath, 'utf-8');
  let instances;
  try {
    instances = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse instances.json:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(instances)) {
    console.error('instances.json must contain an array');
    process.exit(1);
  }

  const {
    initDatabase,
    getAllInstances,
    getInstanceByName,
    createInstance,
    updateInstance,
    updateInstanceFields,
    closePool
  } = await import('../src/lib/db.js');

  await initDatabase();

  try {
    for (const instance of instances) {
      const existing = await getInstanceByName(instance.name);

      if (!existing) {
        await createInstance({
          name: instance.name,
          port: instance.port,
          datasetPath: instance.datasetPath,
          threshold: instance.threshold,
          debug: instance.debug,
          pentagonFormat: instance.pentagonFormat,
          obbMode: instance.obbMode,
          classFile: instance.classFile,
          autoSync: instance.autoSync,
          status: instance.status,
          createdAt: instance.createdAt
        });
      } else {
        await updateInstance(instance.name, {
          port: instance.port,
          datasetPath: instance.datasetPath,
          threshold: instance.threshold,
          debug: instance.debug,
          pentagonFormat: instance.pentagonFormat,
          obbMode: instance.obbMode,
          classFile: instance.classFile,
          autoSync: instance.autoSync
        });
      }

      await updateInstanceFields(instance.name, {
        status: instance.status,
        pid: instance.pid,
        serviceHealth: instance.serviceHealth,
        healthDetails: instance.healthDetails,
        lastImagePath: instance.lastImagePath,
        selectedImages: instance.selectedImages,
        filter: instance.filter,
        previewSortMode: instance.previewSortMode,
        pentagonFormat: instance.pentagonFormat,
        updatedAt: instance.updatedAt
      });
    }

    const migrated = await getAllInstances();
    const migratedNames = new Set(migrated.map((item) => item.name));
    const missing = instances.filter((item) => !migratedNames.has(item.name));

    if (missing.length > 0) {
      console.error('Migration incomplete. Missing instances:', missing.map((item) => item.name));
      process.exit(1);
    }

    console.log(`Migration complete: ${instances.length} instance(s) migrated.`);
  } finally {
    await closePool();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
