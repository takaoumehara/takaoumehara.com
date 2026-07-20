import React from 'react';

export function TextField({
  label, value, onChange, placeholder,
  variant = 'boxed', multiline = false, rows = 4, style,
}) {
  const [focus, setFocus] = React.useState(false);
  const shared = {
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-body)',
    fontSize: variant === 'underline' ? 12.5 : 14,
    color: 'var(--ink)',
    background: variant === 'underline' ? 'transparent' : 'var(--paper-card)',
    outline: 'none',
    borderRadius: 0,
    transition: 'border-color var(--dur-instant) var(--ease-plain)',
    ...(variant === 'underline'
      ? { border: 'none', borderBottom: `1px solid ${focus ? 'var(--accent)' : 'var(--line)'}`, padding: '4px 0' }
      : { border: `1.5px solid ${focus ? 'var(--accent)' : 'var(--line-soft)'}`, padding: '9px 11px' }),
    ...(multiline ? { resize: 'none', lineHeight: 1.5 } : {}),
  };
  const fieldProps = {
    value,
    placeholder,
    onChange: (e) => onChange && onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: shared,
  };
  return (
    <div style={style}>
      {label != null && (
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 11,
          letterSpacing: '1.5px', textTransform: 'uppercase',
          color: 'var(--ink-faint)', marginBottom: 5,
        }}>{label}</div>
      )}
      {multiline ? <textarea rows={rows} {...fieldProps} /> : <input {...fieldProps} />}
    </div>
  );
}
