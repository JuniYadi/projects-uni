export type TunnelState = "ACTIVE" | "INACTIVE" | "CONNECTING" | "DISCONNECTING" | "ERROR" | "UNKNOWN"
export type NativeStatus = "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "DISCONNECTING" | "ERROR" | "UNKNOWN"

export interface VpnStateChangedEvent {
  isConnected: boolean
  tunnelState: TunnelState
  status: NativeStatus
  error?: string
}
