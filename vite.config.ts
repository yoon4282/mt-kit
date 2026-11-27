import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' → 상대 경로 빌드라 GitHub Pages(하위 경로)와 Vercel(루트) 모두 동작
export default defineConfig({
  base: './',
  plugins: [react()],
});
