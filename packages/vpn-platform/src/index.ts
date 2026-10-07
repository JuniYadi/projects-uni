import { createDarwinDriver } from './darwin'
import { createNoopDriver } from './noop'
import { createWindowsDriver, resolveWindowsResources } from './windows'
import type { VpnPlatformDriver, VpnStats, VpnStatus } from './types'

export type { VpnPlatformDriver, VpnStats, VpnStatus }
export { createWindowsDriver, resolveWindowsResources, createDarwinDriver, createNoopDriver }

export function createPlatformDriver(): VpnPlatformDriver {
  if (process.platform === 'win32') {
    return createWindowsDriver()
  }
  if (process.platform === 'darwin') {
    return createDarwinDriver()
  }
  return createNoopDriver()
}
