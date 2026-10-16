import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({build:{outDir:'tmp/novara-build',rollupOptions:{input:{legal:resolve(process.cwd(),'novara-legal.html'),home:resolve(process.cwd(),'novara.html'),films:resolve(process.cwd(),'novara-films.html'),grid:resolve(process.cwd(),'novara-films-grid.html'),explore:resolve(process.cwd(),'novara-films-explore.html'),project:resolve(process.cwd(),'novara-project.html')}}}});
