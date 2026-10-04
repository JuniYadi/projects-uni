import type { ConnectionUiStatus } from '@/types/connection';
import type { ConnectionStatus } from '@/types/vpn';

/** connectionStore (status + error + dropped) → the 5 states Beranda renders. */
export function toUiStatus(s: { status: ConnectionStatus; error: string | null; dropped: boolean }): ConnectionUiStatus {
  if (s.status === 'connecting' || s.status === 'disconnecting') return 'connecting';
  if (s.status === 'connected') return 'connected';
  if (s.dropped) return 'dropped';
  return s.error ? 'failed' : 'idle';
}
