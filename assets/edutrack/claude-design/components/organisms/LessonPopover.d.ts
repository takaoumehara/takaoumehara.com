import * as React from 'react';

export interface PeerNote {
  /** quoted note text */
  text: string;
  /** attribution, e.g. "Ms. Alvarez · Rm 214" */
  who: string;
}

/**
 * The flipped-over lesson card: a Polaroid-like detail panel with the
 * lesson's color as the photo area (materials, duration, description,
 * standard, peer notes) and the title as the caption below. Enters with
 * et-pop. Position it yourself (it's the popover body, not the anchor).
 */
export interface LessonPopoverProps {
  title: string;
  kind?: 'lesson' | 'vitamin';
  materials?: string[];
  /** e.g. "45 minutes" */
  duration?: string;
  description?: string;
  /** e.g. "5R1 — Inference & Evidence" */
  standard?: string;
  notes?: PeerNote[];
  /** shows the orange REMOVE action */
  onRemove?: () => void;
  style?: React.CSSProperties;
}
export declare function LessonPopover(props: LessonPopoverProps): JSX.Element;
