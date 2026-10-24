import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const workspaceDeps = ['@univpn/api', '@univpn/shared', '@univpn/vpn-core', '@univpn/vpn-platform', 'electron-updater']

const apiBaseUrl =
  process.env.UNIVPN_API_BASE_URL ??
  'https://pfnapp.id/api/vpn/mobile'

const umamiWebsiteId = process.env.UNIVPN_UMAMI_WEBSITE_ID ?? ''

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: workspaceDeps })],
    define: {
      'process.env.UNIVPN_API_BASE_URL': JSON.stringify(apiBaseUrl),
      'process.env.EXPO_PUBLIC_UMAMI_WEBSITE_ID': JSON.stringify(umamiWebsiteId),
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
