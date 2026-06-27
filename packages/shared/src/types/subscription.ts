export type SubscriptionStatus = "ACTIVE" | "SUSPENDED" | "EXPIRED" | "CANCELLED"

export interface Subscription {
  id: string
  plan: string
  status: SubscriptionStatus
  expiresAt: string
  maxDevices: number
  devicesActive: number
}
