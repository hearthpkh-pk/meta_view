import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: {
          vendor: ['src/App.js', 'src/core/Router.js', 'src/core/LayoutManager.js']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    historyApiFallback: true
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
