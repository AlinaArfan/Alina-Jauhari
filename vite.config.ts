
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Menyediakan process.env ke sisi client secara aman
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY)
    }
  }
});
