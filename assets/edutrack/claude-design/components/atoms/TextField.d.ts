import * as React from 'react';

/**
 * Text input with Oswald micro-label. `boxed` for forms (onboarding),
 * `underline` for in-context jotting (reflections, capture notes).
 * Focus turns the border accent — the only focus treatment in the system.
 */
export interface TextFieldProps {
  label?: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  variant?: 'boxed' | 'underline';
  multiline?: boolean;
  rows?: number;
  style?: React.CSSProperties;
}
export declare function TextField(props: TextFieldProps): JSX.Element;
