import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    optimizeDeps: {
      // Force vite to pre-bundle these dependencies to prevent commonjs/esm issues
      include: ['@heyputer/puter.js', 'jspdf', 'lucide-react', '@google/genai'],
    },
    server: {
      proxy: {
        '/hf-api': {
          target: 'https://router.huggingface.co/hf-inference',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/hf-api/, '/models'),
          secure: false,
        }
      }
    }
  };
});