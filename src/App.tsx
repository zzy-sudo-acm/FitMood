import { useEffect, useState } from 'react';
import { BottomTabs } from './components/BottomTabs';
import { TodayPage } from './pages/TodayPage';
import { WardrobePage } from './pages/WardrobePage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { applyUpdate } from './lib/pwa';
import {
  addHistory,
  clearClothing,
  clearHistory,
  loadClothing,
  loadDevMode,
  loadHistory,
  loadSettings,
  loadTheme,
  makeId,
  markWorn,
  resetClothing,
  saveClothing,
  saveDevMode,
  saveHistory,
  saveSettings,
  saveTheme,
  ThemeMode,
} from './lib/storage';
import { ClothingItem, Feedback, OutfitHistory, OutfitInput, OutfitItemRef, Settings, TabKey } from './types';

const THEME_COLORS: Record<ThemeMode, string> = { day: '#f7efe7', night: '#211b22' };

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [clothes, setClothes] = useState<ClothingItem[]>(() => loadClothing());
  const [history, setHistory] = useState<OutfitHistory[]>(() => loadHistory());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [devMode, setDevMode] = useState<boolean>(() => loadDevMode());
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const handler = () => setUpdateReady(true);
    window.addEventListener('fitmood:sw-update', handler);
    return () => window.removeEventListener('fitmood:sw-update', handler);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  }, [theme]);

  const updateTheme = (next: ThemeMode) => {
    setTheme(next);
    saveTheme(next);
  };

  const updateDevMode = (next: boolean) => {
    setDevMode(next);
    saveDevMode(next);
  };

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const persistClothes = (next: ClothingItem[]) => {
    setClothes(next);
    saveClothing(next);
  };

  const saveClothingItem = (item: ClothingItem) => {
    const exists = clothes.some((c) => c.id === item.id);
    persistClothes(exists ? clothes.map((c) => (c.id === item.id ? item : c)) : [item, ...clothes]);
  };

  const deleteClothingItem = (id: string) => persistClothes(clothes.filter((c) => c.id !== id));

  const toggleClean = (item: ClothingItem) =>
    persistClothes(clothes.map((c) => (c.id === item.id ? { ...c, isClean: !c.isClean, updatedAt: Date.now() } : c)));

  const wearOutfit = (items: ClothingItem[], input: OutfitInput, feedback?: Feedback) => {
    const refs: OutfitItemRef[] = items.map((i) => ({ id: i.id, name: i.name, category: i.category, color: i.color }));
    const entry: OutfitHistory = { id: makeId('outfit'), items: refs, input, feedback, createdAt: Date.now() };
    setHistory(addHistory(entry));
    persistClothes(markWorn(clothes, items.map((i) => i.id)));
  };

  const setHistoryFeedback = (id: string, feedback: Feedback) => {
    const next = history.map((h) => (h.id === id ? { ...h, feedback } : h));
    setHistory(next);
    saveHistory(next);
  };

  const handleResetWardrobe = () => persistClothes(resetClothing());
  const handleClearWardrobe = () => persistClothes(clearClothing());
  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="app-shell">
      <main>
        {activeTab === 'today' && (
          <TodayPage
            clothes={clothes}
            history={history}
            settings={settings}
            devMode={devMode}
            onWearOutfit={wearOutfit}
            onGoWardrobe={() => setActiveTab('wardrobe')}
          />
        )}
        {activeTab === 'wardrobe' && (
          <WardrobePage
            clothes={clothes}
            onSave={saveClothingItem}
            onDelete={deleteClothingItem}
            onToggleClean={toggleClean}
          />
        )}
        {activeTab === 'history' && <HistoryPage history={history} onSetFeedback={setHistoryFeedback} />}
        {activeTab === 'settings' && (
          <SettingsPage
            settings={settings}
            theme={theme}
            devMode={devMode}
            onChangeSettings={updateSettings}
            onChangeTheme={updateTheme}
            onChangeDevMode={updateDevMode}
            onResetWardrobe={handleResetWardrobe}
            onClearWardrobe={handleClearWardrobe}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>

      {updateReady && (
        <div className="update-toast" role="status">
          <span>有新版本啦，要不要刷新看看？</span>
          <button type="button" onClick={applyUpdate}>
            刷新
          </button>
        </div>
      )}

      <BottomTabs activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
