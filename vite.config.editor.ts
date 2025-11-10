import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite optimization config for Story Editor
// Code splitting strategy to minimize bundle size
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Firebase services
          'firebase-core': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          'firebase-storage': ['firebase/storage'],
          
          // UI components
          'ui-core': [
            './client/components/ui/button',
            './client/components/ui/input',
            './client/components/ui/slider'
          ],
          
          // Story Editor - lazy loaded
          'story-editor': [
            './client/components/story/AdvancedStoryEditor',
            './client/components/story/EditorUtils',
            './client/components/story/EditorTypes'
          ],
          
          // Story Editor Tools - lazy loaded separately
          'story-tools-text': ['./client/components/story/TextToolPanel'],
          'story-tools-draw': ['./client/components/story/DrawToolPanel'],
          'story-tools-filter': ['./client/components/story/FilterPanel'],
          'story-tools-sticker': ['./client/components/story/StickerToolPanel'],
          
          // Interactive stickers - lazy loaded on demand
          'story-interactive': [
            './client/components/story/PollSticker',
            './client/components/story/QuestionSticker',
            './client/components/story/SliderSticker',
            './client/components/story/MusicSticker'
          ],
          
          // Emoji picker - lazy loaded
          'story-emoji': ['./client/components/story/EmojiPicker'],
          
          // Draggable components
          'story-draggable': ['./client/components/story/DraggableText']
        },
        
        // Chunk size warnings
        chunkSizeWarningLimit: 300, // 300KB per chunk
        
        // Asset optimization
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/woff2?|ttf|otf|eot/i.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        
        // JS chunks
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'] // Remove specific console methods
      },
      format: {
        comments: false // Remove all comments
      }
    },
    
    // Source maps for debugging
    sourcemap: true,
    
    // Target modern browsers for smaller bundle
    target: 'es2020',
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Asset inlining threshold (4KB)
    assetsInlineLimit: 4096,
  },
  
  // Optimization hints
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom'
    ],
    exclude: [
      // Exclude story editor from initial optimization
      '@/components/story/AdvancedStoryEditor',
      '@/components/story/EmojiPicker',
      '@/components/story/PollSticker',
      '@/components/story/QuestionSticker',
      '@/components/story/SliderSticker',
      '@/components/story/MusicSticker'
    ]
  },
  
  // Performance settings
  server: {
    hmr: {
      overlay: true
    }
  },
  
  // Compression
  build: {
    ...{}, // Preserve existing build config
    reportCompressedSize: true,
    
    // Enable gzip/brotli compression hints
    rollupOptions: {
      ...{},
      plugins: []
    }
  }
});
