import React, { ReactNode } from 'react';
import BottomTab from '../components/BottomTab';

type Props = {
  activeTab: 'overview' | 'created' | 'joined';
  onTabChange: (key: 'overview' | 'created' | 'joined') => void;
  children: ReactNode;
};

export function PageLayout({ activeTab, onTabChange, children }: Props) {
  return (
    <div className="page-layout app-shell">
      <div className="page-layout__content pb-safe-bottom">{children}</div>
      <BottomTab active={activeTab} onSelect={onTabChange} />
    </div>
  );
}

export default PageLayout;
