import { useProfileStore } from '@/stores/profileStore';
import type { LocationPicker } from '@/types/connection';

/** LocationPicker contract (types/connection.ts) backed by profileStore. WireGuard only: OpenVPN cannot connect yet. */
export function useLocationPicker(): LocationPicker {
  const profiles = useProfileStore((s) => s.profiles);
  const selectedId = useProfileStore((s) => s.selectedProfileId);
  const favoriteIds = useProfileStore((s) => s.favoriteIds);
  const setSelected = useProfileStore((s) => s.setSelectedProfileId);
  const toggleFavorite = useProfileStore((s) => s.toggleFavorite);
  return {
    locations: profiles.filter((p) => p.protocol === 'wireguard'),
    selectedId,
    favoriteIds,
    select: (id) => void setSelected(id),
    toggleFavorite,
  };
}
