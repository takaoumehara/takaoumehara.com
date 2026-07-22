import * as React from 'react';

/**
 * Ruled section heading: Oswald uppercase over a 2px line, with an
 * optional italic Garamond aside on the right. The standard way to
 * head any sidebar or panel section.
 */
export interface SectionLabelProps {
  children?: React.ReactNode;
  /** italic editorial aside, right-aligned on the same rule */
  trailing?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function SectionLabel(props: SectionLabelProps): JSX.Element;
