import { useState } from 'react';
import { Moon, RotateCcw, Trash2, Wrench } from 'lucide-react';
import { ChipMultiSelect, Segmented } from '../components/inputs';
import {
  coldToleranceLabels,
  coldToleranceOptions,
  recommendPreferenceLabels,
  recommendPreferenceOptions,
  styleTagLabels,
  styleTagOptions,
} from '../lib/clothingOptions';
import { ThemeMode } from '../lib/storage';
import { ColdTolerance, RecommendPreference, Settings, StyleTag } from '../types';
import { APP_VERSION } from '../lib/version';

interface SettingsPageProps {
  settings: Settings;
  theme: ThemeMode;
  devMode: boolean;
  onChangeSettings: (patch: Partial<Settings>) => void;
  onChangeTheme: (theme: ThemeMode) => void;
  onChangeDevMode: (devMode: boolean) => void;
  onResetWardrobe: () => void;
  onClearWardrobe: () => void;
  onClearHistory: () => void;
}

export function SettingsPage({
  settings,
  theme,
  devMode,
  onChangeSettings,
  onChangeTheme,
  onChangeDevMode,
  onResetWardrobe,
  onClearWardrobe,
  onClearHistory,
}: SettingsPageProps) {
  const [message, setMessage] = useState('');

  const notify = (text: string) => setMessage(text);

  const resetWardrobe = () => {
    if (!window.confirm('恢复默认衣橱？现有单品会被默认列表覆盖，无法撤销。')) return;
    onResetWardrobe();
    notify('已恢复默认衣橱。');
  };

  const clearWardrobe = () => {
    if (!window.confirm('清空衣橱？所有单品都会被删除，无法撤销。')) return;
    onClearWardrobe();
    notify('衣橱已清空。');
  };

  const clearHistory = () => {
    if (!window.confirm('清空穿搭历史？记录和反馈都会被抹掉，无法撤销。')) return;
    onClearHistory();
    notify('穿搭历史已清空。');
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">设置</p>
          <h1>调成你喜欢的样子</h1>
        </div>
        <span className="version-pill">v{APP_VERSION}</span>
      </header>

      <section className="settings-section">
        <div className="section-title-row">
          <h2>怕冷程度</h2>
          <span className="hint">{coldToleranceLabels[settings.coldTolerance]}</span>
        </div>
        <Segmented
          options={coldToleranceOptions}
          value={settings.coldTolerance}
          onChange={(value: ColdTolerance) => onChangeSettings({ coldTolerance: value })}
          label={(c) => coldToleranceLabels[c]}
        />
        <small className="field-hint">怕冷会自动给你的搭配多加一点保暖，怕热则更清爽。</small>
      </section>

      <section className="settings-section">
        <div className="section-title-row">
          <h2>推荐偏好</h2>
          <span className="hint">{recommendPreferenceLabels[settings.recommendPreference]}</span>
        </div>
        <Segmented
          options={recommendPreferenceOptions}
          value={settings.recommendPreference}
          onChange={(value: RecommendPreference) => onChangeSettings({ recommendPreference: value })}
          label={(p) => recommendPreferenceLabels[p]}
        />
      </section>

      <section className="settings-section">
        <div className="section-title-row">
          <h2>默认风格偏好</h2>
          <span className="hint">已选 {settings.stylePreference.length}</span>
        </div>
        <ChipMultiSelect
          options={styleTagOptions}
          value={settings.stylePreference as StyleTag[]}
          onChange={(value) => onChangeSettings({ stylePreference: value })}
          label={(t) => styleTagLabels[t]}
          small
        />
      </section>

      <section className="settings-section">
        <div className="theme-toggle-row">
          <div className="theme-copy">
            <b>夜间模式</b>
            <small>柔和暗色，晚上看不刺眼</small>
          </div>
          <button
            type="button"
            className={`bare-switch ${theme === 'night' ? 'is-on' : ''}`}
            role="switch"
            aria-checked={theme === 'night'}
            aria-label="夜间模式"
            onClick={() => onChangeTheme(theme === 'night' ? 'day' : 'night')}
          >
            <Moon size={15} aria-hidden="true" />
            <span className="switch-track" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="settings-section">
        <div className="theme-toggle-row">
          <div className="theme-copy">
            <b>开发者模式</b>
            <small>在推荐卡片里显示打分细节</small>
          </div>
          <button
            type="button"
            className={`bare-switch ${devMode ? 'is-on' : ''}`}
            role="switch"
            aria-checked={devMode}
            aria-label="开发者模式"
            onClick={() => onChangeDevMode(!devMode)}
          >
            <Wrench size={15} aria-hidden="true" />
            <span className="switch-track" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="settings-section">
        <div className="section-title-row">
          <h2>数据管理</h2>
        </div>
        <button type="button" className="settings-button" onClick={resetWardrobe}>
          <RotateCcw size={17} />
          恢复默认衣橱
        </button>
        <button type="button" className="settings-button danger" onClick={clearWardrobe}>
          <Trash2 size={17} />
          清空衣橱
        </button>
        <button type="button" className="settings-button danger" onClick={clearHistory}>
          <Trash2 size={17} />
          清空穿搭历史
        </button>
      </section>

      {message && <div className="toast-line">{message}</div>}
    </div>
  );
}
