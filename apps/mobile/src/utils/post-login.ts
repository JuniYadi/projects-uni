import { Platform } from 'react-native';
import * as storage from '@/services/storageService';

/** Where to go after a successful login: Android's first run explains the VPN permission first. */
export async function routeAfterLogin() {
  if (Platform.OS === 'android' && !(await storage.getVpnPermissionSeen())) {
    return '/(auth)/vpn-permission' as const;
  }
  return '/(main)/home' as const;
}
