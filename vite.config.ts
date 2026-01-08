
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  define: {
    // 브라우저에서 process.env.API_KEY 접근 시 에러 방지
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});
