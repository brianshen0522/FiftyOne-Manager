const STORAGE_KEY = 'fiftyone_edit_label_request';
        let lastRequest = null;

        function log(message, isSuccess = false) {
            const logDiv = document.getElementById('log');
            const entry = document.createElement('div');
            entry.className = 'log-entry' + (isSuccess ? ' success' : '');
            const timestamp = new Date().toLocaleTimeString();
            entry.textContent = `[${timestamp}] ${message}`;
            logDiv.insertBefore(entry, logDiv.firstChild);

            // Keep only last 20 entries
            while (logDiv.children.length > 20) {
                logDiv.removeChild(logDiv.lastChild);
            }
        }

        async function openEditor(imagePath, labelPath, managerPort) {
            // Construct the label editor URL using config from server
            const config = await getConfig();
            const protocol = window.location.protocol;
            const publicAddress = config.publicAddress || window.location.hostname;
            const port = config.managerPort || managerPort || '5000';

            const editorUrl = `${protocol}//${publicAddress}:${port}/label-editor.html?image=${encodeURIComponent(imagePath)}&label=${encodeURIComponent(labelPath)}`;

            // Open in new tab
            const newWindow = window.open(editorUrl, '_blank');

            if (!newWindow) {
                log('❌ Failed to open editor - popup blocked?');
                return false;
            }

            const filename = imagePath.split('/').pop();
            log(`✅ Opened editor for ${filename}`, true);
            return true;
        }

        async function getConfig() {
            try {
                const response = await fetch('/api/config');
                return await response.json();
            } catch (error) {
                log(`⚠️ Could not fetch config, using defaults: ${error.message}`);
                return { publicAddress: window.location.hostname, managerPort: '5000' };
            }
        }

        function checkForRequests() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (!stored) return;

                const request = JSON.parse(stored);

                // Check if this is a new request (different from last one)
                if (JSON.stringify(request) === lastRequest) {
                    return;
                }

                lastRequest = JSON.stringify(request);

                // Open the editor
                log(`📥 Received request: ${request.filename}`);
                openEditor(request.image_path, request.label_path, request.manager_port);

                // Clear the request after processing
                localStorage.removeItem(STORAGE_KEY);

            } catch (error) {
                log(`❌ Error: ${error.message}`);
            }
        }

        async function testOpen() {
            // Get config from server
            const config = await getConfig();

            // Test with dummy data
            const testData = {
                image_path: '/data/datasets/test/images/test.jpg',
                label_path: '/data/datasets/test/labels/test.txt',
                manager_port: config.managerPort || '5000',
                filename: 'test.jpg',
                timestamp: Date.now()
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(testData));
            log(`🧪 Test request sent (port: ${testData.manager_port})`);
        }

        function clearLog() {
            document.getElementById('log').innerHTML = '<div class="log-entry">Log cleared.</div>';
        }

        // Check for requests every 500ms
        setInterval(checkForRequests, 500);

        // Also listen for storage events (when changed by another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                checkForRequests();
            }
        });

        log('🎯 Monitoring for FiftyOne operator requests...');
