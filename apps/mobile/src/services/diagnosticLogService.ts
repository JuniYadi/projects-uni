import * as SecureStore from 'expo-secure-store';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
export type LogStage = 'CONFIG' | 'DNS' | 'HANDSHAKE' | 'TUNNEL_UP' | 'DISCONNECT';

export interface DiagnosticLogEntry {
  id: string;
  timestamp: number;
  timeFormatted: string;
  level: LogLevel;
  stage: LogStage;
  serverName: string;
  serverHost: string;
  summary: string;
  details?: string;
}

export interface DiagnosticStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

const STORAGE_KEY = 'univpn_diagnostic_logs';
const MAX_LOG_ENTRIES = 50;

function formatTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${d}/${m} ${h}:${min}:${s}`;
}

const defaultStorage: DiagnosticStorage = {
  getItem: (k) => SecureStore.getItemAsync(k),
  setItem: (k, v) => SecureStore.setItemAsync(k, v),
  removeItem: (k) => SecureStore.deleteItemAsync(k),
};

export function createDiagnosticLogService(storage: DiagnosticStorage = defaultStorage) {
  return {
    /**
     * Append a new diagnostic log entry and persist it to device storage (rolling FIFO, max 50).
     * Note: No network requests are made; all logs remain local on device.
     */
    async recordLog(entry: {
      level: LogLevel;
      stage: LogStage;
      serverName: string;
      serverHost: string;
      summary: string;
      details?: string;
    }): Promise<DiagnosticLogEntry> {
      const now = new Date();
      const newEntry: DiagnosticLogEntry = {
        id: `log_${now.getTime()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now.getTime(),
        timeFormatted: formatTime(now),
        ...entry,
      };

      try {
        const existing = await this.getLogs();
        const updated = [newEntry, ...existing].slice(0, MAX_LOG_ENTRIES);
        await storage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage failure must not crash the connection lifecycle
      }

      return newEntry;
    },

    /**
     * Retrieve all persisted diagnostic log entries from local storage.
     */
    async getLogs(): Promise<DiagnosticLogEntry[]> {
      try {
        const raw = await storage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as DiagnosticLogEntry[];
      } catch {
        return [];
      }
    },

    /**
     * Retrieve the most recent failure entry (level === 'ERROR').
     * Useful for the "Gagal tersambung" screen and log inspection sheet.
     */
    async getLatestFailure(): Promise<DiagnosticLogEntry | null> {
      const logs = await this.getLogs();
      return logs.find((l) => l.level === 'ERROR') ?? null;
    },

    /**
     * Format all logs into a clean, human-readable plaintext report
     * ready for copying to clipboard or sending to customer support.
     */
    async getFormattedLogs(): Promise<string> {
      const logs = await this.getLogs();
      if (logs.length === 0) return 'Belum ada riwayat log koneksi.';

      const lines = [
        '=== UniVPN Diagnostic Connection Report ===',
        `Total Log: ${logs.length} entri`,
        `Tanggal Laporan: ${new Date().toLocaleString('id-ID')}`,
        '-------------------------------------------',
      ];

      for (const log of logs) {
        const tag = `[${log.level}] [${log.stage}] ${log.timeFormatted}`;
        lines.push(`${tag} · ${log.serverName} (${log.serverHost})`);
        lines.push(`  Status : ${log.summary}`);
        if (log.details) {
          lines.push(`  Detail : ${log.details}`);
        }
        lines.push('');
      }

      return lines.join('\n');
    },

    /**
     * Clear all persisted diagnostic logs.
     */
    async clearLogs(): Promise<void> {
      try {
        await storage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    },
  };
}

export const diagnosticLogService = createDiagnosticLogService();
