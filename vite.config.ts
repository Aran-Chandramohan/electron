import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Electron loads the built index.html via file://, where absolute asset
  // paths (the default) resolve against the filesystem root and 404. Relative
  // paths make the build work both there and under a normal http server.
  base: './',
});
