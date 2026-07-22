import * as React from 'react';

/**
 * Square checkbox with green fill and popping checkmark (et-check).
 * `strike` crosses out the label when checked — used for prep checklists.
 */
export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  /** strike through the label when checked (materials-to-prep pattern) */
  strike?: boolean;
  style?: React.CSSProperties;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
