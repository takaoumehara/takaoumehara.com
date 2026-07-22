import React from 'react';

export function LessonCard({
  kind = 'lesson', label, code, size = 'md',
  dimmed = false, dropIn = false, onClick, onPointerDown, style,
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const fill = dimmed
    ? (kind === 'vitamin' ? 'var(--vitamin-dim)' : 'var(--lesson-dim)')
    : (kind === 'vitamin' ? 'var(--vitamin)' : 'var(--lesson)');
  const s = size === 'sm'
    ? { w: 'var(--card-w-sm)', pad: '4px 4px 1px', font: 8.5, codeFont: 8 }
    : { w: 'var(--card-w)', pad: '7px 7px 3px', font: 10, codeFont: 10 };
  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        width: s.w,
        background: 'var(--paper-card)',
        padding: s.pad,
        boxShadow: hover ? 'var(--shadow-raise)' : 'var(--shadow-card)',
        cursor: onPointerDown ? 'grab' : onClick ? 'pointer' : 'default',
        touchAction: 'none',
        boxSizing: 'border-box',
        userSelect: 'none',
        transition: 'transform var(--dur-fast) var(--ease-plain), box-shadow var(--dur-fast) var(--ease-plain)',
        transform: press ? 'scale(.95)' : hover ? 'translateY(-4px)' : 'none',
        animation: dropIn ? 'et-drop var(--dur-drop) var(--ease-settle)' : 'none',
        ...style,
      }}
    >
      <div style={{
        width: '100%',
        aspectRatio: '1',
        background: fill,
        transition: 'background var(--dur-base) var(--ease-plain)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: 5,
        boxSizing: 'border-box',
      }}>
        {code ? (
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: s.codeFont,
            letterSpacing: '.5px', color: 'rgba(255,255,255,.85)',
          }}>{code}</span>
        ) : null}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: s.font,
        letterSpacing: '.4px', textTransform: 'uppercase', textAlign: 'center',
        color: dimmed ? 'var(--line-strong)' : 'var(--ink-faint)',
        padding: '4px 0 3px', lineHeight: 1.2, minHeight: size === 'sm' ? 0 : 24,
        whiteSpace: size === 'sm' ? 'nowrap' : 'normal',
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{label}</div>
    </div>
  );
}
