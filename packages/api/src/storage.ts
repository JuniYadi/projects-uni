export interface AuthStorage {
  getToken(): Promise<string | null>
  setToken(token: string): Promise<void>
  removeToken(): Promise<void>

  getExpiresAt(): Promise<string | null>
  setExpiresAt(expiresAt: string): Promise<void>
  removeExpiresAt(): Promise<void>

  getSubscriptionId(): Promise<string | null>
  setSubscriptionId(id: string): Promise<void>
  removeSubscriptionId(): Promise<void>

  getFingerprint(): Promise<string | null>
  setFingerprint(fp: string): Promise<void>

  clearAll(): Promise<void>
}
