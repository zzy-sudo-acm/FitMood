import { Clock4, Settings, Shirt, Sparkles } from 'lucide-react';
import { TabKey } from '../types';
import { tabLabels } from '../lib/clothingOptions';

interface BottomTabsProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

const icons = {
  today: Sparkles,
  wardrobe: Shirt,
  history: Clock4,
  settings: Settings,
};

const tabs: TabKey[] = ['today', 'wardrobe', 'history', 'settings'];

export function BottomTabs({ activeTab, onChange }: BottomTabsProps) {
  return (
    <nav className="bottom-tabs" aria-label="底部导航">
      {tabs.map((tab) => {
        const Icon = icons[tab];
        const active = activeTab === tab;
        return (
          <button
            key={tab}
            className={`tab-button ${active ? 'is-active' : ''}`}
            type="button"
            onClick={() => onChange(tab)}
            aria-label={tabLabels[tab]}
            aria-current={active ? 'page' : undefined}
            title={tabLabels[tab]}
          >
            <Icon size={21} strokeWidth={2.1} />
            <span>{tabLabels[tab]}</span>
          </button>
        );
      })}
    </nav>
  );
}
