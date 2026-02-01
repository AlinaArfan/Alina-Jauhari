
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure process.env.API_KEY is replaced during build time
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
