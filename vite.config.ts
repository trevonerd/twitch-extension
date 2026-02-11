import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      // Wrap content scripts in IIFE with duplicate-injection guard.
      // Chrome may re-inject content scripts during SPA navigation or
      // extension reloads; bare top-level `const` would throw
      // "Identifier already declared".  The guard `return`s early from
      // the IIFE so no listeners/observers are registered twice.
      name: 'wrap-content-scripts-iife',
      generateBundle(_, bundle) {
        const guards: Record<string, string> = {
          'content.js': '__drophunter_content__',
          'integrity-interceptor.js': '__drophunter_interceptor__',
        };
        for (const [fileName, chunk] of Object.entries(bundle)) {
          const guard = guards[fileName];
          if (guard && chunk.type === 'chunk') {
            chunk.code = `(function(){if(window["${guard}"])return;window["${guard}"]=true;${chunk.code}})();\n`;
          }
        }
      },
    },
    {
      name: 'copy-manifest-and-icons',
      closeBundle() {
        // Copia manifest.json
        copyFileSync('public/manifest.json', 'dist/manifest.json')

        // Copia cartella icons
        mkdirSync('dist/icons', { recursive: true })
        const icons = ['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png']
        icons.forEach(icon => {
          copyFileSync(`public/icons/${icon}`, `dist/icons/${icon}`)
        })

        console.log('✓ Copied manifest.json and icons to dist/')
      }
    }
  ],
  base: './',
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        monitor: resolve(__dirname, 'monitor.html'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
        content: resolve(__dirname, 'src/content/content-script.ts'),
        'integrity-interceptor': resolve(__dirname, 'src/content/integrity-interceptor.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'content') return 'content.js';
          if (chunkInfo.name === 'integrity-interceptor') return 'integrity-interceptor.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
})
