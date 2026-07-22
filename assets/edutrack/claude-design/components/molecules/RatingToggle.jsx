import React from 'react';

export function RatingToggle({ value = null, onChange, style }) {
  const opts = [
    { key: 'well', label: 'WENT WELL', color: 'var(--vitamin)' },
    { key: 'reteach', label: 'RETEACH', color: 'var(--flag)' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, ...style }}>
      {opts.map((o) => {
        const on = value === o.key;
        return (
          <div
            key={o.key}
            onClick={() => onChange && onChange(on ? null : o.key)}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: '1px',
              padding: '3px 10px',
              cursor: 'pointer',
              userSelect: 'none',
              border: `1.5px solid ${on ? o.color : 'var(--line-strong)'}`,
              background: on ? o.color : 'transparent',
              color: on ? '#fff' : 'var(--ink-faint)',
              transition: 'all var(--dur-instant) var(--ease-plain)',
            }}
          >{o.label}</div>
        );
      })}
    </div>
  );
}
