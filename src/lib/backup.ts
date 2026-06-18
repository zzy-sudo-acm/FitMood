import { APP_VERSION } from './version';
import { normalizeClothingList, normalizeHistory, normalizeSettings } from './storage';
import { ClothingItem, OutfitHistory, Settings } from '../types';

export const BACKUP_SCHEMA_VERSION = 1;

export interface FitMoodBackup {
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  appVersion: string;
  exportedAt: string;
  clothes: ClothingItem[];
  history: OutfitHistory[];
  settings: Settings;
}

export type BackupImportResult =
  | { ok: true; backup: FitMoodBackup }
  | { ok: false; error: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const readText = (file: Blob): Promise<string> => {
  if ('text' in file && typeof file.text === 'function') return file.text();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('读取备份文件失败。'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsText(file);
  });
};

export const exportBackup = (
  clothes: ClothingItem[],
  history: OutfitHistory[],
  settings: Settings,
  exportedAt = new Date().toISOString()
): FitMoodBackup => ({
  schemaVersion: BACKUP_SCHEMA_VERSION,
  appVersion: APP_VERSION,
  exportedAt,
  clothes: normalizeClothingList(clothes),
  history: normalizeHistory(history),
  settings: normalizeSettings(settings),
});

export const downloadBackup = (backup: FitMoodBackup, filename?: string) => {
  const safeDate = backup.exportedAt.slice(0, 10);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `fitmood-backup-${safeDate}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const normalizeBackup = (raw: unknown): FitMoodBackup => {
  if (!isObject(raw)) throw new Error('备份文件格式不正确。');
  if (raw.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error('备份版本不匹配，请使用 FitMood v0.3.1 或更新版本导出的备份。');
  }
  if (!Array.isArray(raw.clothes)) throw new Error('备份里缺少衣橱数据。');
  if (!Array.isArray(raw.history)) throw new Error('备份里缺少历史数据。');

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: typeof raw.appVersion === 'string' && raw.appVersion ? raw.appVersion : 'unknown',
    exportedAt:
      typeof raw.exportedAt === 'string' && Number.isFinite(Date.parse(raw.exportedAt))
        ? raw.exportedAt
        : new Date().toISOString(),
    clothes: normalizeClothingList(raw.clothes),
    history: normalizeHistory(raw.history),
    settings: normalizeSettings(raw.settings),
  };
};

export const importBackup = (source: unknown): BackupImportResult => {
  try {
    const raw = typeof source === 'string' ? JSON.parse(source) : source;
    return { ok: true, backup: normalizeBackup(raw) };
  } catch (error) {
    const message = error instanceof SyntaxError ? '备份文件不是有效 JSON。' : error instanceof Error ? error.message : '导入备份失败。';
    return { ok: false, error: message };
  }
};

export const parseBackupFile = async (file: Blob): Promise<BackupImportResult> => {
  try {
    return importBackup(await readText(file));
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : '读取备份文件失败。' };
  }
};
