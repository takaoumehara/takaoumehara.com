import * as React from 'react';

/**
 * The physical index card — the system's core object. Brown square =
 * lesson, green = vitamin; standards code sits in the square's corner,
 * Polaroid-style caption below. Hover lifts -4px, grab-press scale(.95),
 * `dropIn` plays the squash-and-settle landing animation.
 */
export interface LessonCardProps {
  kind?: 'lesson' | 'vitamin';
  /** short caption under the color square, e.g. "TRAITS VS. FEELINGS" */
  label?: React.ReactNode;
  /** standards code shown in the square, e.g. "5R1" */
  code?: string;
  /** md = plan board (96px), sm = calendar (64px) */
  size?: 'md' | 'sm';
  /** faded — already placed on the timeline */
  dimmed?: boolean;
  /** play the et-drop landing animation on mount */
  dropIn?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  style?: React.CSSProperties;
}
export declare function LessonCard(props: LessonCardProps): JSX.Element;
