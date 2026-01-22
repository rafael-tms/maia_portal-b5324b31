import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { componentTagger } from 'lovable-tagger'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  publicDir: 'public',
  server: {
    host: "::",
    port: 8080
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        galeria: resolve(__dirname, 'galeria.html'),
        montagem: resolve(__dirname, 'montagem.html'),
        noticias: resolve(__dirname, 'noticias.html'),
        noticiaDetalhe: resolve(__dirname, 'noticia-detalhe.html'),
        videos: resolve(__dirname, 'videos.html')
      }
    },
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg', '**/*.ico'],
    copyPublicDir: true
  }
}))
