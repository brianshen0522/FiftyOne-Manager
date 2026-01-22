async function getConfig() {
            try {
                const response = await fetch('/api/config');
                return await response.json();
            } catch (error) {
                console.error('Could not fetch config:', error);
                return { publicAddress: window.location.hostname, managerPort: '5000' };
            }
        }

        async function openEditor() {
            // Get URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const imagePath = urlParams.get('image');
            const labelPath = urlParams.get('label');

            if (!imagePath || !labelPath) {
                document.getElementById('status').textContent = 'Error: Missing image or label path';
                return;
            }

            // Get config from server
            const config = await getConfig();
            const protocol = window.location.protocol;
            const publicAddress = config.publicAddress || window.location.hostname;
            const managerPort = config.managerPort || '5000';

            // Construct the label editor URL
            const editorUrl = `${protocol}//${publicAddress}:${managerPort}/label-editor?image=${encodeURIComponent(imagePath)}&label=${encodeURIComponent(labelPath)}`;

            document.getElementById('status').textContent = `Opening editor at ${publicAddress}:${managerPort}...`;

            // Set the manual link
            const manualLink = document.getElementById('editorLink');
            manualLink.href = editorUrl;

            // Try to open automatically
            try {
                const newWindow = window.open(editorUrl, '_blank');

                // Check if popup was blocked
                setTimeout(() => {
                    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                        // Popup was blocked, show manual link
                        document.getElementById('status').textContent = 'Popup blocked - please click the link below:';
                        document.getElementById('manualLink').style.display = 'block';
                    } else {
                        // Success! Close this tab after a moment
                        document.getElementById('status').textContent = 'Editor opened! You can close this tab.';
                        setTimeout(() => {
                            window.close();
                        }, 2000);
                    }
                }, 500);
            } catch (error) {
                // Error opening window, show manual link
                document.getElementById('status').textContent = 'Error opening editor - please click the link below:';
                document.getElementById('manualLink').style.display = 'block';
            }
        }

        // Run on page load
        openEditor();
