import * as React from 'react';

/**
 * One standard's coverage: code, description, and target-count blocks —
 * brown = taught, tan = planned, empty = not yet. Computed from the
 * plan; never hand-entered.
 */
export interface CoverageRowProps {
  /** standards code, e.g. "5R1" */
  code: string;
  /** standard description */
  name: string;
  taught?: number;
  planned?: number;
  /** total blocks to render (the coverage goal) */
  target?: number;
  style?: React.CSSProperties;
}
export declare function CoverageRow(props: CoverageRowProps): JSX.Element;
