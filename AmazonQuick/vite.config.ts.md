# File: vite.config.ts
- **Original Path:** `frontend/vite.config.ts`
- **Language / Type:** `typescript`
- **Lines of Code:** 42

---

```typescript
import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Gera dist/404.html para suporte nativo a SPA em Cloudflare Pages / GitHub Pages
function copy404Plugin(): Plugin {
  return {
    name: 'copy-404',
    closeBundle() {
      const distIndex = path.resolve(__dirname, 'dist/index.html')
      const dist404 = path.resolve(__dirname, 'dist/404.html')
      if (fs.existsSync(distIndex)) {
        fs.copyFileSync(distIndex, dist404)
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copy404Plugin()],
  server: {
    port: 5050,
    proxy: {
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
        }
      }
    }
  }
})

```
