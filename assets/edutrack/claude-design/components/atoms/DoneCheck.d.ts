import * as React from 'react';

/**
 * The "taught it" circle. Empty ring until tapped; fills green and the
 * checkmark pops in with the reward easing (et-check). The system's
 * primary celebration moment — use once per completable item.
 */
export interface DoneCheckProps {
  done?: boolean;
  onToggle?: (done: boolean) => void;
  /** diameter in px (default 36; keep ≥44 tap area on mobile via padding) */
  size?: number;
  style?: React.CSSProperties;
}
export declare function DoneCheck(props: DoneCheckProps): JSX.Element;
