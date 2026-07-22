import React from 'react';

export function CaptureNote({ student, value, onChange, onRemove, placeholder = 'What did you notice? Next step…', style }) {
  return (
    <div style={{
      background: 'var(--paper-card)',
      border: '1px solid var(--line-soft)',
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      animation: 'et-drop var(--dur-drop) var(--ease-settle)',
      ...style,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 12,
          letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-muted)',
        }}>{student}</span>
        {onRemove && (
          <span
            onClick={onRemove}
            style={{ cursor: 'pointer', color: 'var(--line-strong)', fontSize: 15, lineHeight: 1, userSelect: 'none' }}
          >×</span>
        )}
      </div>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={{
          border: 'none', borderBottom: '1px solid var(--line-faint)',
          background: 'transparent', fontSize: 12.5, padding: '3px 0',
          outline: 'none', fontFamily: 'var(--font-body)', color: 'var(--ink)',
        }}
      />
    </div>
  );
}
