import React from 'react';

export function Button({ variant = 'solid', size = 'md', disabled = false, children, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const pad = { sm: '7px 16px', md: '10px 24px', lg: '13px 30px' }[size];
  const fontSize = { sm: 12, md: 14, lg: 15 }[size];
  const variants = {
    solid:   { background: 'var(--accent)', color: '#fff', border: 'none' },
    flag:    { background: 'var(--flag)', color: '#fff', border: 'none' },
    outline: { background: 'transparent', color: 'var(--accent)', border: '2px solid var(--accent)' },
    ghost:   { background: 'transparent', color: 'var(--ink-faint)', border: 'none' },
  };
  const lifts = variant === 'solid' || variant === 'flag';
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        lineHeight: 1.2,
        padding: pad,
        cursor: disabled ? 'default' : 'pointer',
        userSelect: 'none',
        borderRadius: 0,
        opacity: disabled ? .45 : 1,
        transition: 'transform var(--dur-fast) var(--ease-settle), box-shadow var(--dur-fast) var(--ease-settle)',
        transform: press && !disabled ? 'scale(.96)' : hover && !disabled ? 'translateY(-2px)' : 'none',
        boxShadow: hover && !disabled && lifts ? '0 6px 16px rgba(0,0,0,.25)' : 'none',
        ...variants[variant],
        ...style,
      }}
    >{children}</button>
  );
}
