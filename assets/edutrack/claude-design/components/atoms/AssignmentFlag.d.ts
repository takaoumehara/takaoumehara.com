import * as React from 'react';

/**
 * Orange arrow-shaped flag marking assignment START (points right) or
 * DUE (points left) on a timeline day. Hover grows 1.08, press .95.
 */
export interface AssignmentFlagProps {
  direction?: 'start' | 'due';
  size?: 'sm' | 'md';
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function AssignmentFlag(props: AssignmentFlagProps): JSX.Element;
