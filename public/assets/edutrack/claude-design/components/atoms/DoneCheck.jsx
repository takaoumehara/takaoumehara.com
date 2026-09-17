import React from 'react';

export function DoneCheck({ done = false, onToggle, size = 36, style }) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onToggle && onToggle(!done); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        flex: 'none',
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2.5px solid ${done ? 'var(--vitamin)' : 'var(--line-strong)'}`,
        background: done ? 'var(--vitamin)' : 'transparent',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * .47,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all var(--dur-fast) var(--ease-plain)',
        transform: press ? 'scale(.85)' : hover ? 'scale(1.1)' : 'none',
        ...style,
      }}
    >
      {done ? <span style={{ animation: 'et-check var(--dur-drop) var(--ease-reward)' }}>✓</span> : null}
    </div>
  );
}
