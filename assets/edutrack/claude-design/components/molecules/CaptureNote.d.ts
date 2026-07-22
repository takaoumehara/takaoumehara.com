import * as React from 'react';

/**
 * Mid-lesson conference note for one student. Drops in with the landing
 * animation when created (tap a roster name to spawn one).
 */
export interface CaptureNoteProps {
  /** student name, e.g. "DeShawn W." */
  student: string;
  value?: string;
  onChange?: (value: string) => void;
  onRemove?: () => void;
  placeholder?: string;
  style?: React.CSSProperties;
}
export declare function CaptureNote(props: CaptureNoteProps): JSX.Element;
