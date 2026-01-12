require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec, execFile } = require('child_process');
const util = require('util');
const http = require('http');

const execPromise = util.promisify(exec);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Configuration
const CONFIG = {
  datasetBasePath: process.env.DATASET_BASE_PATH || '/data/datasets',
  portRange: {
    start: parseInt(process.env.PORT_START || '5151'),
    end: parseInt(process.env.PORT_END || '5160')
  },
  managerPort: parseInt(process.env.MANAGER_PORT || '3000'),
  publicAddress: process.env.PUBLIC_ADDRESS || 'localhost',
  defaultIouThreshold: parseFloat(process.env.DEFAULT_IOU_THRESHOLD || '0.8'),
  defaultDebug: process.env.DEFAULT_DEBUG_MODE === 'true',
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '5000'),
  healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '3000'),
  cvat: {
    enabled: process.env.CVAT_ENABLED === 'true',
    url: process.env.CVAT_URL || '',
    username: process.env.CVAT_USERNAME || '',
    password: process.env.CVAT_PASSWORD || '',
    email: process.env.CVAT_EMAIL || ''
  }
};

// Store instances configuration
const INSTANCES_FILE = path.join(__dirname, 'instances.json');

function getInstancesFilePath() {
  if (fs.existsSync(INSTANCES_FILE)) {
    const stat = fs.statSync(INSTANCES_FILE);
    if (stat.isDirectory()) {
      // Allow instances.json to be a directory; use a file inside it.
      return path.join(INSTANCES_FILE, 'instances.json');
    }
  }
  return INSTANCES_FILE;
}

function loadInstances() {
  const filePath = getInstancesFilePath();
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to read instances file:', err.message);
  }
  return [];
}

function saveInstances(instances) {
  const filePath = getInstancesFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(instances, null, 2));
}

function validatePort(port) {
  return port >= CONFIG.portRange.start && port <= CONFIG.portRange.end;
}

function validateInstanceNameFormat(name) {
  // Allow only letters, numbers, underscores, and hyphens to avoid special characters.
  return typeof name === 'string' && /^[A-Za-z0-9_-]+$/.test(name);
}

function isPortInUse(instances, port, excludeName = null) {
  return instances.some(i => i.port === port && i.name !== excludeName);
}

function isNameInUse(instances, name, excludeName = null) {
  return instances.some(i => i.name === name && i.name !== excludeName);
}

function getInstanceDbName(instance) {
  const datasetName = path.basename(instance.datasetPath || '');
  return `${datasetName || 'datasets'}_${instance.port}`;
}

function findInstanceForLabel({ basePath, fullLabelPath }) {
  const instances = loadInstances();
  if (basePath) {
    const normalizedBase = path.resolve(basePath);
    const matched = instances.find(i => path.resolve(i.datasetPath) === normalizedBase) || null;
    if (matched) {
      return matched;
    }
  }
  if (fullLabelPath) {
    const normalizedLabelPath = path.resolve(fullLabelPath);
    return instances.find(i => {
      const datasetRoot = path.resolve(i.datasetPath);
      return normalizedLabelPath.startsWith(`${datasetRoot}${path.sep}`);
    }) || null;
  }
  return null;
}

function resolveImagePath(instance, relativeLabelPath, fullLabelPath) {
  const basePath = instance.datasetPath;
  let relativePath = relativeLabelPath;
  if (!relativePath && fullLabelPath && basePath) {
    relativePath = path.relative(basePath, fullLabelPath).replace(/\\/g, '/');
  }
  if (!relativePath) {
    return '';
  }

  const stem = relativePath
    .replace(/^labels\//, 'images/')
    .replace(/\.txt$/i, '');
  const extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
  for (const ext of extensions) {
    const candidate = path.join(basePath, `${stem}${ext}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return '';
}

function triggerLabelSync(instance, imagePath, labelPath) {
  if (!instance || !imagePath || !labelPath) {
    return;
  }

  const pythonPath = getPythonBin();
  const scriptPath = path.join(__dirname, 'sync_label.py');
  const datasetName = getInstanceDbName(instance);
  const env = {
    ...process.env,
    FIFTYONE_DATABASE_URI: process.env.FIFTYONE_DATABASE_URI || 'mongodb://mongodb:27017',
    FIFTYONE_DATABASE_NAME: datasetName
  };

  const args = [
    scriptPath,
    '--dataset-name', datasetName,
    '--image-path', imagePath,
    '--label-path', labelPath
  ];
  if (instance.classFile) {
    args.push('--class-file', instance.classFile);
  }

  execFile(pythonPath, args, { env }, (err, stdout, stderr) => {
    if (err) {
      console.error('Label sync failed:', err.message);
      if (stderr) {
        console.error(stderr.toString());
      }
      return;
    }
    if (stdout) {
      console.log(stdout.toString().trim());
    }
  });
}

function getPythonBin() {
  const explicit = process.env.PYTHON_BIN || process.env.FIFTYONE_PYTHON;
  if (explicit && fs.existsSync(explicit)) {
    return explicit;
  }
  const venvPython = '/opt/venv/bin/python';
  if (fs.existsSync(venvPython)) {
    return venvPython;
  }
  return 'python3';
}

 

// Health check function to test if FiftyOne service is responding
async function checkServiceHealth(port) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: 'localhost',
      port: port,
      path: '/',
      timeout: CONFIG.healthCheckTimeout
    }, (res) => {
      // Check if status code is 2xx
      const isHealthy = res.statusCode >= 200 && res.statusCode < 300;
      resolve({
        healthy: isHealthy,
        statusCode: res.statusCode
      });
      res.resume(); // Consume response data to free up memory
    });

    req.on('error', (err) => {
      resolve({
        healthy: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        healthy: false,
        error: 'Timeout'
      });
    });
  });
}

// API Routes

// Helper function to recursively find valid dataset folders
function findDatasetFolders(baseDir, currentPath = '', maxDepth = 5, currentDepth = 0) {
  const results = [];

  if (currentDepth >= maxDepth) {
    return results;
  }

  try {
    const fullPath = path.join(baseDir, currentPath);

    if (!fs.existsSync(fullPath)) {
      return results;
    }

    // Check if this directory is a valid dataset (contains images/ and labels/)
    const hasImages = fs.existsSync(path.join(fullPath, 'images')) &&
                      fs.statSync(path.join(fullPath, 'images')).isDirectory();
    const hasLabels = fs.existsSync(path.join(fullPath, 'labels')) &&
                      fs.statSync(path.join(fullPath, 'labels')).isDirectory();

    if (hasImages && hasLabels) {
      // This is a valid dataset folder
      results.push({
        name: currentPath || path.basename(fullPath),
        path: fullPath,
        relativePath: currentPath
      });
    }

    // Recursively scan subdirectories
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const subPath = currentPath ? path.join(currentPath, entry.name) : entry.name;
        const subResults = findDatasetFolders(baseDir, subPath, maxDepth, currentDepth + 1);
        results.push(...subResults);
      }
    }
  } catch (err) {
    console.error(`Error scanning ${currentPath}:`, err.message);
  }

  return results;
}

// List available dataset folders within the configured base path
app.get('/api/datasets', (req, res) => {
  try {
    const base = CONFIG.datasetBasePath;
    if (!fs.existsSync(base)) {
      return res.status(400).json({ error: `Base path not found: ${base}` });
    }

    const datasets = findDatasetFolders(base);

    res.json(datasets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get configuration
app.get('/api/config', (req, res) => {
  res.json(CONFIG);
});

// Helper function to check if a directory contains class files (recursively)
function containsClassFiles(dirPath, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return false;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isFile() && entry.name.toLowerCase().endsWith('.txt') && entry.name.toLowerCase().includes('class')) {
        return true;
      }

      if (entry.isDirectory()) {
        if (containsClassFiles(fullPath, maxDepth, currentDepth + 1)) {
          return true;
        }
      }
    }
  } catch (err) {
    // Can't read directory
  }

  return false;
}

function isPathInDatasetBase(targetPath) {
  const base = path.resolve(CONFIG.datasetBasePath);
  const resolved = path.resolve(targetPath);
  const relative = path.relative(base, resolved);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

// Browse filesystem path
app.get('/api/browse-path', (req, res) => {
  try {
    let browsePath = req.query.path || '/';
    const filterClassFiles = req.query.filterClassFiles === 'true';

    // Normalize path
    if (browsePath === '' || browsePath === 'root') {
      browsePath = '/';
    }

    if (!fs.existsSync(browsePath)) {
      return res.json({ folders: [], files: [] });
    }

    const stat = fs.statSync(browsePath);
    if (!stat.isDirectory()) {
      return res.json({ folders: [], files: [] });
    }

    const entries = fs.readdirSync(browsePath, { withFileTypes: true });
    const folders = [];
    const files = [];

    for (const entry of entries) {
      // Skip hidden files/folders
      if (entry.name.startsWith('.')) continue;

      try {
        if (entry.isDirectory()) {
          // If filtering for class files, only include folders that contain them
          if (filterClassFiles) {
            const fullPath = path.join(browsePath, entry.name);
            if (containsClassFiles(fullPath)) {
              folders.push(entry.name);
            }
          } else {
            folders.push(entry.name);
          }
        } else if (entry.isFile()) {
          files.push(entry.name);
        }
      } catch (err) {
        // Skip entries we can't access
      }
    }

    // Sort alphabetically
    folders.sort();
    files.sort();

    res.json({ folders, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Preview class file content
app.get('/api/class-file', (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    // Only allow reading files inside the dataset base path
    if (!isPathInDatasetBase(filePath)) {
      return res.status(400).json({ error: 'Path is outside dataset base path' });
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!filePath.toLowerCase().endsWith('.txt')) {
      return res.status(400).json({ error: 'Only .txt files can be previewed' });
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const LIMIT = 10000;
    const truncated = raw.length > LIMIT;
    const content = truncated ? raw.slice(0, LIMIT) : raw;

    res.json({ content, truncated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all instances
app.get('/api/instances', async (req, res) => {
  try {
    const instances = loadInstances();

    // Get PM2 status for each instance
    for (let instance of instances) {
      try {
        const { stdout } = await execPromise(`pm2 jlist`);
        const pm2List = JSON.parse(stdout);
        const pm2Process = pm2List.find(p => p.name === instance.name);

        if (pm2Process) {
          instance.status = pm2Process.pm2_env.status;
          instance.pid = pm2Process.pid;
          instance.uptime = pm2Process.pm2_env.pm_uptime;
          instance.restarts = pm2Process.pm2_env.restart_time;

          // Check service health if PM2 process is online
          if (instance.status === 'online') {
            const healthCheck = await checkServiceHealth(instance.port);
            instance.serviceHealth = healthCheck.healthy ? 'healthy' : 'unhealthy';
            instance.healthDetails = healthCheck;
          } else {
            instance.serviceHealth = 'n/a';
            instance.healthDetails = null;
          }
        } else {
          instance.status = 'stopped';
          instance.pid = null;
          instance.serviceHealth = 'n/a';
          instance.healthDetails = null;
        }
      } catch (err) {
        instance.status = 'unknown';
        instance.serviceHealth = 'unknown';
        instance.healthDetails = { error: err.message };
      }
    }

    saveInstances(instances);
    res.json(instances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new instance
app.post('/api/instances', (req, res) => {
  try {
    const { name, port, datasetPath, threshold, debug, cvatSync, pentagonFormat, obbMode, classFile, autoSync } = req.body;

    // Validation
    if (!name || !port || !datasetPath) {
      return res.status(400).json({ error: 'Name, port, and datasetPath are required' });
    }

    if (!validateInstanceNameFormat(name)) {
      return res.status(400).json({ error: 'Name must use only letters, numbers, hyphens, or underscores' });
    }

    if (!validatePort(port)) {
      return res.status(400).json({
        error: `Port must be within range ${CONFIG.portRange.start}-${CONFIG.portRange.end}`
      });
    }

    const instances = loadInstances();

    if (isNameInUse(instances, name)) {
      return res.status(400).json({ error: 'Instance name already exists' });
    }

    if (isPortInUse(instances, port)) {
      return res.status(400).json({ error: 'Port already in use' });
    }

    const newInstance = {
      name,
      port,
      datasetPath,
      threshold: threshold !== undefined ? threshold : CONFIG.defaultIouThreshold,
      debug: debug !== undefined ? debug : CONFIG.defaultDebug,
      cvatSync: CONFIG.cvat.enabled && cvatSync !== undefined ? cvatSync : false,
      pentagonFormat: pentagonFormat || false,
      obbMode: obbMode || 'rectangle',
      classFile: classFile || null,
      autoSync: autoSync !== undefined ? autoSync : true,
      status: 'stopped',
      createdAt: new Date().toISOString()
    };

    instances.push(newInstance);
    saveInstances(instances);

    res.status(201).json(newInstance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update instance
app.put('/api/instances/:name', (req, res) => {
  try {
    const { name } = req.params;
    const { port, datasetPath, threshold, debug, cvatSync, pentagonFormat, obbMode, classFile, autoSync } = req.body;

    const instances = loadInstances();
    const index = instances.findIndex(i => i.name === name);

    if (index === -1) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Check if instance is running
    if (instances[index].status === 'online') {
      return res.status(400).json({ error: 'Cannot update running instance. Stop it first.' });
    }

    // Validate port if changed
    if (port !== undefined) {
      if (!validatePort(port)) {
        return res.status(400).json({
          error: `Port must be within range ${CONFIG.portRange.start}-${CONFIG.portRange.end}`
        });
      }
      if (port !== instances[index].port && isPortInUse(instances, port, name)) {
        return res.status(400).json({ error: 'Port already in use' });
      }
      instances[index].port = port;
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
    res.json(instances[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OBB format helper functions
function detectLabelFormat(labelLine) {
  const parts = labelLine.trim().split(/\s+/);
  // OBB format: class_id x1 y1 x2 y2 x3 y3 x4 y4 (9 values)
  // Legacy pentagon format: class_id x1 y1 x2 y2 x3 y3 x4 y4 x5 y5 (11 values)
  // Bounding box format: class_id x_center y_center width height (5 values)
  if (parts.length === 9) return 'obb';
  if (parts.length === 11) return 'pentagon';
  if (parts.length === 5) return 'bbox';
  return 'unknown';
}

function orderPointsClockwiseFromTopLeft(points) {
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;

  const withAngle = points.map(p => ({
    x: p.x,
    y: p.y,
    angle: Math.atan2(p.y - cy, p.x - cx)
  }));

  // Sort by angle and enforce clockwise order in image coordinates (y-down).
  withAngle.sort((a, b) => a.angle - b.angle);
  let ordered = withAngle.map(p => ({ x: p.x, y: p.y }));
  if (signedArea(ordered) < 0) {
    ordered = ordered.reverse();
  }

  // Rotate so the first point is top-left (min y, then min x)
  let startIndex = 0;
  for (let i = 1; i < ordered.length; i++) {
    if (
      ordered[i].y < ordered[startIndex].y ||
      (ordered[i].y === ordered[startIndex].y && ordered[i].x < ordered[startIndex].x)
    ) {
      startIndex = i;
    }
  }

  const rotated = [];
  for (let i = 0; i < ordered.length; i++) {
    const idx = (startIndex + i) % ordered.length;
    rotated.push({ x: ordered[idx].x, y: ordered[idx].y });
  }

  return rotated;
}

function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    sum += (p1.x * p2.y) - (p2.x * p1.y);
  }
  return sum / 2;
}

function formatObbLine(classId, points) {
  const coords = points.map(p => `${p.x} ${p.y}`).join(' ');
  return `${classId} ${coords}`;
}

function convertBBoxToObb(classId, xCenter, yCenter, width, height) {
  const points = [
    { x: xCenter - width / 2, y: yCenter - height / 2 }, // top-left
    { x: xCenter + width / 2, y: yCenter - height / 2 }, // top-right
    { x: xCenter + width / 2, y: yCenter + height / 2 }, // bottom-right
    { x: xCenter - width / 2, y: yCenter + height / 2 }  // bottom-left
  ];

  const ordered = orderPointsClockwiseFromTopLeft(points);
  return formatObbLine(classId, ordered);
}

function convertLegacyPentagonToObb(classId, coords) {
  const points = [];
  for (let i = 0; i < 8; i += 2) {
    points.push({ x: coords[i], y: coords[i + 1] });
  }
  const ordered = orderPointsClockwiseFromTopLeft(points);
  return formatObbLine(classId, ordered);
}

function convertObbLineToOrderedObb(classId, coords) {
  const points = [];
  for (let i = 0; i < 8; i += 2) {
    points.push({ x: coords[i], y: coords[i + 1] });
  }
  const ordered = orderPointsClockwiseFromTopLeft(points);
  return formatObbLine(classId, ordered);
}

async function convertDatasetToPentagonFormat(datasetPath) {
  const labelsDir = path.join(datasetPath, 'labels');

  if (!fs.existsSync(labelsDir)) {
    throw new Error('Labels directory not found');
  }

  const labelFiles = fs.readdirSync(labelsDir).filter(f => f.endsWith('.txt'));
  let convertedCount = 0;
  let alreadyPentagonCount = 0;
  let errorCount = 0;

  for (const labelFile of labelFiles) {
    const labelPath = path.join(labelsDir, labelFile);

    try {
      const content = fs.readFileSync(labelPath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());

      if (lines.length === 0) continue;

      // Check if already in OBB format
      const firstLine = lines[0];
      const detected = detectLabelFormat(firstLine);
      if (detected === 'obb') {
        alreadyPentagonCount++;
        continue;
      }

      // Convert each line to OBB format
      const convertedLines = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        const detectedLine = detectLabelFormat(line);

        if (detectedLine === 'bbox') {
          const [classId, xCenter, yCenter, width, height] = parts.map(parseFloat);
          return convertBBoxToObb(classId, xCenter, yCenter, width, height);
        }

        if (detectedLine === 'pentagon') {
          const numbers = parts.map(parseFloat);
          const classId = numbers[0];
          const coords = numbers.slice(1, 9);
          return convertLegacyPentagonToObb(classId, coords);
        }

        if (detectedLine === 'obb') {
          const numbers = parts.map(parseFloat);
          const classId = numbers[0];
          const coords = numbers.slice(1, 9);
          return convertObbLineToOrderedObb(classId, coords);
        }

        throw new Error(`Invalid format in ${labelFile}: expected 5, 9, or 11 values, got ${parts.length}`);
      });

      // Overwrite the file
      fs.writeFileSync(labelPath, convertedLines.join('\n') + '\n', 'utf8');
      convertedCount++;
    } catch (err) {
      console.error(`Error converting ${labelFile}:`, err.message);
      errorCount++;
    }
  }

  return { convertedCount, alreadyPentagonCount, errorCount, totalFiles: labelFiles.length };
}

async function checkDatasetFormat(datasetPath) {
  const labelsDir = path.join(datasetPath, 'labels');

  if (!fs.existsSync(labelsDir)) {
    return { format: 'unknown', reason: 'Labels directory not found' };
  }

  const labelFiles = fs.readdirSync(labelsDir).filter(f => f.endsWith('.txt'));

  if (labelFiles.length === 0) {
    return { format: 'unknown', reason: 'No label files found' };
  }

  // Check first non-empty label file
  for (const labelFile of labelFiles.slice(0, 10)) { // Check up to 10 files
    const labelPath = path.join(labelsDir, labelFile);
    const content = fs.readFileSync(labelPath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());

    if (lines.length > 0) {
      const firstLine = lines[0];
      const detected = detectLabelFormat(firstLine);
      if (detected === 'obb') {
        return { format: 'obb', fileName: labelFile };
      }
      if (detected === 'pentagon') {
        return { format: 'pentagon', fileName: labelFile };
      }
      if (detected === 'bbox') {
        return { format: 'bbox', fileName: labelFile };
      }
      return { format: 'unknown', reason: 'Unsupported label format detected' };
    }
  }

  return { format: 'unknown', reason: 'All label files are empty' };
}

// Convert instance to OBB format
app.post('/api/instances/:name/convert-pentagon', async (req, res) => {
  try {
    const { name } = req.params;
    const instances = loadInstances();
    const index = instances.findIndex(i => i.name === name);

    if (index === -1) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const instance = instances[index];
    const datasetPath = path.resolve(instance.datasetPath);

    // Check if dataset exists
    if (!fs.existsSync(datasetPath)) {
      return res.status(400).json({ error: 'Dataset path does not exist' });
    }

    // Check current format
    const formatCheck = await checkDatasetFormat(datasetPath);

    if (formatCheck.format === 'obb') {
      // Already in OBB format, just update the flag
      instances[index].pentagonFormat = true;
      saveInstances(instances);
      return res.json({
        message: 'Dataset is already in OBB format',
        alreadyConverted: true,
        formatCheck
      });
    }

    if (formatCheck.format === 'unknown') {
      return res.status(400).json({
        error: 'Could not determine dataset format',
        reason: formatCheck.reason
      });
    }

    // Convert the dataset
    const result = await convertDatasetToPentagonFormat(datasetPath);

    // Update instance flag
    instances[index].pentagonFormat = true;
    saveInstances(instances);

    res.json({
      message: 'Dataset converted to OBB format successfully',
      ...result,
      formatCheck
    });
  } catch (err) {
    console.error('Error converting to OBB format:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check dataset format
app.get('/api/instances/:name/check-format', async (req, res) => {
  try {
    const { name } = req.params;
    const instances = loadInstances();
    const instance = instances.find(i => i.name === name);

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const datasetPath = path.resolve(instance.datasetPath);

    if (!fs.existsSync(datasetPath)) {
      return res.status(400).json({ error: 'Dataset path does not exist' });
    }

    const formatCheck = await checkDatasetFormat(datasetPath);
    res.json(formatCheck);
  } catch (err) {
    console.error('Error checking format:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete instance
app.delete('/api/instances/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const instances = loadInstances();
    const index = instances.findIndex(i => i.name === name);

    if (index === -1) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Stop if running
    if (instances[index].status === 'online') {
      await execPromise(`pm2 delete ${name}`);
    }

    instances.splice(index, 1);
    saveInstances(instances);

    res.json({ message: 'Instance deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start instance
app.post('/api/instances/:name/start', async (req, res) => {
  try {
    const { name } = req.params;
    const instances = loadInstances();
    const instance = instances.find(i => i.name === name);

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Delete any existing PM2 process with the same name to ensure clean start
    try {
      await execPromise(`pm2 delete ${name}`);
    } catch (err) {
      // Ignore error if process doesn't exist
    }

    // Build command
    const scriptPath = path.join(__dirname, 'start_fiftyone.py');
    const args = [
      instance.port,
      instance.datasetPath,
      '--iou-threshold', instance.threshold
    ];

    if (instance.debug) {
      args.push('--debug');
    }

    if (instance.classFile) {
      args.push('--class-file', instance.classFile);
    }

    const command = `/opt/venv/bin/python ${scriptPath} ${args.join(' ')}`;

    // Generate unique database name for this instance
    const datasetName = path.basename(instance.datasetPath);
    const dbName = `${datasetName}_${instance.port}`;

    // Get MongoDB URI from environment
    const mongodbUri = process.env.FIFTYONE_DATABASE_URI || 'mongodb://mongodb:27017';

    // Set up FiftyOne plugins directory
    const pluginsDir = path.join(__dirname, 'fiftyone_plugins');

    // Start with PM2, passing FiftyOne MongoDB configuration as environment variables
    // Build environment variables
    const envVars = {
      FIFTYONE_DATABASE_URI: mongodbUri,
      FIFTYONE_DATABASE_NAME: dbName,
      FIFTYONE_PLUGINS_DIR: pluginsDir,
      MANAGER_PORT: CONFIG.managerPort,
      PUBLIC_ADDRESS: CONFIG.publicAddress
    };

    // Add CVAT configuration if sync is enabled and CVAT is globally enabled
    if (CONFIG.cvat.enabled && instance.cvatSync) {
      if (CONFIG.cvat.url) envVars.FIFTYONE_CVAT_URL = CONFIG.cvat.url;
      if (CONFIG.cvat.username) envVars.FIFTYONE_CVAT_USERNAME = CONFIG.cvat.username;
      if (CONFIG.cvat.password) envVars.FIFTYONE_CVAT_PASSWORD = CONFIG.cvat.password;
      if (CONFIG.cvat.email) envVars.FIFTYONE_CVAT_EMAIL = CONFIG.cvat.email;
    }

    // Build environment variable string
    const envString = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    // These MUST be set before FiftyOne is imported (per official docs)
    const fullCommand = `${envString} pm2 start "${command}" --name ${name} --interpreter none --update-env`;
    await execPromise(fullCommand);

    res.json({ message: 'Instance started successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop instance
app.post('/api/instances/:name/stop', async (req, res) => {
  try {
    const { name } = req.params;
    const instances = loadInstances();
    const instance = instances.find(i => i.name === name);

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    await execPromise(`pm2 delete ${name}`);

    res.json({ message: 'Instance stopped successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restart instance
app.post('/api/instances/:name/restart', async (req, res) => {
  try {
    const { name } = req.params;
    const instances = loadInstances();
    const instance = instances.find(i => i.name === name);

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    await execPromise(`pm2 restart ${name}`);

    res.json({ message: 'Instance restarted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Label Editor API - Load image and label data
app.get('/api/label-editor/load', async (req, res) => {
  try {
    const { image, label, basePath, relativeImage, relativeLabel } = req.query;

    // Support both absolute and relative paths
    let imagePath = image;
    let labelPath = label;

    if (basePath) {
      if (relativeImage) imagePath = path.join(basePath, relativeImage);
      if (relativeLabel) labelPath = path.join(basePath, relativeLabel);
    }

    if (!imagePath || !labelPath) {
      return res.status(400).json({ error: 'Missing image or label path' });
    }

    // Verify paths exist
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const imageExt = path.extname(imagePath).toLowerCase();
    const mimeType = imageExt === '.png' ? 'image/png' : 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    // Read label file (create empty if doesn't exist)
    let labelContent = '';
    if (fs.existsSync(labelPath)) {
      labelContent = fs.readFileSync(labelPath, 'utf-8');
    }

    res.json({
      filename: path.basename(imagePath),
      imagePath: imagePath,
      labelPath: labelPath,
      relativeImage: relativeImage || imagePath,
      relativeLabel: relativeLabel || labelPath,
      basePath: basePath || '',
      imageDataUrl: imageDataUrl,
      labelContent: labelContent
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Label Editor API - Load only label data (optimized - no image base64 encoding)
app.get('/api/label-editor/load-label', async (req, res) => {
  try {
    const { label, basePath, relativeLabel } = req.query;

    // Support both absolute and relative paths
    let labelPath = label;

    if (basePath && relativeLabel) {
      labelPath = path.join(basePath, relativeLabel);
    }

    if (!labelPath) {
      return res.status(400).json({ error: 'Missing label path' });
    }

    // Read label file (return empty if doesn't exist)
    let labelContent = '';
    if (fs.existsSync(labelPath)) {
      labelContent = fs.readFileSync(labelPath, 'utf-8');
    }

    res.json({
      labelPath: labelPath,
      labelContent: labelContent
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Label Editor API - Save label data
app.post('/api/label-editor/save', async (req, res) => {
  try {
    const { labelPath, content, basePath, relativeLabelPath } = req.body;

    // Support both absolute and relative paths
    let fullLabelPath = labelPath;
    if (basePath && relativeLabelPath) {
      fullLabelPath = path.join(basePath, relativeLabelPath);
    }

    if (!fullLabelPath) {
      return res.status(400).json({ error: 'Missing label path' });
    }

    // Ensure directory exists
    const labelDir = path.dirname(fullLabelPath);
    if (!fs.existsSync(labelDir)) {
      fs.mkdirSync(labelDir, { recursive: true });
    }

    // Write label file
    fs.writeFileSync(fullLabelPath, content || '', 'utf-8');

    const instance = findInstanceForLabel({ basePath, fullLabelPath });
    if (instance && instance.autoSync) {
      let relativePath = relativeLabelPath
        ? relativeLabelPath.replace(/\\/g, '/')
        : path.relative(instance.datasetPath, fullLabelPath).replace(/\\/g, '/');
      if (relativePath && !relativePath.startsWith('labels/') && fullLabelPath) {
        relativePath = path.relative(instance.datasetPath, fullLabelPath).replace(/\\/g, '/');
      }
      const imagePath = resolveImagePath(instance, relativePath, fullLabelPath);
      if (imagePath) {
        triggerLabelSync(instance, imagePath, fullLabelPath);
      } else {
        console.warn('Label sync skipped: image path not found for', fullLabelPath);
      }
    }

    res.json({ success: true, message: 'Labels saved successfully' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/label-editor/last-image', (req, res) => {
  try {
    const { basePath, imagePath } = req.body;
    if (!basePath || !imagePath) {
      return res.status(400).json({ error: 'Missing basePath or imagePath' });
    }

    const instances = loadInstances();
    const fullImagePath = path.resolve(path.join(basePath, imagePath));
    const instance = instances.find(i => {
      const datasetRoot = path.resolve(i.datasetPath);
      return fullImagePath.startsWith(`${datasetRoot}${path.sep}`) || fullImagePath === datasetRoot;
    });
    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    instance.lastImagePath = imagePath;
    instance.updatedAt = new Date().toISOString();
    saveInstances(instances);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/label-editor/last-image', (req, res) => {
  try {
    const { basePath, folder } = req.query;
    if (!basePath) {
      return res.status(400).json({ error: 'Missing basePath' });
    }

    const instances = loadInstances();
    let instance = null;
    const normalizedBase = path.resolve(basePath);

    if (folder) {
      const normalizedFolder = folder.replace(/\\/g, '/').replace(/\/+$/, '');
      const datasetSuffix = normalizedFolder.replace(/\/images$/, '').replace(/^images$/, '');
      const datasetRoot = datasetSuffix ? path.resolve(path.join(basePath, datasetSuffix)) : normalizedBase;
      instance = instances.find(i => path.resolve(i.datasetPath) === datasetRoot) || null;
    }

    if (!instance) {
      instance = instances.find(i => path.resolve(i.datasetPath) === normalizedBase) || null;
    }

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    res.json({ lastImagePath: instance.lastImagePath || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/instances/last-image', (req, res) => {
  try {
    const { datasetPath } = req.query;
    if (!datasetPath) {
      return res.status(400).json({ error: 'Missing datasetPath' });
    }
    const instances = loadInstances();
    const normalizedPath = path.resolve(datasetPath);
    const instance = instances.find(i => path.resolve(i.datasetPath) === normalizedPath);
    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }
    res.json({ lastImagePath: instance.lastImagePath || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get label metadata for images (for filtering)
app.post('/api/label-editor/get-metadata', async (req, res) => {
  try {
    const { basePath, images } = req.body;

    if (!basePath || !images || !Array.isArray(images)) {
      return res.status(400).json({ error: 'Missing basePath or images array' });
    }

    const metadata = {};

    for (const imagePath of images) {
      try {
        // Convert image path to label path
        const labelPath = imagePath.replace('images/', 'labels/').replace(/\.(jpg|jpeg|png|bmp|gif)$/i, '.txt');
        const fullLabelPath = path.join(basePath, labelPath);

        // Read label file
        let labelContent = '';
        if (fs.existsSync(fullLabelPath)) {
          labelContent = fs.readFileSync(fullLabelPath, 'utf-8');
        }

        // Parse annotations
        const lines = labelContent.trim().split('\n').filter(line => line.trim());
        const annotations = [];

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const classId = parseInt(parts[0]);
            if (!isNaN(classId)) {
              annotations.push(classId);
            }
          }
        }

        // Extract unique classes
        const classes = [...new Set(annotations)];

        metadata[imagePath] = {
          classes: classes,
          count: annotations.length
        };
      } catch (err) {
        // If error reading this image's labels, set empty metadata
        metadata[imagePath] = {
          classes: [],
          count: 0
        };
      }
    }

    res.json({ metadata });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Load class names for label editor based on instance dataset path
app.get('/api/label-editor/classes', async (req, res) => {
  try {
    const { basePath } = req.query;
    const defaultClasses = ['one', 'two', 'three', 'four', 'five', 'six', 'invalid'];

    if (!basePath) {
      return res.json({ classes: defaultClasses, source: 'default' });
    }

    const instances = loadInstances();
    const normalizedBase = path.resolve(basePath);
    const instance = instances.find(i => path.resolve(i.datasetPath) === normalizedBase);

    if (!instance || !instance.classFile) {
      return res.json({ classes: defaultClasses, source: 'default' });
    }

    if (!fs.existsSync(instance.classFile)) {
      return res.json({ classes: defaultClasses, source: 'default' });
    }

    const content = fs.readFileSync(instance.classFile, 'utf-8');
    const classes = content
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (classes.length === 0) {
      return res.json({ classes: defaultClasses, source: 'default' });
    }

    return res.json({ classes, source: 'classFile', classFile: instance.classFile });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Filter images based on criteria
app.post('/api/label-editor/filter-images', async (req, res) => {
  try {
    const { basePath, images, filters } = req.body;

    if (!basePath || !images || !Array.isArray(images)) {
      return res.status(400).json({ error: 'Missing basePath or images array' });
    }

    const { nameFilter, selectedClasses, minLabels, maxLabels, classMode, classLogic } = filters || {};
    const resolvedClassMode = classMode || 'any';
    const resolvedClassLogic = classLogic || 'any';

    const filteredImages = [];

    for (const imagePath of images) {
      let passFilter = true;

      // Filter by name
      if (nameFilter && nameFilter.trim()) {
        if (!imagePath.toLowerCase().includes(nameFilter.toLowerCase().trim())) {
          passFilter = false;
        }
      }

      // Filter by label metadata (if class or count filters are active)
      const max = maxLabels !== undefined && maxLabels !== null ? maxLabels : Infinity;
      if (passFilter && (selectedClasses?.length > 0 || minLabels > 0 || max < Infinity || resolvedClassMode !== 'any')) {
        try {
          // Convert image path to label path
          const labelPath = imagePath.replace('images/', 'labels/').replace(/\.(jpg|jpeg|png|bmp|gif)$/i, '.txt');
          const fullLabelPath = path.join(basePath, labelPath);

          // Read label file
          let labelContent = '';
          if (fs.existsSync(fullLabelPath)) {
            labelContent = fs.readFileSync(fullLabelPath, 'utf-8');
          }

          // Parse annotations
          const lines = labelContent.trim().split('\n').filter(line => line.trim());
          const annotations = [];

          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5) {
              const classId = parseInt(parts[0]);
              if (!isNaN(classId)) {
                annotations.push(classId);
              }
            }
          }

          const count = annotations.length;
          const classes = [...new Set(annotations)];

          // Check label count
          const min = minLabels || 0;
          if (count < min || count > max) {
            passFilter = false;
          }

          if (passFilter) {
            if (resolvedClassMode === 'none') {
              if (count !== 0) {
                passFilter = false;
              }
            } else if (resolvedClassMode === 'only') {
              if (!selectedClasses || selectedClasses.length === 0) {
                passFilter = false;
              } else {
                const hasOnlySelected = classes.every(cls => selectedClasses.includes(cls));
                if (!hasOnlySelected) {
                  passFilter = false;
                } else if (resolvedClassLogic === 'all') {
                  const hasAllClasses = selectedClasses.every(cls => classes.includes(cls));
                  if (!hasAllClasses) {
                    passFilter = false;
                  }
                } else {
                  const hasAnyClass = selectedClasses.some(cls => classes.includes(cls));
                  if (!hasAnyClass) {
                    passFilter = false;
                  }
                }
              }
            } else if (selectedClasses && selectedClasses.length > 0) {
              if (resolvedClassLogic === 'all') {
                const hasAllClasses = selectedClasses.every(cls => classes.includes(cls));
                if (!hasAllClasses) {
                  passFilter = false;
                }
              } else {
                const hasAnyClass = selectedClasses.some(cls => classes.includes(cls));
                if (!hasAnyClass) {
                  passFilter = false;
                }
              }
            }
          }
        } catch (err) {
          // If error reading labels, assume no labels
          const count = 0;
          const min = minLabels || 0;

          if (count < min || count > max) {
            passFilter = false;
          }

          if (passFilter) {
            if (resolvedClassMode === 'none') {
              // Keep passFilter true
            } else if (resolvedClassMode === 'only') {
              passFilter = false;
            } else if (selectedClasses && selectedClasses.length > 0) {
              passFilter = false; // No labels means no classes
            }
          }
        }
      }

      if (passFilter) {
        filteredImages.push(imagePath);
      }
    }

    res.json({
      filteredImages,
      totalCount: images.length,
      filteredCount: filteredImages.length
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all images in a folder
app.get('/api/label-editor/list-folder', async (req, res) => {
  try {
    const { basePath, folder } = req.query;

    if (!basePath || !folder) {
      return res.status(400).json({ error: 'Missing basePath or folder parameter' });
    }

    const fullPath = path.join(basePath, folder);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Read all files in directory recursively
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
    const images = [];
    const imageMeta = {};

    function scanDirectory(dir, baseDir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullItemPath = path.join(dir, item);
        const stat = fs.statSync(fullItemPath);

        if (stat.isDirectory()) {
          scanDirectory(fullItemPath, baseDir);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (imageExtensions.includes(ext)) {
            // Get relative path from folder root
            const relativePath = path.relative(baseDir, fullItemPath);
            const imagePath = path.join(folder, relativePath).replace(/\\/g, '/');
            images.push(imagePath);
            imageMeta[imagePath] = {
              ctimeMs: stat.birthtimeMs || stat.ctimeMs,
              mtimeMs: stat.mtimeMs
            };
          }
        }
      }
    }

    scanDirectory(fullPath, fullPath);
    images.sort(); // Sort alphabetically

    res.json({ images, count: images.length, imageMeta });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve image files
app.get('/api/image', (req, res) => {
  try {
    const { basePath, relativePath, fullPath } = req.query;

    let imagePath = fullPath;
    if (basePath && relativePath) {
      imagePath = path.join(basePath, relativePath);
    }

    if (!imagePath || !fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.sendFile(imagePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get logs
app.get('/api/instances/:name/logs', async (req, res) => {
  try {
    const { name } = req.params;
    const linesParam = req.query.lines;
    const requestedAllLines = linesParam && String(linesParam).toLowerCase() === 'all';
    let lineLimit = 100;
    if (requestedAllLines) {
      lineLimit = null;
    } else if (linesParam !== undefined) {
      const parsed = parseInt(linesParam, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        lineLimit = parsed;
      }
    }

    const instances = loadInstances();
    const instance = instances.find(i => i.name === name);

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Read PM2 log files directly from ~/.pm2/logs/
    // In Docker, this is /root/.pm2/logs (persisted via volume)
    // PM2 converts underscores to hyphens in log filenames
    const homeDir = require('os').homedir();
    const pm2LogDir = path.join(homeDir, '.pm2', 'logs');
    const pm2LogName = name.replace(/_/g, '-');
    const outLogPath = path.join(pm2LogDir, `${pm2LogName}-out.log`);

    let stdout = '';
    const debugInfo = {
      linesRequested: lineLimit || 'all',
      outLogExists: fs.existsSync(outLogPath),
      outLogPath: outLogPath,
      errLogSkipped: true
    };

    // Read stdout log file
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

    // Log debug info to server console
    console.log('Log files debug:', debugInfo);

    res.json({
      stdout: stdout || '',
      stderr: '',
      _debug: debugInfo
    });
  } catch (err) {
    res.json({
      stdout: '',
      stderr: err.message
    });
  }
});

// Start server
app.listen(CONFIG.managerPort, '0.0.0.0', () => {
  console.log(`FiftyOne Manager running on port ${CONFIG.managerPort}`);
  console.log(`Dataset base path: ${CONFIG.datasetBasePath}`);
  console.log(`Port range: ${CONFIG.portRange.start}-${CONFIG.portRange.end}`);
});
