import * as React from 'react';

/**
 * Primary action control. Oswald 600 uppercase, square corners.
 * Hover: lifts -2px with shadow (solid/flag only). Press: scale(.96).
 */
export interface ButtonProps {
  /** solid = accent blue (default action) · flag = orange (assignment/warning) · outline · ghost (tertiary) */
  variant?: 'solid' | 'flag' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
