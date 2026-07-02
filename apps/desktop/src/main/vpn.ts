import { createVpnCore } from '@univpn/vpn-core'
import { createPlatformDriver } from '@univpn/vpn-platform'
import { api } from './api'

// ponytail: thin wrapper; all business logic lives in @univpn/vpn-core
export const vpnService = createVpnCore({
  api,
  driver: createPlatformDriver(),
})
