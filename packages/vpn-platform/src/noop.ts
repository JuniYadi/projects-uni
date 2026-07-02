import type { VpnPlatformDriver, VpnStats, VpnStatus } from './types'

export function createNoopDriver(): VpnPlatformDriver {
  let status: VpnStatus = 'disconnected'

  return {
    initialize: async () => {},
    connect: async () => {
      status = 'connected'
    },
    disconnect: async () => {
      status = 'disconnected'
    },
    status: async () => status,
    stats: async () => ({ bytesSent: 0, bytesReceived: 0 }),
  }
}
