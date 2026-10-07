import { createDarwinDriver } from './darwin'
import { createNoopDriver } from './noop'
import { createWindowsDriver } from './windows'
import type { VpnPlatformDriver, VpnStats, VpnStatus } from './types'

export type { VpnPlatformDriver, VpnStats, VpnStatus }
export { createWindowsDriver, createDarwinDriver, createNoopDriver }

export function createPlatformDriver(): VpnPlatformDriver {
  if (process.platform === 'win32') {
    return createWindowsDriver()
  }
  if (process.platform === 'darwin') {
    return createDarwinDriver()
  }
  return createNoopDriver()
}
