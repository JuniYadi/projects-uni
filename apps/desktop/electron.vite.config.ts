import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const workspaceDeps = ['@univpn/api', '@univpn/shared', '@univpn/vpn-core', '@univpn/vpn-platform']

const apiBaseUrl =
  process.env.UNIVPN_API_BASE_URL ??
  'https://pgreen.tunnel.juniyadi.id/api/vpn/mobile'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: workspaceDeps })],
    define: {
      'process.env.UNIVPN_API_BASE_URL': JSON.stringify(apiBaseUrl),
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
        },
      },
    },
  },
  renderer: {
    plugins: [react(), tailwindcss()],
  },
})
