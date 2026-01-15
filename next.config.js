/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/index.html', destination: '/' },
      { source: '/label-editor.html', destination: '/label-editor' },
      { source: '/auto-open.html', destination: '/auto-open' },
      { source: '/open-editor.html', destination: '/open-editor' },
      { source: '/edit-launcher.html', destination: '/edit-launcher' },
      { source: '/quick-edit.html', destination: '/quick-edit' },
      { source: '/auto-launcher.html', destination: '/auto-launcher' },
      { source: '/label-editor-main.html', destination: '/label-editor-main' }
    ];
  }
};

module.exports = nextConfig;
