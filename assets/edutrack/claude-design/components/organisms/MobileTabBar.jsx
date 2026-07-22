import React from 'react';

export function MobileTabBar({ active = 'plan', onNavigate, style }) {
  const tabs = [
    { key: 'plan', label: 'PLAN' },
    { key: 'do', label: 'DO' },
    { key: 'review', label: 'REVIEW' },
  ];
  return (
    <div style={{
      display: 'flex',
      background: 'var(--paper-frame)',
      borderTop: '2px solid var(--line)',
      height: 'var(--m-tabbar-h)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      ...style,
    }}>
      {tabs.map((t) => {
        const on = active === t.key;
        return (
          <div
            key={t.key}
            onClick={() => onNavigate && onNavigate(t.key)}
            style={{
              flex: 1,
              minHeight: 'var(--tap-min)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              cursor: 'pointer',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute', top: -2, left: '22%', right: '22%', height: 3,
              background: on ? 'var(--accent)' : 'transparent',
              transition: 'background var(--dur-instant) var(--ease-plain)',
            }} />
            <div style={{
              width: 12, height: 12,
              background: on ? 'var(--accent)' : 'transparent',
              border: `2px solid ${on ? 'var(--accent)' : 'var(--ink-ghost)'}`,
              boxSizing: 'border-box',
              transition: 'all var(--dur-instant) var(--ease-plain)',
            }} />
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1.5px', color: on ? 'var(--accent)' : 'var(--ink-faint)',
              transition: 'color var(--dur-instant) var(--ease-plain)',
            }}>{t.label}</div>
          </div>
        );
      })}
    </div>
  );
}
