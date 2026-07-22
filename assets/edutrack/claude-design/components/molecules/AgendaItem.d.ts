import * as React from 'react';

export interface AgendaPhase {
  /** minutes, as a string, e.g. "8" */
  min: string;
  /** phase name, e.g. "TEACH" */
  name: string;
  /** one-line note */
  note?: string;
}

/**
 * One row of the teaching day's run-of-show: time range, color swatch,
 * title/description, standard tag, and the DoneCheck. Expands to reveal
 * the teaching point and a phase-by-phase mini lesson plan.
 */
export interface AgendaItemProps {
  /** clock range, e.g. "9:00 – 9:45" */
  time?: string;
  title: string;
  desc?: string;
  kind?: 'lesson' | 'vitamin';
  /** standard tag text, e.g. "5R1 · Inference & Evidence" */
  std?: string;
  /** e.g. "45 min" */
  durationLabel?: string;
  done?: boolean;
  onToggleDone?: (done: boolean) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
  phases?: AgendaPhase[];
  /** italic Garamond quote shown when expanded */
  teachingPoint?: string;
  style?: React.CSSProperties;
}
export declare function AgendaItem(props: AgendaItemProps): JSX.Element;
