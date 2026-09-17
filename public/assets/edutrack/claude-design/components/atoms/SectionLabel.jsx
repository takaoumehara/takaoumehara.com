import React from 'react';

export function SectionLabel({ children, trailing, style }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 12,
      borderBottom: 'var(--rule) solid var(--line)',
      paddingBottom: 6,
      ...style,
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 15,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
      }}>{children}</div>
      {trailing != null && (
        <div style={{
          fontFamily: 'var(--font-editorial)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--ink-ghost)',
        }}>{trailing}</div>
      )}
    </div>
  );
}
