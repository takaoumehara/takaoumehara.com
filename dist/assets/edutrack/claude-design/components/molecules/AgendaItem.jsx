import React from 'react';
import { DoneCheck } from '../atoms/DoneCheck.jsx';
import { Tag } from '../atoms/Tag.jsx';

export function AgendaItem({
  time, title, desc, kind = 'lesson', std, durationLabel,
  done = false, onToggleDone,
  expanded = false, onToggleExpand, phases = [], teachingPoint,
  style,
}) {
  return (
    <div style={{ background: 'var(--paper-inset)', border: '1px solid var(--line-soft)', ...style }}>
      <div
        onClick={onToggleExpand}
        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', cursor: onToggleExpand ? 'pointer' : 'default' }}
      >
        <div style={{
          width: 96, flex: 'none', fontFamily: 'var(--font-display)',
          fontWeight: 500, fontSize: 16, color: 'var(--ink-muted)', lineHeight: 1.3,
        }}>{time}</div>
        <div style={{ flex: 'none', background: 'var(--paper-card)', padding: 4, boxShadow: '0 1px 4px rgba(0,0,0,.18)' }}>
          <div style={{ width: 40, height: 40, background: kind === 'vitamin' ? 'var(--vitamin)' : 'var(--lesson)' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17,
            letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--ink)',
          }}>{title}</div>
          {desc && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.4 }}>{desc}</div>}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {std && <Tag variant="solid">{std}</Tag>}
            {durationLabel && <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: 'var(--ink-ghost)' }}>{durationLabel}</span>}
            {onToggleExpand && (
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '1px', color: 'var(--ink-ghost)',
              }}>{expanded ? 'CLOSE ⌄' : 'LESSON PLAN ›'}</span>
            )}
          </div>
        </div>
        {onToggleDone && <DoneCheck done={done} onToggle={onToggleDone} />}
      </div>
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--line-soft)', padding: '14px 16px 16px 128px',
          display: 'flex', flexDirection: 'column', gap: 12, animation: 'et-fade var(--dur-base) var(--ease-plain)',
        }}>
          {teachingPoint && (
            <div style={{
              fontFamily: 'var(--font-editorial)', fontStyle: 'italic',
              fontSize: 16, color: 'var(--text-body)', lineHeight: 1.4,
            }}>“{teachingPoint}”</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {phases.map((ph, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <div style={{
                  width: 52, flex: 'none', fontFamily: 'var(--font-display)', fontWeight: 500,
                  fontSize: 12, color: 'var(--ink-ghost)', textAlign: 'right',
                }}>{ph.min} MIN</div>
                <div style={{
                  flex: 'none', fontFamily: 'var(--font-display)', fontWeight: 500,
                  fontSize: 12.5, letterSpacing: '1px', color: 'var(--ink)',
                }}>{ph.name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-faint)' }}>{ph.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
