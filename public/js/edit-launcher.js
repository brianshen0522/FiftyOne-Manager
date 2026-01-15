// Show current URL
        document.getElementById('currentUrl').textContent = window.location.href;

        function openFromUrl() {
            const input = document.getElementById('urlInput').value.trim();

            if (!input) {
                alert('Please paste a URL first');
                return;
            }

            try {
                // Extract parameters from the URL
                let urlToParse = input;

                // If it starts with //, add protocol
                if (urlToParse.startsWith('//')) {
                    urlToParse = window.location.protocol + urlToParse;
                }

                // Replace {hostname} placeholder with current hostname
                urlToParse = urlToParse.replace('{hostname}', window.location.hostname);
                urlToParse = urlToParse.replace('%7Bhostname%7D', window.location.hostname);

                // Parse URL
                const url = new URL(urlToParse);
                const params = new URLSearchParams(url.search);

                const imagePath = params.get('image');
                const labelPath = params.get('label');

                if (!imagePath || !labelPath) {
                    alert('Invalid URL: missing image or label path');
                    return;
                }

                // Get config from server to get the correct port
                fetch('/api/config')
                    .then(response => response.json())
                    .then(config => {
                        const protocol = window.location.protocol;
                        const publicAddress = config.publicAddress || window.location.hostname;
                        const managerPort = params.get('port') || config.managerPort || '5000';
                        const editorUrl = `${protocol}//${publicAddress}:${managerPort}/label-editor.html?image=${encodeURIComponent(imagePath)}&label=${encodeURIComponent(labelPath)}`;

                        // Open in new tab
                        window.open(editorUrl, '_blank');

                        // Show success message
                        const successDiv = document.getElementById('success');
                        successDiv.textContent = `✓ Opened label editor for ${imagePath.split('/').pop()}`;
                        successDiv.style.display = 'block';

                        // Clear input after a moment
                        setTimeout(() => {
                            document.getElementById('urlInput').value = '';
                            successDiv.style.display = 'none';
                        }, 3000);
                    })
                    .catch(error => {
                        alert('Error fetching config: ' + error.message);
                    });

            } catch (error) {
                alert('Error parsing URL: ' + error.message);
            }
        }

        // Allow Enter key in textarea to open editor
        document.getElementById('urlInput').addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                openFromUrl();
            }
        });
