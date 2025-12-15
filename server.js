require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
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
    const { name, port, datasetPath, threshold, debug, cvatSync, classFile } = req.body;

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
      cvatSync: cvatSync !== undefined ? cvatSync : false,
      classFile: classFile || null,
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
    const { port, datasetPath, threshold, debug, cvatSync, classFile } = req.body;

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
    if (cvatSync !== undefined) instances[index].cvatSync = cvatSync;
    if (classFile !== undefined) instances[index].classFile = classFile || null;
    instances[index].updatedAt = new Date().toISOString();

    saveInstances(instances);
    res.json(instances[index]);
  } catch (err) {
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

    const command = `python3 ${scriptPath} ${args.join(' ')}`;

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

    // Add CVAT configuration if sync is enabled
    if (instance.cvatSync) {
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

    res.json({ success: true, message: 'Labels saved successfully' });

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
