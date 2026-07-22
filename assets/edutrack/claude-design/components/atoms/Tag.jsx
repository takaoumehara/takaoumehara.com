import React from 'react';

export function Tag({ children, variant = 'outline', selected = false, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const interactive = !!onClick;
  const looks = {
    outline: { border: '1.5px solid var(--line-strong)', background: 'transparent', color: 'var(--ink)' },
    solid:   { border: '1.5px solid var(--ink-faint)', background: 'var(--ink-faint)', color: '#fff' },
    chip: selected
      ? { border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' }
      : { border: '1.5px solid var(--line-soft)', background: 'var(--paper-card)', color: 'var(--ink-muted)' },
  };
  return (
    <span
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => interactive && setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: 12,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        padding: '3px 10px',
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'all var(--dur-instant) var(--ease-plain)',
        transform: press ? 'scale(.94)' : 'none',
        ...(interactive && hover && variant === 'chip' && !selected ? { borderColor: 'var(--ink-faint)' } : {}),
        ...looks[variant],
        ...style,
      }}
    >{children}</span>
  );
}
