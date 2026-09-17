import React from 'react';
import { Button } from '../atoms/Button.jsx';

export function TourTip({
  stepLabel, title, text,
  onNext, onBack, onSkip, nextLabel = 'NEXT',
  style,
}) {
  return (
    <div style={{
      width: 320, background: 'var(--paper-frame)', boxShadow: '0 18px 48px rgba(0,0,0,.42)',
      padding: '20px 22px 14px', boxSizing: 'border-box',
      transition: 'all var(--dur-move) var(--ease-settle)', ...style,
    }}>
      {stepLabel && (
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 11,
          letterSpacing: '2px', color: 'var(--accent)',
        }}>{stepLabel}</div>
      )}
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20,
        letterSpacing: '1px', color: 'var(--ink)', marginTop: 4, textTransform: 'uppercase',
      }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55, marginTop: 8 }}>{text}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
        {onSkip && (
          <div onClick={onSkip} style={{
            fontFamily: 'var(--font-editorial)', fontStyle: 'italic',
            fontSize: 13.5, color: 'var(--ink-ghost)', cursor: 'pointer', userSelect: 'none',
          }}>Skip tour</div>
        )}
        <div style={{ flex: 1 }} />
        {onBack && <Button variant="ghost" size="sm" onClick={onBack}>BACK</Button>}
        {onNext && <Button size="sm" onClick={onNext}>{nextLabel}</Button>}
      </div>
    </div>
  );
}

/** Full-viewport spotlight cutout that dims everything except a target rect. */
export function TourSpotlight({ x, y, width, height, style }) {
  return (
    <div style={{
      position: 'fixed', left: x, top: y, width, height,
      zIndex: 60, pointerEvents: 'none',
      boxShadow: '0 0 0 9999px rgba(40,38,32,.45)',
      outline: '3px solid var(--accent)', outlineOffset: 4,
      transition: 'all var(--dur-move) var(--ease-settle)', ...style,
    }} />
  );
}
