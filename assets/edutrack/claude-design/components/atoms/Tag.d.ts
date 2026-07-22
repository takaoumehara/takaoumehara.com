import * as React from 'react';

/**
 * Small Oswald-uppercase label. `outline` for standards codes, `solid` for
 * inline standard chips on agenda items, `chip` for selectable options
 * (grades, subjects). Chips press-compress at scale(.94).
 */
export interface TagProps {
  variant?: 'outline' | 'solid' | 'chip';
  /** chip only — selected fills with accent */
  selected?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Tag(props: TagProps): JSX.Element;
