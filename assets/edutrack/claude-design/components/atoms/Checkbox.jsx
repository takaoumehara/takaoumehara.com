import React from 'react';

export function Checkbox({ checked = false, onChange, label, strike = false, style }) {
  return (
    <div
      onClick={() => onChange && onChange(!checked)}
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        padding: '5px 0',
        minHeight: 24,
        ...style,
      }}
    >
      <div style={{
        flex: 'none',
        width: 17,
        height: 17,
        border: '2px solid var(--ink-faint)',
        background: checked ? 'var(--vitamin)' : 'transparent',
        color: '#fff',
        fontSize: 11,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background var(--dur-instant) var(--ease-plain)',
      }}>
        {checked ? <span style={{ animation: 'et-check var(--dur-drop) var(--ease-reward)' }}>✓</span> : null}
      </div>
      {label != null && (
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: checked && strike ? 'var(--ink-ghost)' : 'var(--ink)',
          textDecoration: checked && strike ? 'line-through' : 'none',
          transition: 'color var(--dur-instant) var(--ease-plain)',
        }}>{label}</div>
      )}
    </div>
  );
}
