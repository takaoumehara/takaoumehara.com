import * as React from 'react';

/**
 * Guided-tour tooltip (paper sheet with step label, title, body, and
 * Skip/Back/Next). Pair with TourSpotlight, which dims the page except
 * a target rect; both glide between steps with the settle easing.
 */
export interface TourTipProps {
  /** e.g. "STEP 1 OF 5" */
  stepLabel?: string;
  title: string;
  text: string;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  style?: React.CSSProperties;
}
export declare function TourTip(props: TourTipProps): JSX.Element;

/** Spotlight cutout: dims everything except the target rect. */
export interface TourSpotlightProps {
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  style?: React.CSSProperties;
}
export declare function TourSpotlight(props: TourSpotlightProps): JSX.Element;
