import React from 'react';

export function LessonPopover({
  title, kind = 'lesson', materials = [], duration, description, standard,
  notes = [], onRemove, style,
}) {
  const fill = kind === 'vitamin' ? 'var(--vitamin)' : 'var(--lesson)';
  const h = (t) => (
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, letterSpacing: '1.8px' }}>{t}</div>
  );
  return (
    <div style={{
      width: 290, background: 'var(--paper-card)', padding: '10px 10px 0',
      boxShadow: 'var(--shadow-pop)', animation: 'et-pop var(--dur-base) var(--ease-settle)',
      boxSizing: 'border-box', ...style,
    }}>
      <div style={{
        background: fill, color: 'var(--on-color)', padding: '16px 16px 14px',
        display: 'flex', flexDirection: 'column', gap: 11, minHeight: 280, boxSizing: 'border-box',
      }}>
        <div>
          {h('MATERIALS')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
            {materials.map((m, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, lineHeight: 1.45, opacity: .92 }}>— {m}</div>
            ))}
          </div>
        </div>
        {duration && (
          <div>
            {h('DURATION')}
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, marginTop: 3, opacity: .92 }}>{duration}</div>
          </div>
        )}
        {description && (
          <div>
            {h('DESCRIPTION')}
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, lineHeight: 1.5, marginTop: 3, opacity: .92 }}>{description}</div>
          </div>
        )}
        {standard && (
          <div>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 11.5, letterSpacing: '1px',
              border: '1.5px solid rgba(246,242,234,.7)', padding: '3px 10px', display: 'inline-block',
            }}>{standard}</span>
          </div>
        )}
        <div style={{ flex: 1 }} />
        {notes.length > 0 && (
          <div style={{
            fontFamily: 'var(--font-editorial)', fontStyle: 'italic', fontSize: 15,
            borderTop: '1px solid rgba(246,242,234,.3)', paddingTop: 9,
          }}>Notes from others</div>
        )}
        {notes.map((n, i) => (
          <div key={i} style={{
            fontFamily: 'var(--font-editorial)', fontStyle: 'italic',
            fontSize: 14, lineHeight: 1.4, opacity: .88,
          }}>"{n.text}" <span style={{ opacity: .72 }}>— {n.who}</span></div>
        ))}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, padding: '10px 4px',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20,
          letterSpacing: '1px', color: 'var(--ink-muted)', textTransform: 'uppercase', lineHeight: 1.1,
        }}>{title}</div>
        {onRemove && (
          <div
            onClick={onRemove}
            style={{
              flex: 'none', fontFamily: 'var(--font-display)', fontWeight: 500,
              fontSize: 11, letterSpacing: '1px', color: 'var(--flag)',
              border: '1.5px solid var(--flag)', padding: '3px 10px', cursor: 'pointer', userSelect: 'none',
            }}
          >REMOVE</div>
        )}
      </div>
    </div>
  );
}
