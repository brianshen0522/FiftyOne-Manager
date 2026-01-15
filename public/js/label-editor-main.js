const API_BASE = window.location.origin;
        let instances = [];
        let config = {};

        function setStatus(text) {
            const status = document.getElementById('statusText');
            if (status) {
                status.textContent = text;
            }
        }

        function normalizeDatasetPath(datasetPath) {
            return (datasetPath || '').replace(/\/+$/, '');
        }

        function buildEditorUrl(datasetPath, lastImagePath) {
            const normalized = normalizeDatasetPath(datasetPath);
            if (!normalized) {
                return '';
            }
            const basePath = config.datasetBasePath || '/data/datasets';
            const relativePath = normalized.startsWith(basePath)
                ? normalized.slice(basePath.length).replace(/^\/+/, '')
                : '';
            const folderPath = relativePath ? `${relativePath}/images` : 'images';
            const normalizedStart = normalizeStartImagePath(lastImagePath, folderPath);
            const startParam = normalizedStart ? `&start=${encodeURIComponent(normalizedStart)}` : '';
            return `${window.location.origin}/label-editor.html?base=${encodeURIComponent(basePath)}&folder=${encodeURIComponent(folderPath)}${startParam}`;
        }

        async function openLabelEditor(datasetPath, lastImagePath) {
            const decodedPath = decodeURIComponent(datasetPath || '');
            const decodedLast = decodeURIComponent(lastImagePath || '');
            let latestLast = decodedLast;
            try {
                const response = await fetch(`${API_BASE}/api/instances/last-image?datasetPath=${encodeURIComponent(decodedPath)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.lastImagePath) {
                        latestLast = data.lastImagePath;
                    }
                }
            } catch (err) {
                // Ignore fetch errors and fall back to cached data
            }
            const url = buildEditorUrl(decodedPath, latestLast);
            if (!url) {
                alert('Dataset path is missing.');
                return;
            }
            window.open(url, '_blank');
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

        async function copyEditorUrl(url) {
            if (!url) {
                alert('No URL available to copy.');
                return;
            }
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(url);
                } else {
                    const temp = document.createElement('textarea');
                    temp.value = url;
                    document.body.appendChild(temp);
                    temp.select();
                    document.execCommand('copy');
                    document.body.removeChild(temp);
                }
                setStatus('Label editor URL copied to clipboard.');
            } catch (err) {
                alert('Failed to copy URL.');
            }
        }

        function statusLabel(instance) {
            const status = (instance.status || 'unknown').toLowerCase();
            const isOnline = status === 'online';
            const pillClass = isOnline ? 'online' : 'offline';
            const label = isOnline ? 'Online' : 'Offline';
            return `<span class="pill ${pillClass}"><span class="dot"></span>${label}</span>`;
        }

        function renderInstances() {
            const grid = document.getElementById('instancesGrid');
            const emptyState = document.getElementById('emptyState');
            if (!grid || !emptyState) {
                return;
            }

            if (!instances.length) {
                grid.innerHTML = '';
                emptyState.style.display = 'block';
                setStatus('0 instances found.');
                return;
            }

            emptyState.style.display = 'none';
            setStatus(`${instances.length} instance${instances.length === 1 ? '' : 's'} loaded.`);
            grid.innerHTML = instances.map(instance => {
                const datasetPath = instance.datasetPath || '';
                const lastImagePath = instance.lastImagePath || '';
                const editorUrl = buildEditorUrl(datasetPath, lastImagePath);
                const isDisabled = !datasetPath;
                return `
                    <div class="card">
                        <div>
                            <h2>${instance.name || 'Instance'}</h2>
                            ${statusLabel(instance)}
                        </div>
                        <div class="meta">
                            <div><strong>Dataset:</strong> ${datasetPath || 'Not set'}</div>
                            <div><strong>Port:</strong> ${instance.port || '-'}</div>
                        </div>
                        <div class="actions">
                            <button class="btn" onclick="openLabelEditor('${encodeURIComponent(datasetPath)}', '${encodeURIComponent(lastImagePath)}')" ${isDisabled ? 'disabled' : ''}>
                                Open Label Editor
                            </button>
                            <button class="btn secondary" onclick="copyEditorUrl('${editorUrl}')" ${editorUrl ? '' : 'disabled'}>
                                Copy URL
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        async function refreshInstances() {
            setStatus('Loading instances...');
            try {
                const response = await fetch(`${API_BASE}/api/instances`);
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to load instances');
                }
                instances = Array.isArray(data) ? data : [];
            } catch (err) {
                instances = [];
                setStatus(`Error: ${err.message}`);
                console.error(err);
            }
            renderInstances();
        }

        async function loadConfig() {
            try {
                const response = await fetch(`${API_BASE}/api/config`);
                if (response.ok) {
                    config = await response.json();
                }
            } catch (err) {
                config = {};
            }
        }

        loadConfig().then(refreshInstances);
