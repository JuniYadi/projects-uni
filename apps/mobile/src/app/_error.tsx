import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Button } from '@expo/ui';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export default function ErrorScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        This page doesn't exist or encountered an error.
      </Text>
      <Host style={styles.btnWrapper}>
        <Button variant="filled" onPress={() => router.replace('/')} label="Go Home" />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 8 },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  btnWrapper: { width: '100%', marginTop: 16 },
});
