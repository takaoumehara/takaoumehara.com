import * as React from 'react';

/**
 * Two-option lesson verdict: WENT WELL (green) / RETEACH (orange).
 * Tapping the active option clears it. One-tap reflection, no forms.
 */
export interface RatingToggleProps {
  value?: 'well' | 'reteach' | null;
  onChange?: (value: 'well' | 'reteach' | null) => void;
  style?: React.CSSProperties;
}
export declare function RatingToggle(props: RatingToggleProps): JSX.Element;
