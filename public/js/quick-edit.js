// Auto-update label path when image path changes
        document.getElementById('imagePath').addEventListener('input', function(e) {
            const imagePath = e.target.value;
            if (imagePath) {
                const labelPath = imagePath
                    .replace('/images/', '/labels/')
                    .replace(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/, '.txt');
                document.getElementById('labelPath').value = labelPath;
            }
        });

        function generateUrl() {
            const imagePath = document.getElementById('imagePath').value;
            const labelPath = document.getElementById('labelPath').value;

            if (!imagePath) {
                alert('Please enter an image path');
                return null;
            }

            const url = `${window.location.origin}/label-editor?image=${encodeURIComponent(imagePath)}&label=${encodeURIComponent(labelPath)}`;
            return url;
        }

        function openEditor() {
            const url = generateUrl();
            if (url) {
                // Save to recent
                saveRecent(document.getElementById('imagePath').value);

                // Open in new tab
                window.open(url, '_blank');

                // Show URL
                document.getElementById('generatedUrl').textContent = url;
                document.getElementById('result').style.display = 'block';
            }
        }

        function copyUrl() {
            const url = generateUrl();
            if (url) {
                navigator.clipboard.writeText(url).then(() => {
                    alert('URL copied to clipboard!');
                    document.getElementById('generatedUrl').textContent = url;
                    document.getElementById('result').style.display = 'block';
                });
            }
        }

        function saveRecent(imagePath) {
            if (!imagePath) return;

            let recent = JSON.parse(localStorage.getItem('recentFiles') || '[]');

            // Remove if already exists
            recent = recent.filter(path => path !== imagePath);

            // Add to front
            recent.unshift(imagePath);

            // Keep only last 10
            recent = recent.slice(0, 10);

            localStorage.setItem('recentFiles', JSON.stringify(recent));
            loadRecent();
        }

        function loadRecent() {
            const recent = JSON.parse(localStorage.getItem('recentFiles') || '[]');
            const container = document.getElementById('recentList');

            if (recent.length === 0) {
                container.innerHTML = '<p style="color: #aaa;">No recent files yet. Open an image to see it here.</p>';
                return;
            }

            container.innerHTML = recent.map(imagePath => {
                const filename = imagePath.split('/').pop();
                const labelPath = imagePath
                    .replace('/images/', '/labels/')
                    .replace(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/, '.txt');
                const url = `${window.location.origin}/label-editor?image=${encodeURIComponent(imagePath)}&label=${encodeURIComponent(labelPath)}`;

                return `
                    <div class="recent-item">
                        <div class="filename">${imagePath}</div>
                        <button class="btn-small" onclick="window.open('${url}', '_blank')">Open Editor</button>
                    </div>
                `;
            }).join('');
        }

        // Load recent files on page load
        loadRecent();

        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const imageParam = urlParams.get('image');
        if (imageParam) {
            document.getElementById('imagePath').value = imageParam;
            document.getElementById('imagePath').dispatchEvent(new Event('input'));
        }
