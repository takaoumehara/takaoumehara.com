import React from 'react';

export function CoverageRow({ code, name, taught = 0, planned = 0, target = 4, style }) {
  const blocks = [];
  for (let i = 0; i < target; i++) {
    blocks.push(i < taught ? 'var(--lesson)' : i < taught + planned ? 'var(--planned)' : 'transparent');
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '9px 0', borderBottom: '1px solid var(--line-soft)', ...style,
    }}>
      <div style={{
        width: 60, flex: 'none', fontFamily: 'var(--font-display)',
        fontWeight: 600, fontSize: 18, color: 'var(--ink)',
      }}>{code}</div>
      <div style={{
        flex: 1, fontFamily: 'var(--font-body)', fontSize: 12.5,
        color: 'var(--ink-muted)', lineHeight: 1.35,
      }}>{name}</div>
      <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
        {blocks.map((bg, i) => (
          <div key={i} style={{
            width: 16, height: 16, background: bg,
            border: '1.5px solid var(--line-strong)', boxSizing: 'border-box',
            transition: 'background var(--dur-base) var(--ease-plain)',
          }} />
        ))}
      </div>
      <div style={{
        width: 56, flex: 'none', textAlign: 'right',
        fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--ink-faint)',
      }}>{taught} of {target}</div>
    </div>
  );
}
