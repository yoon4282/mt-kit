import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' : Vercel / GitHub Pages(하위 경로) 어디에 올려도 동작
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
});
