import * as React from 'react';

/**
 * Desktop masthead: the giant PLAN | DO | REVIEW wordmark-as-navigation
 * (active tab is accent, others gray), CALENDAR / ALL UNITS utilities,
 * and the identity + school-year metadata line beneath.
 */
export interface AppHeaderProps {
  active?: 'plan' | 'do' | 'review';
  onNavigate?: (tab: 'plan' | 'do' | 'review') => void;
  /** uppercase identity line, e.g. "MS. RIVERA · GRADE 5 ELA · ROOM 214" */
  identity?: React.ReactNode;
  /** italic metadata, e.g. "School Year 2026–27 · Week 2 of 38" */
  meta?: React.ReactNode;
  calendarOpen?: boolean;
  onToggleCalendar?: () => void;
  unitsOpen?: boolean;
  onToggleUnits?: () => void;
  style?: React.CSSProperties;
}
export declare function AppHeader(props: AppHeaderProps): JSX.Element;
