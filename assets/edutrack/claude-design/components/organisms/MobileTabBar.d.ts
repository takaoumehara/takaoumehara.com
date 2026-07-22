import * as React from 'react';

/**
 * Mobile bottom navigation: PLAN / DO / REVIEW. On phones the desktop
 * masthead collapses to this bar — square glyph + Oswald label, 3px
 * accent indicator on the active tab, ≥44px hit areas, safe-area aware.
 */
export interface MobileTabBarProps {
  active?: 'plan' | 'do' | 'review';
  onNavigate?: (tab: 'plan' | 'do' | 'review') => void;
  style?: React.CSSProperties;
}
export declare function MobileTabBar(props: MobileTabBarProps): JSX.Element;
