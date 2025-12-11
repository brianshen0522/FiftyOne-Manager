"""
Custom FiftyOne Panel for Auto-Launching Label Editor
"""

import fiftyone.operators as foo
import fiftyone.operators.types as types


class AutoLauncherPanel(foo.Panel):
    """Panel that automatically sends operator results to the Auto Launcher"""

    @property
    def config(self):
        return foo.PanelConfig(
            name="auto_launcher_panel",
            label="Auto Label Editor",
        )

    def render(self, ctx):
        """Render the panel with JavaScript that monitors for operator results"""

        panel = types.Object()

        # Inject JavaScript that will run in the panel
        panel.view("html", types.View(
            component="https://unpkg.com/@fiftyone/components",
            content="""
            <div id="auto-launcher-panel" style="padding: 20px; background: #2a2a2a; border-radius: 8px; color: white; font-family: sans-serif;">
                <h3 style="margin-top: 0;">🚀 Auto Label Editor</h3>
                <p style="color: #aaa; font-size: 14px;">
                    Auto-launch is <span id="status" style="color: #28a745; font-weight: bold;">ACTIVE</span>
                </p>
                <p style="color: #888; font-size: 12px; margin-top: 10px;">
                    When you run "Edit Label in Tool", the editor will automatically open.
                    <br>Make sure the Auto Launcher tab is open: <code style="background: #1a1a1a; padding: 2px 6px; border-radius: 3px;">http://&lt;your-ip&gt;:3000/auto-launcher.html</code>
                </p>
                <div id="log" style="margin-top: 15px; font-size: 12px; font-family: monospace; max-height: 200px; overflow-y: auto;"></div>
            </div>

            <script>
                (function() {
                    const STORAGE_KEY = 'fiftyone_edit_label_request';

                    function log(message) {
                        const logDiv = document.getElementById('log');
                        if (!logDiv) return;

                        const entry = document.createElement('div');
                        entry.style.padding = '4px';
                        entry.style.borderLeft = '3px solid #007bff';
                        entry.style.marginBottom = '4px';
                        entry.style.background = '#333';
                        entry.style.borderRadius = '3px';
                        const timestamp = new Date().toLocaleTimeString();
                        entry.textContent = `[${timestamp}] ${message}`;
                        logDiv.insertBefore(entry, logDiv.firstChild);

                        // Keep only last 10 entries
                        while (logDiv.children.length > 10) {
                            logDiv.removeChild(logDiv.lastChild);
                        }
                    }

                    // Monitor for operator execution events
                    // This is a simplified version - you may need to adjust based on FiftyOne version
                    window.addEventListener('fiftyone:operator:executed', function(event) {
                        if (event.detail && event.detail.operator === 'edit_label/open_label_editor') {
                            const result = event.detail.result;
                            if (result && result.image_path) {
                                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                                    image_path: result.image_path,
                                    label_path: result.label_path,
                                    manager_port: result.manager_port || '3000',
                                    filename: result.filename,
                                    timestamp: Date.now()
                                }));
                                log('✅ Sent to Auto Launcher: ' + result.filename);
                            }
                        }
                    });

                    log('Panel loaded. Monitoring for operator execution...');
                })();
            </script>
            """
        ))

        return types.Property(panel)


def register(p):
    """Register the panel"""
    p.register(AutoLauncherPanel)
