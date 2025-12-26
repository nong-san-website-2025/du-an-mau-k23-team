/// <reference types="vitest" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['@babel/plugin-syntax-import-attributes'],
      },
    }),
  ],
  server: {
    // 1. Cho phép server lắng nghe mọi IP (để Emulator kết nối được)
    host: '0.0.0.0',
    port: 8100, // Ionic mặc định dùng 8100, nên đổi từ 5173 về 8100 cho chuẩn
    middlewareMode: false,
    
    // 2. Cấu hình WebSocket để Live Reload hoạt động
    hmr: {
      protocol: 'ws',
      // QUAN TRỌNG: Thay dòng này bằng IP Wifi hiện tại của bạn
      // (Lấy từ log bạn gửi lúc nãy: 192.168.89.159)
      host: '172.16.102.132', 
      port: 8100,
    },  
  },
  build: {
    target: 'esnext',
    minify: 'terser',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})