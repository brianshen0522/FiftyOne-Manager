const API_BASE = window.location.origin;
        let config = {};
        let editingInstance = null;
        let latestInstances = [];
        let datasets = [];
        let datasetsError = null;
        let logsIntervalId = null;
        let activeLogsInstance = null;
        let followLogs = true;
        const LOG_POLL_MS = 2000;
        const SCROLL_THRESHOLD = 40;
        let selectedInstances = new Set();
        const lastHealthByInstance = new Map();

        function showProcessing(text = 'Processing...') {
            const overlay = document.getElementById('processingOverlay');
            const label = document.getElementById('processingText');
            if (!overlay || !label) return;
            label.textContent = text;
            overlay.style.display = 'flex';
        }

        function hideProcessing() {
            const overlay = document.getElementById('processingOverlay');
            if (!overlay) return;
            overlay.style.display = 'none';
        }

        function updateObbModeOptions() {
            const obbModeSelect = document.getElementById('obbMode');
            if (!obbModeSelect) return;

            const allModes = {
                'rectangle': 'Rectangle (Drag)',
                '4point': '4-Point Polygon'
            };

            const availableModes = config.availableObbModes || ['rectangle', '4point'];

            // Clear existing options
            obbModeSelect.innerHTML = '';

            // Add only available modes
            availableModes.forEach(mode => {
                if (allModes[mode]) {
                    const option = document.createElement('option');
                    option.value = mode;
                    option.textContent = allModes[mode];
                    obbModeSelect.appendChild(option);
                }
            });

            // If no valid modes, add rectangle as fallback
            if (obbModeSelect.options.length === 0) {
                const option = document.createElement('option');
                option.value = 'rectangle';
                option.textContent = allModes['rectangle'];
                obbModeSelect.appendChild(option);
            }
        }

        async function loadConfig() {
            try {
                const response = await fetch(`${API_BASE}/api/config`);
                config = await response.json();
                document.getElementById('basePath').textContent = config.datasetBasePath;
                document.getElementById('portRange').textContent = `${config.portRange.start}-${config.portRange.end}`;

                // Show/hide CVAT sync option based on config
                const cvatSyncGroup = document.getElementById('cvatSyncGroup');
                if (cvatSyncGroup) {
                    cvatSyncGroup.style.display = config.cvat?.enabled ? 'block' : 'none';
                }

                // Filter OBB mode dropdown based on available modes
                updateObbModeOptions();

                await loadDatasets();
            } catch (err) {
                console.error('Failed to load config:', err);
            }
        }

        async function loadDatasets() {
            datasetsError = null;
            try {
                const response = await fetch(`${API_BASE}/api/datasets`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to load datasets');
                }
                if (!Array.isArray(data)) {
                    throw new Error('Datasets response was not an array');
                }

                datasets = data;
            } catch (err) {
                datasets = [];
                datasetsError = err.message || 'Failed to load datasets';
                console.error('Failed to load datasets:', err);
            }
            populateDatasetOptions();
        }

        async function loadClassFiles(datasetFullPath) {
            const basePath = config.datasetBasePath || '/data/datasets';

            try {
                // Find nearest parent folder that contains class files
                const response = await fetch(`${API_BASE}/api/find-class-path?path=${encodeURIComponent(datasetFullPath || basePath)}`);
                const data = await response.json();
                await navigateToClassPath(data.path || '');
            } catch (err) {
                console.error('Failed to load class files:', err);
                // Fallback to root
                await navigateToClassPath('');
            }
        }

        // Current navigation path
        let currentPath = '';

        // Build tree structure from flat dataset list
        function buildDatasetTree() {
            const tree = { folders: new Set(), datasets: new Set() };

            if (!Array.isArray(datasets)) {
                return tree;
            }

            datasets.forEach(d => {
                const parts = d.name.split('/');

                // Add all intermediate folders
                for (let i = 0; i < parts.length; i++) {
                    const folderPath = parts.slice(0, i + 1).join('/');
                    const parentPath = i === 0 ? '' : parts.slice(0, i).join('/');

                    if (!tree[parentPath]) {
                        tree[parentPath] = { folders: new Set(), datasets: new Set() };
                    }

                    if (i === parts.length - 1) {
                        // This is a dataset
                        tree[parentPath].datasets.add({ name: parts[i], path: d.path });
                    } else {
                        // This is a folder
                        tree[parentPath].folders.add(parts[i]);
                    }
                }
            });

            return tree;
        }

        function populateDatasetOptions() {
            window.datasetTree = buildDatasetTree();
            navigateToPath('');
        }

        function navigateToPath(path, updatePathField = true) {
            currentPath = path;
            renderBreadcrumb(path);
            renderFolderList(path);

            // Compute target path once so we can reuse it without leaking scope errors
            const basePath = config.datasetBasePath || '/data/datasets';
            const fullPath = path ? `${basePath}/${path}` : basePath;

            // Auto-update dataset path only if requested (skip when editing existing instance)
            if (updatePathField) {
                document.getElementById('datasetPath').value = fullPath;

                // Auto-populate instance name from last folder name (only when adding new instance)
                const instanceNameField = document.getElementById('instanceName');
                if (instanceNameField && !editingInstance) {
                    if (path) {
                        const pathParts = path.split('/').filter(p => p);
                        if (pathParts.length > 0) {
                            const lastFolder = pathParts[pathParts.length - 1];
                            instanceNameField.value = lastFolder;
                            // Trigger validation
                            validateInstanceName();
                        }
                    } else {
                        // Clear instance name when at root
                        instanceNameField.value = '';
                        hideInstanceNameError();
                    }
                }

                // Only auto-navigate class file browser if no class file is currently selected
                const classFileInput = document.getElementById('classFile');
                if (!classFileInput || !classFileInput.value) {
                    loadClassFiles(fullPath || config.datasetBasePath);
                }
            }
        }

        function renderBreadcrumb(path) {
            const breadcrumb = document.getElementById('breadcrumb');
            if (!breadcrumb) return;

            const parts = path ? path.split('/') : [];
            let html = '<span class="crumb" onclick="navigateToPath(\'\')">📁 datasets</span>';

            if (parts.length > 0 && parts[0] !== '') {
                html += '<span class="crumb-sep">/</span>';
                parts.forEach((part, index) => {
                    const pathToHere = parts.slice(0, index + 1).join('/');
                    html += `<span class="crumb" onclick="navigateToPath('${pathToHere}')">${part}</span>`;
                    if (index < parts.length - 1) {
                        html += '<span class="crumb-sep">/</span>';
                    }
                });
            }

            // Add refresh button
            html += '<button type="button" class="btn-refresh" onclick="refreshAndStay()" title="Refresh folders">↻</button>';

            breadcrumb.innerHTML = html;
        }

        function renderFolderList(path) {
            const folderList = document.getElementById('folderList');
            if (!folderList || !window.datasetTree) return;

            const currentLevel = window.datasetTree[path] || { folders: new Set(), datasets: new Set() };
            let html = '';

            if (datasetsError) {
                folderList.innerHTML = `<div class="folder-item empty">Error loading datasets: ${datasetsError}</div>`;
                return;
            }

            // Show all folders (including those that are datasets)
            const allItems = new Map();

            // Add regular folders
            Array.from(currentLevel.folders).forEach(folder => {
                const folderPath = path ? `${path}/${folder}` : folder;
                allItems.set(folder, { name: folder, path: folderPath });
            });

            // Add datasets as folders too
            Array.from(currentLevel.datasets).forEach(dataset => {
                if (!allItems.has(dataset.name)) {
                    const folderPath = path ? `${path}/${dataset.name}` : dataset.name;
                    allItems.set(dataset.name, { name: dataset.name, path: folderPath });
                }
            });

            // Sort and render all items
            const sortedItems = Array.from(allItems.values()).sort((a, b) => a.name.localeCompare(b.name));

            sortedItems.forEach(item => {
                html += `
                    <div class="folder-item" onclick="navigateToPath('${item.path}')">
                        <div class="folder-name">${item.name}</div>
                    </div>
                `;
            });

            if (html === '') {
                html = '<div class="folder-item empty">No folders here</div>';
            }

            folderList.innerHTML = html;
        }

        async function refreshDatasetOptions() {
            await loadDatasets();
        }

        async function refreshAndStay() {
            const previousPath = currentPath;
            await loadDatasets();
            // Return to the same path after refresh
            navigateToPath(previousPath);
        }

        // Current class file navigation path
        let currentClassPath = '';

        async function navigateToClassPath(path) {
            currentClassPath = path;
            await renderClassBreadcrumb(path);
            await renderClassFolderList(path);
        }

        function renderClassBreadcrumb(path) {
            const breadcrumb = document.getElementById('classBreadcrumb');
            if (!breadcrumb) return;

            const parts = path ? path.split('/').filter(p => p) : [];
            let html = '<span class="crumb" onclick="navigateToClassPath(\'\')">📁 datasets</span>';

            if (parts.length > 0) {
                html += '<span class="crumb-sep">/</span>';
                parts.forEach((part, index) => {
                    const pathToHere = parts.slice(0, index + 1).join('/');
                    html += `<span class="crumb" onclick="navigateToClassPath('${pathToHere}')">${part}</span>`;
                    if (index < parts.length - 1) {
                        html += '<span class="crumb-sep">/</span>';
                    }
                });
            }

            // Add refresh button
            html += '<button type="button" class="btn-refresh" onclick="navigateToClassPath(currentClassPath)" title="Refresh folders">↻</button>';

            breadcrumb.innerHTML = html;
        }

        async function renderClassFolderList(path) {
            const folderList = document.getElementById('classFolderList');
            if (!folderList) return;

            try {
                // Build full path from base path
                const basePath = config.datasetBasePath || '/data/datasets';
                const fullPath = path ? `${basePath}/${path}` : basePath;

                const response = await fetch(`${API_BASE}/api/browse-path?path=${encodeURIComponent(fullPath)}&filterClassFiles=true`);
                const data = await response.json();

                let html = '';

                // Show folders first
                if (data.folders && data.folders.length > 0) {
                    data.folders.forEach(folder => {
                        const folderPath = path ? `${path}/${folder}` : folder;
                        html += `
                            <div class="folder-item" onclick="navigateToClassPath('${folderPath}')">
                                <div class="folder-name">${folder}</div>
                            </div>
                        `;
                    });
                }

                // Show .txt files containing "class"
                if (data.files && data.files.length > 0) {
                    data.files.forEach(file => {
                        if (file.toLowerCase().endsWith('.txt') && file.toLowerCase().includes('class')) {
                            const filePath = path ? `${path}/${file}` : file;
                            const absolutePath = path ? `${basePath}/${filePath}` : `${basePath}/${file}`;
                            html += `
                                <div class="folder-item file-item" onclick="selectClassFile('${absolutePath}')">
                                    <div class="folder-name file-name">${file}</div>
                                </div>
                            `;
                        }
                    });
                }

                if (html === '') {
                    html = '<div class="folder-item empty">No folders or class files here</div>';
                }

                folderList.innerHTML = html;
            } catch (err) {
                console.error('Failed to load path:', err);
                folderList.innerHTML = '<div class="folder-item empty">Error loading path</div>';
            }
        }

        function hideClassPreview() {
            const container = document.getElementById('classPreview');
            const body = document.getElementById('classPreviewBody');
            const meta = document.getElementById('classPreviewMeta');
            const note = document.getElementById('classPreviewNote');
            const error = document.getElementById('classPreviewError');
            if (!container || !body || !meta) return;
            container.style.display = 'none';
            body.textContent = 'Select a class file to preview';
            meta.textContent = '';
            if (note) note.style.display = 'none';
            if (error) error.style.display = 'none';
        }

        async function previewClassFile(path) {
            const container = document.getElementById('classPreview');
            const body = document.getElementById('classPreviewBody');
            const meta = document.getElementById('classPreviewMeta');
            const note = document.getElementById('classPreviewNote');
            const error = document.getElementById('classPreviewError');
            if (!container || !body || !meta) return;

            if (!path) {
                hideClassPreview();
                return;
            }

            container.style.display = 'block';
            body.textContent = 'Loading preview...';
            meta.textContent = '';
            if (note) note.style.display = 'none';
            if (error) {
                error.style.display = 'none';
                error.textContent = '';
            }

            try {
                const response = await fetch(`${API_BASE}/api/class-file?path=${encodeURIComponent(path)}`);
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to load class file');
                }

                const lines = (data.content || '')
                    .split(/\r?\n/)
                    .filter(line => line.trim() !== '');

                body.textContent = lines.length ? lines.join('\n') : 'File is empty';

                const lineCount = lines.length;
                meta.textContent = `${lineCount} line${lineCount === 1 ? '' : 's'}`;

                if (note) {
                    if (data.truncated) {
                        note.textContent = 'Preview truncated to the first 10,000 characters.';
                        note.style.display = 'block';
                    } else {
                        note.style.display = 'none';
                    }
                }
            } catch (err) {
                body.textContent = '';
                meta.textContent = '';
                if (error) {
                    error.textContent = err.message || 'Unable to preview file.';
                    error.style.display = 'block';
                }
            }
        }

        function selectClassFile(path) {
            document.getElementById('classFile').value = path;
            previewClassFile(path);
        }

        async function loadInstances() {
            try {
                const response = await fetch(`${API_BASE}/api/instances`);
                const instances = await response.json();
                latestInstances = instances;

                // Clean up selectedInstances - remove any instances that no longer exist
                const instanceNames = new Set(instances.map(i => i.name));
                for (const name of selectedInstances) {
                    if (!instanceNames.has(name)) {
                        selectedInstances.delete(name);
                    }
                }

                // Auto-open when service goes from down -> up
                instances.forEach(instance => {
                    const name = instance.name || '';
                    const health = (instance.serviceHealth || '').toLowerCase();
                    const prevHealth = lastHealthByInstance.get(name);
                    if (instance.status === 'online' && health === 'healthy' && prevHealth === 'unhealthy') {
                        openInstance(instance.port);
                    }
                    lastHealthByInstance.set(name, health || 'n/a');
                });

                for (const name of Array.from(lastHealthByInstance.keys())) {
                    if (!instanceNames.has(name)) {
                        lastHealthByInstance.delete(name);
                    }
                }

                renderInstances(instances);
                updateSelectionButtons();
            } catch (err) {
                console.error('Failed to load instances:', err);
            }
        }

        function statusMeta(instance) {
            const status = (instance.status || 'unknown').toLowerCase();
            if (status === 'online') return { cls: 'status-online', text: 'Running' };
            if (status === 'stopped') return { cls: 'status-stopped', text: 'Not running' };
            return { cls: 'status-unknown', text: 'Unknown' };
        }

        function healthMeta(instance) {
            const health = (instance.serviceHealth || 'n/a').toLowerCase();
            if (health === 'healthy') return { cls: 'health-healthy', text: 'Service OK' };
            if (health === 'unhealthy') return { cls: 'health-unhealthy', text: 'Service Down' };
            return { cls: 'health-na', text: 'N/A' };
        }

        function renderInstances(instances) {
            const container = document.getElementById('instancesContainer');
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');

            // Show/hide select all checkbox based on instance count
            if (selectAllCheckbox) {
                selectAllCheckbox.style.display = instances.length > 0 ? 'inline-block' : 'none';
            }

            if (!instances.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h2>No instances yet</h2>
                        <p>Click "Add Instance" to create your first FiftyOne instance</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = instances.map(instance => {
                const meta = statusMeta(instance);
                const health = healthMeta(instance);
                const hasError = instance.status && instance.status.toLowerCase() === 'error';
                const serviceDown = (instance.serviceHealth || '').toLowerCase() === 'unhealthy';

                return `
                <div class="instance-card">
                    <div class="instance-header">
                        <div class="instance-id">
                            <input type="checkbox"
                                   class="instance-select-checkbox"
                                   id="checkbox-${instance.name}"
                                   onchange="toggleInstanceSelection('${instance.name}')"
                                   ${selectedInstances.has(instance.name) ? 'checked' : ''}>
                            <span>${instance.name || 'Instance'}</span>
                        </div>
                        <div class="status-group">
                            <div class="status-pill ${hasError ? 'status-error' : meta.cls}">
                                <span class="dot"></span>
                                <span>${hasError ? 'Error' : meta.text}</span>
                            </div>
                            ${instance.status === 'online' ? `
                            <div class="status-pill ${health.cls}">
                                <span class="dot"></span>
                                <span>${health.text}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    ${hasError ? `<div class="status-message">Last error reported. Check logs for details.</div>` : ''}

                    <div class="instance-grid">
                        <div class="field">
                            <label>Name</label>
                            <input type="text" value="${instance.name || ''}" readonly>
                        </div>
                        <div class="field">
                            <label>Port</label>
                            <input type="text" value="${instance.port || ''}" readonly>
                        </div>
                        <div class="field" style="grid-column: span 2;">
                            <label>Dataset Dir</label>
                            <input type="text" value="${instance.datasetPath || ''}" readonly>
                        </div>
                    </div>
                    <div class="hint">Must be inside the base path defined in .env.</div>
                    <div class="instance-actions">
                        ${instance.status === 'online'
                            ? `<button class="btn secondary" onclick="restartInstance('${instance.name}')">Restart</button>
                               <button class="btn danger" onclick="stopInstance('${instance.name}')">Stop</button>
                               <button class="btn secondary" onclick="openInstance(${instance.port})" ${serviceDown ? 'disabled title="Service down"' : ''}>Open</button>
                               <button class="btn secondary" onclick="openLabelEditor('${encodeURIComponent(instance.datasetPath || '')}', '${encodeURIComponent(instance.lastImagePath || '')}', '${instance.obbMode || 'rectangle'}')" ${instance.datasetPath ? '' : 'disabled title="Dataset path required"'}>Open Editor</button>`
                            : `<button class="btn success" onclick="startInstance('${instance.name}')">Start</button>
                               <button class="btn ghost" onclick="editInstance('${instance.name}')">Edit</button>
                               <button class="btn danger" onclick="deleteInstance('${instance.name}')">Remove</button>
                               <button class="btn secondary" onclick="openLabelEditor('${encodeURIComponent(instance.datasetPath || '')}', '${encodeURIComponent(instance.lastImagePath || '')}', '${instance.obbMode || 'rectangle'}')" ${instance.datasetPath ? '' : 'disabled title="Dataset path required"'}>Open Editor</button>`
                        }
                        <button class="btn ghost" onclick="showLogs('${instance.name}')">Logs</button>
                    </div>
                </div>
                `;
            }).join('');
        }

        async function startInstance(name) {
            showProcessing(`Starting ${name}...`);
            try {
                const response = await fetch(`${API_BASE}/api/instances/${name}/start`, { method: 'POST' });
                if (!response.ok) {
                    const error = await response.json();
                    alert(`Failed to start instance: ${error.error}`);
                    return;
                }
                setTimeout(refreshInstances, 800);
            } catch (err) {
                alert(`Failed to start instance: ${err.message}`);
            } finally {
                hideProcessing();
            }
        }

        async function stopInstance(name) {
            showProcessing(`Stopping ${name}...`);
            try {
                const response = await fetch(`${API_BASE}/api/instances/${name}/stop`, { method: 'POST' });
                if (!response.ok) {
                    const error = await response.json();
                    alert(`Failed to stop instance: ${error.error}`);
                    return;
                }
                setTimeout(refreshInstances, 800);
            } catch (err) {
                alert(`Failed to stop instance: ${err.message}`);
            } finally {
                hideProcessing();
            }
        }

        async function restartInstance(name) {
            try {
                const response = await fetch(`${API_BASE}/api/instances/${name}/restart`, { method: 'POST' });
                if (!response.ok) {
                    const error = await response.json();
                    alert(`Failed to restart instance: ${error.error}`);
                    return;
                }
                setTimeout(refreshInstances, 800);
            } catch (err) {
                alert(`Failed to restart instance: ${err.message}`);
            }
        }

        function toggleInstanceSelection(name) {
            if (selectedInstances.has(name)) {
                selectedInstances.delete(name);
            } else {
                selectedInstances.add(name);
            }
            updateSelectionButtons();
        }

        function toggleSelectAll() {
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');
            if (!selectAllCheckbox) return;

            if (selectAllCheckbox.checked) {
                // Select all instances
                latestInstances.forEach(instance => {
                    selectedInstances.add(instance.name);
                });
            } else {
                // Deselect all instances
                selectedInstances.clear();
            }

            // Re-render to update individual checkboxes
            renderInstances(latestInstances);
            updateSelectionButtons();
        }

        function updateSelectionButtons() {
            const hasSelection = selectedInstances.size > 0;
            const startBtn = document.getElementById('startSelectedBtn');
            const stopBtn = document.getElementById('stopSelectedBtn');
            const removeBtn = document.getElementById('removeSelectedBtn');

            if (startBtn) {
                startBtn.disabled = !hasSelection;
                startBtn.title = hasSelection ? 'Start selected instances' : 'Select instances to start';
            }
            if (stopBtn) {
                stopBtn.disabled = !hasSelection;
                stopBtn.title = hasSelection ? 'Stop selected instances' : 'Select instances to stop';
            }

            // Check if any selected instances are running
            if (removeBtn) {
                const selectedArray = Array.from(selectedInstances);
                const hasRunningInstances = selectedArray.some(name => {
                    const instance = latestInstances.find(i => i.name === name);
                    return instance && instance.status === 'online';
                });

                if (!hasSelection) {
                    removeBtn.disabled = true;
                    removeBtn.title = 'Select instances to remove';
                } else if (hasRunningInstances) {
                    removeBtn.disabled = true;
                    removeBtn.title = 'Cannot remove running instances. Please stop them first.';
                } else {
                    removeBtn.disabled = false;
                    removeBtn.title = 'Remove selected instances';
                }
            }

            // Update select all checkbox state
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');
            if (selectAllCheckbox) {
                if (latestInstances.length > 0) {
                    const allSelected = latestInstances.every(instance => selectedInstances.has(instance.name));
                    const someSelected = selectedInstances.size > 0;
                    selectAllCheckbox.checked = allSelected;
                    selectAllCheckbox.indeterminate = someSelected && !allSelected;
                } else {
                    selectAllCheckbox.checked = false;
                    selectAllCheckbox.indeterminate = false;
                }
            }
        }

        async function startSelectedInstances() {
            if (selectedInstances.size === 0) return;
            const selected = Array.from(selectedInstances);
            for (const name of selected) {
                const instance = latestInstances.find(i => i.name === name);
                if (instance && instance.status !== 'online') {
                    await startInstance(name);
                }
            }
            refreshInstances();
        }

        async function stopSelectedInstances() {
            if (selectedInstances.size === 0) return;
            const selected = Array.from(selectedInstances);
            for (const name of selected) {
                const instance = latestInstances.find(i => i.name === name);
                if (instance && instance.status === 'online') {
                    await stopInstance(name);
                }
            }
            refreshInstances();
        }

        async function removeSelectedInstances() {
            if (selectedInstances.size === 0) return;

            const count = selectedInstances.size;
            if (!confirm(`Are you sure you want to delete ${count} instance(s)?`)) {
                return;
            }

            const selected = Array.from(selectedInstances);
            for (const name of selected) {
                await deleteInstance(name, true);
            }
            updateSelectionButtons();
            refreshInstances();
        }

        async function deleteInstance(name, skipConfirm = false) {
            if (!skipConfirm && !confirm(`Are you sure you want to delete instance "${name}"?`)) {
                return;
            }
            try {
                const response = await fetch(`${API_BASE}/api/instances/${name}`, { method: 'DELETE' });
                if (!response.ok) {
                    const error = await response.json();
                    alert(`Failed to delete instance: ${error.error}`);
                    return;
                }
                selectedInstances.delete(name);
                if (!skipConfirm) {
                    refreshInstances();
                }
            } catch (err) {
                alert(`Failed to delete instance: ${err.message}`);
            }
        }

        function openInstance(port) {
            window.open(`http://${window.location.hostname}:${port}`, '_blank');
        }

        async function openLabelEditor(encodedDatasetPath, encodedLastImagePath, obbMode = 'rectangle') {
            const datasetPath = decodeURIComponent(encodedDatasetPath || '');
            if (!datasetPath) {
                alert('Dataset path is missing.');
                return;
            }

            const rawBasePath = config.datasetBasePath || '/data/datasets';
            const basePath = rawBasePath.replace(/\/+$/, '');
            const matchesBase = datasetPath === basePath || datasetPath.startsWith(`${basePath}/`);
            if (!matchesBase) {
                alert('Dataset path must be inside the configured base path.');
                return;
            }

            const relativePath = datasetPath.slice(basePath.length).replace(/^\/+/, '');
            if (!relativePath) {
                alert('Dataset folder is required to open the label editor.');
                return;
            }

            const normalizedRelative = relativePath.replace(/\/+$/, '');
            const folderPath = normalizedRelative.endsWith('/images') || normalizedRelative === 'images'
                ? normalizedRelative
                : `${normalizedRelative}/images`;
            let lastImagePath = decodeURIComponent(encodedLastImagePath || '');
            try {
                const response = await fetch(`${API_BASE}/api/instances/last-image?datasetPath=${encodeURIComponent(datasetPath)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.lastImagePath) {
                        lastImagePath = data.lastImagePath;
                    }
                }
            } catch (err) {
                // Ignore fetch errors and fall back to cached data
            }
            const normalizedStart = normalizeStartImagePath(lastImagePath, folderPath);
            const startParam = normalizedStart ? `&start=${encodeURIComponent(normalizedStart)}` : '';
            const obbModeParam = `&obbMode=${encodeURIComponent(obbMode || 'rectangle')}`;
            const editorUrl = `${window.location.origin}/label-editor.html?base=${encodeURIComponent(basePath)}&folder=${encodeURIComponent(folderPath)}${startParam}${obbModeParam}`;
            window.open(editorUrl, '_blank');
        }

        function normalizeStartImagePath(lastImagePath, folderPath) {
            if (!lastImagePath) {
                return '';
            }
            if (lastImagePath.startsWith(`${folderPath}/`)) {
                return lastImagePath;
            }
            if (lastImagePath.startsWith('images/') && folderPath.endsWith('/images') && folderPath !== 'images') {
                const datasetPrefix = folderPath.replace(/\/images$/, '');
                return `${datasetPrefix}/${lastImagePath}`;
            }
            return lastImagePath;
        }

        function openLabelEditorMain() {
            window.open(`${window.location.origin}/label-editor-main.html`, '_blank');
        }

        function findSmallestAvailablePort() {
            const usedPorts = new Set(latestInstances.map(i => i.port));
            for (let port = config.portRange.start; port <= config.portRange.end; port++) {
                if (!usedPorts.has(port)) {
                    return port;
                }
            }
            return config.portRange.start; // Fallback to start if all ports are used
        }

        function populatePortOptions(excludeInstance = null) {
            const portSelect = document.getElementById('instancePort');
            if (!portSelect) {
                console.error('Port select element not found');
                return;
            }

            if (!config.portRange) {
                console.error('Config port range not loaded', config);
                return;
            }

            const usedPorts = new Set(
                latestInstances
                    .filter(i => i.name !== excludeInstance)
                    .map(i => i.port)
            );

            console.log('Populating port options:', {
                portRange: config.portRange,
                usedPorts: Array.from(usedPorts),
                latestInstances: latestInstances.length
            });

            const ports = [];
            for (let port = config.portRange.start; port <= config.portRange.end; port++) {
                const isAvailable = !usedPorts.has(port);
                ports.push({
                    value: port,
                    label: isAvailable ? `${port} (available)` : `${port} (in use)`,
                    available: isAvailable,
                    display: true
                });
            }

            console.log('Generated ports:', ports);

            // Store all ports for filtering
            portSelect._allPorts = ports;
            renderPortOptions(ports);
        }

        function renderPortOptions(ports) {
            const portSelect = document.getElementById('instancePort');
            if (!portSelect) return;

            // Get currently selected value
            const currentValue = portSelect.value;

            portSelect.innerHTML = ports
                .filter(p => p.display)
                .map(p => `<option value="${p.value}" class="${p.available ? 'available' : 'used'}" ${!p.available ? 'disabled' : ''}>${p.label}</option>`)
                .join('');

            // Restore selection if it's still available
            if (currentValue && ports.find(p => p.value == currentValue && p.display)) {
                portSelect.value = currentValue;
            }
        }

        function updateSelectedPortDisplay() {
            const portSelect = document.getElementById('instancePort');
            const displayInput = document.getElementById('selectedPortDisplay');
            if (!portSelect || !displayInput) return;

            const selectedPort = portSelect.value;
            if (selectedPort) {
                displayInput.value = selectedPort;
            } else {
                displayInput.value = '';
            }
        }

        async function showAddModal() {
            console.log('showAddModal: Starting...');

            // Ensure config is loaded
            if (!config.portRange) {
                console.log('showAddModal: Loading config...');
                await loadConfig();
            }
            console.log('showAddModal: Config loaded', config);

            // Ensure instances are loaded for port availability check
            // Always refresh to get latest state
            console.log('showAddModal: Loading instances...');
            await loadInstances();
            console.log('showAddModal: Instances loaded', latestInstances);

            editingInstance = null;
            document.getElementById('modalTitle').textContent = 'Add New Instance';
            document.getElementById('instanceForm').reset();
            document.getElementById('threshold').value = config.defaultThreshold;
            document.getElementById('cvatSync').checked = false;
            document.getElementById('autoSync').checked = true;
            document.getElementById('pentagonFormat').checked = false;
            document.getElementById('obbMode').value = 'rectangle';
            document.getElementById('obbModeGroup').style.display = 'none'; // Hide OBB mode by default
            document.getElementById('instanceName').disabled = false;
            hideInstanceNameError();
            document.getElementById('modalError').style.display = 'none';
            document.getElementById('instanceModal').classList.add('active');
            hideClassPreview();
            populateDatasetOptions();

            // Initialize class file browser
            await navigateToClassPath('');

            // Populate port dropdown and select smallest available port
            console.log('showAddModal: Populating port options...');
            populatePortOptions();
            const defaultPort = findSmallestAvailablePort();
            console.log('showAddModal: Default port selected:', defaultPort);
            document.getElementById('instancePort').value = defaultPort;
            updateSelectedPortDisplay();
            console.log('showAddModal: Complete');
        }

        async function editInstance(name) {
            try {
                // Ensure config is loaded
                if (!config.portRange) {
                    await loadConfig();
                }

                // Ensure instances are loaded
                await loadInstances();

                const instance = latestInstances.find(i => i.name === name);
                if (!instance) {
                    alert('Instance not found');
                    return;
                }

                editingInstance = name;
                document.getElementById('modalTitle').textContent = 'Edit Instance';
                document.getElementById('instanceName').value = instance.name;
                document.getElementById('instanceName').disabled = true;
                document.getElementById('threshold').value = instance.threshold;
                document.getElementById('cvatSync').checked = instance.cvatSync || false;
                document.getElementById('autoSync').checked = instance.autoSync || false;
                document.getElementById('pentagonFormat').checked = instance.pentagonFormat || false;
                document.getElementById('obbMode').value = instance.obbMode || 'rectangle';
                document.getElementById('classFile').value = instance.classFile || '';

                // Show/hide OBB mode dropdown based on pentagonFormat
                document.getElementById('obbModeGroup').style.display = instance.pentagonFormat ? 'block' : 'none';

                hideInstanceNameError();
                document.getElementById('modalError').style.display = 'none';
                document.getElementById('instanceModal').classList.add('active');

                // Check dataset format and auto-check if already in OBB format
                checkAndUpdatePentagonFormat(name);
                if (instance.classFile) {
                    previewClassFile(instance.classFile);
                } else {
                    hideClassPreview();
                }

                // Populate dataset options first (this will reset the path)
                populateDatasetOptions();

                // IMPORTANT: Set the dataset path AFTER populateDatasetOptions()
                // to prevent it from being overwritten by the base directory
                document.getElementById('datasetPath').value = instance.datasetPath;

                // Initialize class file browser - navigate to parent folder if classFile exists
                if (instance.classFile) {
                    const basePath = config.datasetBasePath || '/data/datasets';
                    // Remove base path to get relative path
                    const relativePath = instance.classFile.replace(basePath + '/', '');
                    const classDir = relativePath.substring(0, relativePath.lastIndexOf('/'));
                    if (classDir) {
                        await navigateToClassPath(classDir);
                    } else {
                        await navigateToClassPath('');
                    }
                } else {
                    await navigateToClassPath('');
                }

                // Navigate to the parent folder of the selected dataset
                // But don't update the path field - preserve the existing instance path
                if (instance.datasetPath) {
                    const matchingDataset = datasets.find(d => d.path === instance.datasetPath);
                    if (matchingDataset) {
                        const parts = matchingDataset.name.split('/');
                        if (parts.length > 1) {
                            // Navigate to parent folder for browsing, but don't update the path field
                            const parentPath = parts.slice(0, -1).join('/');
                            navigateToPath(parentPath, false);
                        } else {
                            // Root level dataset
                            navigateToPath('', false);
                        }
                    } else {
                        // Dataset not found in tree, navigate to root
                        navigateToPath('', false);
                    }
                }

                // Populate port dropdown excluding this instance's port
                populatePortOptions(name);
                document.getElementById('instancePort').value = instance.port;
                updateSelectedPortDisplay();
            } catch (err) {
                alert(`Failed to load instance: ${err.message}`);
            }
        }

        function closeModal() {
            document.getElementById('instanceModal').classList.remove('active');
        }

        async function checkAndUpdatePentagonFormat(instanceName) {
            try {
                const response = await fetch(`${API_BASE}/api/instances/${instanceName}/check-format`);
                if (!response.ok) return;

                const data = await response.json();
                if (data.format === 'obb' || data.format === 'pentagon') {
                    // Auto-check the format checkbox if dataset is already in OBB format
                    document.getElementById('pentagonFormat').checked = true;
                }
            } catch (err) {
                console.error('Error checking dataset format:', err);
            }
        }

        async function handlePentagonFormatChange(instanceName, shouldConvert) {
            if (!shouldConvert) return; // User unchecked, no action needed

            try {
                const response = await fetch(`${API_BASE}/api/instances/${instanceName}/convert-pentagon`, {
                    method: 'POST'
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(`Error: ${data.error}`);
                    document.getElementById('pentagonFormat').checked = false;
                    return;
                }

                if (!data.alreadyConverted) {
                    alert(`Converted ${data.convertedCount} files to OBB format`);
                }
            } catch (err) {
                console.error('Error converting to OBB format:', err);
                alert(`Failed to convert: ${err.message}`);
                document.getElementById('pentagonFormat').checked = false;
            }
        }

        async function saveInstance(event) {
            event.preventDefault();

            const name = document.getElementById('instanceName').value;
            const port = parseInt(document.getElementById('instancePort').value, 10);
            const datasetPath = document.getElementById('datasetPath').value;
            const threshold = parseFloat(document.getElementById('threshold').value) || config.defaultThreshold;
            const cvatSync = document.getElementById('cvatSync').checked;
            const autoSync = document.getElementById('autoSync').checked;
            const pentagonFormat = document.getElementById('pentagonFormat').checked;
            const obbMode = document.getElementById('obbMode').value || 'rectangle';
            const classFile = document.getElementById('classFile').value || null;

            if (!validateInstanceName()) {
                return;
            }

            const data = { name, port, datasetPath, threshold, cvatSync, autoSync, pentagonFormat, obbMode, classFile };

            try {
                if (!config.portRange) {
                    document.getElementById('modalError').textContent = 'Config not loaded yet. Try again.';
                    document.getElementById('modalError').style.display = 'block';
                    return;
                }
                if (Number.isNaN(port) || port < config.portRange.start || port > config.portRange.end) {
                    const message = `Port must be between ${config.portRange.start} and ${config.portRange.end}.`;
                    document.getElementById('modalError').textContent = message;
                    document.getElementById('modalError').style.display = 'block';
                    return;
                }

                const url = editingInstance
                    ? `${API_BASE}/api/instances/${editingInstance}`
                    : `${API_BASE}/api/instances`;
                const method = editingInstance ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const error = await response.json();
                    document.getElementById('modalError').textContent = error.error;
                    document.getElementById('modalError').style.display = 'block';
                    return;
                }

                // Handle OBB format conversion if checked
                if (pentagonFormat) {
                    await handlePentagonFormatChange(name, true);
                }

                closeModal();
                refreshInstances();
            } catch (err) {
                document.getElementById('modalError').textContent = err.message;
                document.getElementById('modalError').style.display = 'block';
            }
        }

        async function showLogs(name) {
            document.getElementById('logsTitle').textContent = `Logs: ${name}`;
            document.getElementById('logsContent').textContent = 'Loading logs...';
            document.getElementById('logsModal').classList.add('active');
            activeLogsInstance = name;
            followLogs = true;
            toggleScrollLatest(false);
            attachLogsScrollHandler();

            await fetchAndRenderLogs(name);
            startLogsAutoRefresh(name);
        }

        function closeLogsModal() {
            document.getElementById('logsModal').classList.remove('active');
            stopLogsAutoRefresh();
        }

        // Close modal on background click
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('logsModal');
            if (!modal) return;
            if (modal.classList.contains('active') && e.target === modal) {
                closeLogsModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('logsModal');
                if (modal && modal.classList.contains('active')) {
                    closeLogsModal();
                }
            }
        });

        function refreshInstances() {
            loadInstances();
        }

        function startLogsAutoRefresh(name) {
            stopLogsAutoRefresh();
            logsIntervalId = setInterval(() => fetchAndRenderLogs(name), LOG_POLL_MS);
        }

        function stopLogsAutoRefresh() {
            if (logsIntervalId) {
                clearInterval(logsIntervalId);
                logsIntervalId = null;
            }
            activeLogsInstance = null;
        }

        function toggleScrollLatest(show) {
            const btn = document.getElementById('scrollLatestBtn');
            if (!btn) return;
            btn.style.display = show ? 'block' : 'none';
        }

        function scrollToLatest() {
            const container = document.getElementById('logsContent');
            if (!container) return;
            followLogs = true;
            toggleScrollLatest(false);
            container.scrollTop = container.scrollHeight;
        }

        function attachLogsScrollHandler() {
            const container = document.getElementById('logsContent');
            if (!container || container.dataset.listenerAttached) return;
            container.addEventListener('scroll', () => {
                const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                const nearBottom = distanceFromBottom <= SCROLL_THRESHOLD;
                followLogs = nearBottom;
                toggleScrollLatest(!nearBottom);
            });
            container.dataset.listenerAttached = 'true';
        }

        function hideInstanceNameError() {
            const errorEl = document.getElementById('instanceNameError');
            const input = document.getElementById('instanceName');
            const saveBtn = document.getElementById('saveInstanceBtn');
            if (errorEl) errorEl.style.display = 'none';
            if (input) input.classList.remove('input-error');
            if (saveBtn) saveBtn.disabled = false;
        }

        function validateInstanceName() {
            const input = document.getElementById('instanceName');
            const errorEl = document.getElementById('instanceNameError');
            const saveBtn = document.getElementById('saveInstanceBtn');
            if (!input || !errorEl) return true;

            const name = input.value.trim();
            const validFormat = /^[A-Za-z0-9_-]+$/.test(name);
            const isSameAsEditing = editingInstance && name === editingInstance;
            const exists = latestInstances.some(i => i.name === name);
            const duplicate = name && exists && !isSameAsEditing;
            const invalidFormat = name && !validFormat;
            const invalid = duplicate || invalidFormat;

            if (invalidFormat) {
                errorEl.textContent = 'Use only letters, numbers, hyphens, or underscores.';
                errorEl.style.display = 'block';
                input.classList.add('input-error');
            } else if (duplicate) {
                errorEl.textContent = `Instance name "${name}" is already in use. Choose another.`;
                errorEl.style.display = 'block';
                input.classList.add('input-error');
            } else {
                hideInstanceNameError();
            }

            if (saveBtn) {
                saveBtn.disabled = invalid;
            }

            return !invalid;
        }

        async function fetchAndRenderLogs(name) {
            const container = document.getElementById('logsContent');
            if (!container || !name) return;

            const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

            try {
                const response = await fetch(`${API_BASE}/api/instances/${name}/logs?lines=all`);
                const logs = await response.json();

                // Debug info
                let debugText = '';
                if (logs._debug) {
                    debugText = `[DEBUG] Out log exists: ${logs._debug.outLogExists}, size: ${logs._debug.outLogSize || 0}, lines: ${logs._debug.outLogLineCount || 0}\n`;
                    debugText += `[DEBUG] Out path: ${logs._debug.outLogPath}\n`;
                    if (logs._debug.errLogSkipped) {
                        debugText += `[DEBUG] Err log skipped (only reading -out.log)\n`;
                    }
                    debugText += '\n';
                }

                // Combine stdout and stderr, with clear separation
                let combined = debugText;
                if (logs.stdout && logs.stdout.trim()) {
                    combined += '=== STDOUT ===\n' + logs.stdout + '\n';
                }
                if (logs.stderr && logs.stderr.trim()) {
                    combined += '=== STDERR ===\n' + logs.stderr;
                }

                container.textContent = combined || 'No logs available';

                if (followLogs) {
                    container.scrollTop = container.scrollHeight;
                } else {
                    const newDistance = Math.max(0, container.scrollHeight - container.clientHeight - distanceFromBottom);
                    container.scrollTop = newDistance;
                }
            } catch (err) {
                container.textContent = `Failed to load logs: ${err.message}`;
            }
        }

        loadConfig().then(() => {
            // Start auto-refresh with interval from config
            const refreshInterval = config.healthCheckInterval || 5000;
            setInterval(loadInstances, refreshInterval);
        });
        loadInstances();

        // Attach validation handlers once DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            const nameInput = document.getElementById('instanceName');
            if (nameInput) {
                nameInput.addEventListener('blur', validateInstanceName);
                nameInput.addEventListener('input', () => {
                    hideInstanceNameError();
                });
            }

            const classInput = document.getElementById('classFile');
            if (classInput) {
                classInput.addEventListener('change', () => previewClassFile(classInput.value));
                classInput.addEventListener('blur', () => previewClassFile(classInput.value));
            }

            // Show/hide OBB mode dropdown based on pentagonFormat checkbox
            const pentagonCheckbox = document.getElementById('pentagonFormat');
            if (pentagonCheckbox) {
                pentagonCheckbox.addEventListener('change', () => {
                    const obbModeGroup = document.getElementById('obbModeGroup');
                    if (obbModeGroup) {
                        obbModeGroup.style.display = pentagonCheckbox.checked ? 'block' : 'none';
                    }
                });
            }
        });
