import { Text, View, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/brand-logo';
import { Icon } from '@/components/ui/icon';
import { Strings } from '@/constants/strings';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { vpnService } from '@/services/vpnService';
import * as storage from '@/services/storageService';

/** Android only, shown once after the first login: explains the system VPN dialog before it appears. */
export default function VpnPermissionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleAllow = async () => {
    await vpnService.requestVpnPermission(); // shows the system dialog if not granted yet
    await storage.setVpnPermissionSeen();
    router.replace('/(main)/home');
  };

  const borderSubtle = theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: insets.top + (Platform.OS === 'web' ? 40 : 24),
        paddingBottom: insets.bottom + 24,
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top: Logo Box + Title + Subtitle */}
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.background,
              borderWidth: 1,
              borderColor: borderSubtle,
              ...Platform.select({
                ios: {
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: theme.isDark ? 0.35 : 0.12,
                  shadowRadius: 15,
                },
                android: {
                  elevation: 6,
                },
                default: {},
              }),
            }}
          >
            <BrandLogo size={62} variant="neon" isDark={theme.isDark} />
          </View>

          <Text
            style={{
              fontFamily: Figtree.semibold,
              fontSize: 20,
              color: theme.text,
              marginTop: 20,
              textAlign: 'center',
            }}
          >
            {Strings.vpnPermission.title}
          </Text>

          <Text
            style={{
              fontFamily: Figtree.regular,
              fontSize: 14,
              color: theme.textSecondary,
              marginTop: 6,
              paddingHorizontal: 8,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            {Strings.vpnPermission.bodyPrefix}
            <Text style={{ fontFamily: Figtree.semibold, color: theme.text }}>
              {Strings.vpnPermission.bodyOk}
            </Text>
            {Strings.vpnPermission.bodySuffix}
          </Text>
        </View>

        {/* Details Card (Aman + Tanpa iklan) */}
        <View
          style={{
            marginTop: 30,
            paddingHorizontal: 16,
            paddingBottom: 16,
            paddingTop: 2,
            borderRadius: 16,
            backgroundColor: theme.backgroundElement,
            borderWidth: 1,
            borderColor: borderSubtle,
          }}
        >
          {/* Item 1: Aman */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            <View style={{ marginTop: 2 }}>
              <Icon name="shield-check" size={22} color="#22C55E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: theme.text }}>
                {Strings.vpnPermission.secureTitle}
              </Text>
              <Text
                style={{
                  fontFamily: Figtree.regular,
                  fontSize: 12,
                  color: theme.textSecondary,
                  marginTop: 2,
                  lineHeight: 16,
                }}
              >
                {Strings.vpnPermission.secureSubtitle}
              </Text>
            </View>
          </View>

          {/* Item 2: Tanpa iklan */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            <View style={{ marginTop: 2 }}>
              <Icon name="shield-check" size={22} color="#22C55E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: theme.text }}>
                {Strings.vpnPermission.noAdsTitle}
              </Text>
              <Text
                style={{
                  fontFamily: Figtree.regular,
                  fontSize: 12,
                  color: theme.textSecondary,
                  marginTop: 2,
                  lineHeight: 16,
                }}
              >
                {Strings.vpnPermission.noAdsSubtitle}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={{ paddingTop: 16 }}>
        <Button label={Strings.vpnPermission.allow} onPress={handleAllow} />
      </View>
    </View>
  );
}
