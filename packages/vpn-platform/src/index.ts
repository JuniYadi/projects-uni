import { createNoopDriver } from './noop'
import { createWindowsDriver } from './windows'
import type { VpnPlatformDriver, VpnStats, VpnStatus } from './types'

export type { VpnPlatformDriver, VpnStats, VpnStatus }
export { createWindowsDriver, createNoopDriver }

export function createPlatformDriver(): VpnPlatformDriver {
  if (process.platform === 'win32') {
    return createWindowsDriver()
  }
  // ponytail: macOS driver will be added in M4
  return createNoopDriver()
}
