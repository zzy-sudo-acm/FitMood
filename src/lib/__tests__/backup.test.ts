import { describe, expect, it } from 'vitest';
import { exportBackup, importBackup } from '../backup';
import { normalizeClothing } from '../storage';
import { OutfitHistory, Settings } from '../../types';

const settings: Settings = {
  coldTolerance: 'normal',
  stylePreference: ['minimal'],
  recommendPreference: 'safe',
};

describe('backup', () => {
  it('可以导出 clothes/history/settings', () => {
    const clothes = [
      normalizeClothing({
        id: 'c1',
        name: '白色短袖',
        category: 'top',
        color: 'white',
        imageThumb: 'data:image/webp;base64,abc',
      }),
    ];
    const history: OutfitHistory[] = [
      {
        id: 'h1',
        items: [{ id: 'c1', name: '白色短袖', category: 'top', color: 'white', imageThumb: 'data:image/webp;base64,abc' }],
        input: { tempFeel: 'comfortable', weather: 'sunny', occasion: 'casual', moods: [], activity: 'normal' },
        feedback: 'like',
        createdAt: 1,
      },
    ];

    const backup = exportBackup(clothes, history, settings, '2026-06-18T08:00:00.000Z');

    expect(backup.clothes).toHaveLength(1);
    expect(backup.history).toHaveLength(1);
    expect(backup.settings).toEqual(settings);
  });

  it('备份文件包含 appVersion、schemaVersion、exportedAt', () => {
    const backup = exportBackup([], [], settings, '2026-06-18T08:00:00.000Z');

    expect(backup.appVersion).toBe('0.3.1');
    expect(backup.schemaVersion).toBe(1);
    expect(backup.exportedAt).toBe('2026-06-18T08:00:00.000Z');
  });

  it('importBackup 对非法 JSON 失败时不会崩溃', () => {
    const result = importBackup('{ bad json');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('JSON');
  });

  it('importBackup 对旧衣物数据会 normalize', () => {
    const result = importBackup({
      schemaVersion: 1,
      appVersion: '0.2.0',
      exportedAt: '2026-06-18T08:00:00.000Z',
      clothes: [{ id: 'old', name: '旧白T', category: 'top', color: 'white' }],
      history: [
        {
          items: [{ id: 'old', name: '旧白T', category: 'top', color: 'white' }],
          input: { tempFeel: 'hot', weather: 'sunny', occasion: 'casual', moods: ['easy'], activity: 'normal' },
        },
      ],
      settings: { coldTolerance: '???', recommendPreference: 'safe', stylePreference: ['minimal', 'xxx'] },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.clothes[0].pattern).toBe('solid');
      expect(result.backup.clothes[0].colorProfile.mainColor).toBe('white');
      expect(result.backup.history[0].input.moods).toEqual(['easy']);
      expect(result.backup.settings.coldTolerance).toBe('normal');
      expect(result.backup.settings.stylePreference).toEqual(['minimal']);
    }
  });
});
