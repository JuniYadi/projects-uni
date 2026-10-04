// Contract for v2 UI screens (PFN-124..128). Types only — no logic.
// Owner of the state: `connectionStore` (src/stores/connectionStore.ts).

import type { VpnProfile } from '@/types/vpn';

/**
 * The 5 states the Beranda (home) screen renders.
 * Mapping from the store (`status` + `error` + `dropped`) lives in `utils/connection-ui.ts` (`toUiStatus`, PFN-125):
 *   disconnected         → 'idle'
 *   connecting           → 'connecting'   (also 'disconnecting' shown as 'connecting' until stopped)
 *   connected            → 'connected'
 *   disconnected + error → 'failed'       (connect attempt threw)
 *   dropped while connected and kill switch on → 'dropped' (tunnel lost; traffic blocked)
 */
export type ConnectionUiStatus = 'idle' | 'connecting' | 'connected' | 'failed' | 'dropped';

/** What the UI reads from `connectionStore` to render Beranda. */
export interface ConnectionView {
  status: ConnectionUiStatus;
  /** Currently selected location (target of the next connect, or the connected one). */
  location: VpnProfile | null;
}

/** Actions the UI may call. Each maps to a button in the design. */
export interface ConnectionActions {
  /** 'idle' → 'connecting'. Also "Coba lagi" (failed) and "Sambungkan lagi" (dropped). */
  connect: () => Promise<void>;
  /** 'connecting' → 'idle' ("Batal") and 'connected' → 'idle'. */
  disconnect: () => Promise<void>;
  /** "Pakai internet tanpa VPN" (dropped): release the kill switch, go to 'idle'. */
  releaseKillSwitch: () => Promise<void>;
}

/** Location-picking API used by the Lokasi tab and the Beranda location card. */
export interface LocationPicker {
  locations: VpnProfile[];
  selectedId: string | null;
  favoriteIds: string[];
  /** Select a location; does NOT connect by itself. */
  select: (id: string) => void;
  toggleFavorite: (id: string) => void;
}
