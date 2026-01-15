(function() {
            // Get the target URL from query parameter
            const urlParams = new URLSearchParams(window.location.search);
            const targetUrl = urlParams.get('url');

            if (!targetUrl) {
                document.getElementById('status').textContent = 'Error: No URL specified';
                document.querySelector('.spinner').style.display = 'none';
                return;
            }

            // Set the manual link
            const manualLink = document.getElementById('editorLink');
            manualLink.href = targetUrl;

            // Countdown from 3 to 1
            let count = 3;
            const countdownEl = document.getElementById('countdown');
            const secondsEl = document.getElementById('seconds');

            const countdownInterval = setInterval(() => {
                count--;
                countdownEl.textContent = count;
                secondsEl.textContent = count;

                if (count === 0) {
                    clearInterval(countdownInterval);
                    openEditor();
                }
            }, 1000);

            function openEditor() {
                try {
                    // Try to open in a new tab
                    const newWindow = window.open(targetUrl, '_blank');

                    // Check if popup was blocked
                    setTimeout(() => {
                        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                            // Popup was blocked
                            document.getElementById('status').textContent = 'Popup blocked! Please click the link below:';
                            document.querySelector('.spinner').style.display = 'none';
                            document.querySelector('.countdown').style.display = 'none';
                            document.getElementById('manualLink').style.display = 'block';
                        } else {
                            // Success!
                            document.getElementById('status').textContent = '✓ Label editor opened! You can close this tab.';
                            document.querySelector('.spinner').style.display = 'none';
                            document.querySelector('.countdown').style.display = 'none';

                            // Close this tab after 2 seconds
                            setTimeout(() => {
                                window.close();
                            }, 2000);
                        }
                    }, 500);

                } catch (error) {
                    // Error opening window
                    document.getElementById('status').textContent = 'Error: ' + error.message;
                    document.querySelector('.spinner').style.display = 'none';
                    document.querySelector('.countdown').style.display = 'none';
                    document.getElementById('manualLink').style.display = 'block';
                }
            }

        })();
