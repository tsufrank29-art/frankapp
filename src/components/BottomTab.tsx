import React from 'react';

type TabKey = 'overview' | 'created' | 'joined';

type Props = {
  active: TabKey;
  onSelect: (key: TabKey) => void;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '🏠 房間' },
  { key: 'created', label: '✏️ 創建' },
  { key: 'joined', label: '⭐ 加入' },
];

export function BottomTab({ active, onSelect }: Props) {
  return (
    <nav className="tab-bar pb-safe-bottom" aria-label="底部分頁">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`tab ${active === tab.key ? 'active' : ''}`}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default BottomTab;
