import React from 'react';

export function AssignmentFlag({ direction = 'start', size = 'md', onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const isStart = direction === 'start';
  const s = size === 'sm'
    ? { word: 12, cap: 6.5, pad: isStart ? '2px 15px 3px 6px' : '2px 6px 3px 15px' }
    : { word: 13, cap: 6.5, pad: isStart ? '4px 16px 5px 7px' : '4px 7px 5px 16px' };
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: 'inline-block',
        background: 'var(--flag)',
        color: '#fff',
        clipPath: isStart
          ? 'polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%)'
          : 'polygon(20% 0, 100% 0, 100% 100%, 20% 100%, 0 50%)',
        padding: s.pad,
        textAlign: isStart ? 'left' : 'right',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        filter: 'drop-shadow(2px 3px 2px rgba(0,0,0,.25))',
        transition: 'transform var(--dur-instant) var(--ease-plain)',
        transform: press ? 'scale(.95)' : hover && onClick ? 'scale(1.08)' : 'none',
        ...style,
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: s.cap, letterSpacing: '.4px' }}>ASSIGNMENT</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: s.word,
        letterSpacing: isStart ? '1px' : '1.5px', lineHeight: 1,
      }}>{isStart ? 'START' : 'D U E'}</div>
    </div>
  );
}
