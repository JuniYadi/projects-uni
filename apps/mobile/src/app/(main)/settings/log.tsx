import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DiagnosticLogEntry } from '@/services/diagnosticLogService';
import { diagnosticLogService } from '@/services/diagnosticLogService';

type FilterType = 'all' | 'error' | 'success';

export default function ConnectionLogScreen() {
  const theme = useTheme();
  const [logs, setLogs] = useState<DiagnosticLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    let active = true;
    diagnosticLogService.getLogs().then((data) => {
      if (active) {
        setLogs(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleShare = async () => {
    const report = await diagnosticLogService.getFormattedLogs();
    try {
      await Share.share({
        message: report,
        title: 'UniVPN Log Koneksi',
      });
    } catch {
      // User cancelled
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Bersihkan Log?',
      'Seluruh riwayat diagnostik koneksi di perangkat ini akan dihapus.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await diagnosticLogService.clearLogs();
            setLogs([]);
          },
        },
      ]
    );
  };

  const filteredLogs = logs.filter((l) => {
    if (filter === 'error') return l.level === 'ERROR';
    if (filter === 'success') return l.level === 'SUCCESS';
    return true;
  });

  const latestError = logs.find((l) => l.level === 'ERROR');

  const errorCount = logs.filter((l) => l.level === 'ERROR').length;
  const successCount = logs.filter((l) => l.level === 'SUCCESS').length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 16 }}>
      {/* Filter Tabs */}
      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 14 }}>
        <Pressable
          onPress={() => setFilter('all')}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
            backgroundColor:
              filter === 'all'
                ? theme.isDark
                  ? 'rgba(255, 255, 255, 0.14)'
                  : 'rgba(15, 23, 42, 0.1)'
                : theme.backgroundElement,
          }}
        >
          <Text
            style={{
              fontFamily: Figtree.medium,
              fontSize: 12,
              color: filter === 'all' ? theme.text : theme.textSecondary,
            }}
          >
            Semua ({logs.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('error')}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
            backgroundColor:
              filter === 'error'
                ? theme.isDark
                  ? 'rgba(248, 113, 113, 0.18)'
                  : 'rgba(220, 38, 38, 0.12)'
                : theme.backgroundElement,
            borderWidth: 1,
            borderColor:
              filter === 'error'
                ? theme.isDark
                  ? 'rgba(248, 113, 113, 0.4)'
                  : 'rgba(220, 38, 38, 0.3)'
                : 'transparent',
          }}
        >
          <Text
            style={{
              fontFamily: Figtree.semibold,
              fontSize: 12,
              color: theme.error,
            }}
          >
            Gagal ({errorCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('success')}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
            backgroundColor:
              filter === 'success'
                ? theme.isDark
                  ? 'rgba(34, 197, 94, 0.18)'
                  : 'rgba(22, 163, 74, 0.12)'
                : theme.backgroundElement,
            borderWidth: 1,
            borderColor:
              filter === 'success'
                ? theme.isDark
                  ? 'rgba(34, 197, 94, 0.4)'
                  : 'rgba(22, 163, 74, 0.3)'
                : 'transparent',
          }}
        >
          <Text
            style={{
              fontFamily: Figtree.semibold,
              fontSize: 12,
              color: theme.accent,
            }}
          >
            Berhasil ({successCount})
          </Text>
        </Pressable>
      </View>

      {/* Latest Error Spotlight Card (if exists) */}
      {latestError && filter !== 'success' && (
        <View
          style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 16,
            padding: 14,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: theme.isDark ? 'rgba(248, 113, 113, 0.35)' : 'rgba(220, 38, 38, 0.25)',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.error }} />
              <Text
                style={{
                  fontFamily: Figtree.semibold,
                  fontSize: 11,
                  color: theme.error,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                Gagal Terakhir
              </Text>
            </View>
            <Text style={{ fontFamily: Figtree.regular, fontSize: 11, color: theme.textSecondary }}>
              {latestError.timeFormatted}
            </Text>
          </View>
          <Text style={{ fontFamily: Figtree.semibold, fontSize: 14, color: theme.text }}>
            {latestError.serverName} · {latestError.serverHost}
          </Text>
          <Text style={{ fontFamily: Figtree.regular, fontSize: 13, color: theme.error, marginTop: 4 }}>
            {latestError.summary}
          </Text>
          {latestError.details && (
            <Text style={{ fontFamily: Figtree.regular, fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
              {latestError.details}
            </Text>
          )}
        </View>
      )}

      {/* Log List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : filteredLogs.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon name="info" size={36} color={theme.textSecondary} />
          <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: theme.textSecondary }}>
            Belum ada riwayat log koneksi
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100, gap: 10 }}
          renderItem={({ item }) => {
            const isErr = item.level === 'ERROR';
            const isWarn = item.level === 'WARN';
            const isSucc = item.level === 'SUCCESS';
            const color = isErr ? theme.error : isWarn ? '#F59E0B' : isSucc ? theme.accent : theme.textSecondary;

            return (
              <View
                style={{
                  backgroundColor: theme.backgroundElement,
                  borderRadius: 14,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: theme.backgroundSelected,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} />
                    <Text style={{ fontFamily: Figtree.semibold, fontSize: 12, color }}>
                      [{item.stage}]
                    </Text>
                    <Text style={{ fontFamily: Figtree.medium, fontSize: 13, color: theme.text }}>
                      {item.serverName}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: Figtree.regular, fontSize: 11, color: theme.textSecondary }}>
                    {item.timeFormatted}
                  </Text>
                </View>

                <Text style={{ fontFamily: Figtree.regular, fontSize: 13, color: isErr ? theme.error : theme.text, marginLeft: 13 }}>
                  {item.summary}
                </Text>

                {item.details && (
                  <Text style={{ fontFamily: Figtree.regular, fontSize: 11, color: theme.textSecondary, marginLeft: 13, marginTop: 2 }}>
                    {item.details}
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Floating Bottom Actions */}
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 24,
          gap: 8,
        }}
      >
        <Button label="Salin / Bagikan Laporan Log" onPress={handleShare} />
        {logs.length > 0 && (
          <Pressable onPress={handleClear} style={{ paddingVertical: 4, alignItems: 'center' }}>
            <Text style={{ fontFamily: Figtree.medium, fontSize: 12, color: theme.textSecondary }}>
              Bersihkan Riwayat Log
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
