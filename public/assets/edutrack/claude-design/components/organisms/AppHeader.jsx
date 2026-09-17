import React from 'react';

export function AppHeader({
  active = 'plan', onNavigate,
  identity, meta,
  calendarOpen = false, onToggleCalendar, onToggleUnits, unitsOpen = false,
  style,
}) {
  const tabs = ['plan', 'do', 'review'];
  const tabColor = (t) => (active === t ? 'var(--accent)' : '#9c9a94');
  return (
    <div style={style}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 16,
        padding: '20px 34px 12px', borderBottom: '2px solid var(--line)', margin: '0 14px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 14,
          fontFamily: 'var(--font-display)', fontWeight: 600,
          fontSize: 42, letterSpacing: '2px', lineHeight: 1,
        }}>
          {tabs.map((t, i) => (
            <React.Fragment key={t}>
              {i > 0 && <span style={{ color: '#c6c3ba', fontWeight: 400 }}>|</span>}
              <span
                onClick={() => onNavigate && onNavigate(t)}
                style={{ cursor: 'pointer', color: tabColor(t), textTransform: 'uppercase', userSelect: 'none' }}
              >{t}</span>
            </React.Fragment>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 28,
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, letterSpacing: '1.5px',
        }}>
          {onToggleCalendar && (
            <span onClick={onToggleCalendar} style={{ cursor: 'pointer', color: calendarOpen ? 'var(--accent)' : 'var(--ink)', whiteSpace: 'nowrap', userSelect: 'none' }}>
              CALENDAR <span style={{ fontWeight: 400 }}>{calendarOpen ? '⌄' : '›'}</span>
            </span>
          )}
          {onToggleUnits && (
            <span onClick={onToggleUnits} style={{ cursor: 'pointer', color: unitsOpen ? 'var(--accent)' : 'var(--ink)', whiteSpace: 'nowrap', userSelect: 'none' }}>
              ALL UNITS <span style={{ fontWeight: 400 }}>›</span>
            </span>
          )}
        </div>
      </div>
      {(identity || meta) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          gap: 16, padding: '7px 34px 0', margin: '0 14px',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 11.5,
            letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--ink-faint)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{identity}</div>
          <div style={{
            fontFamily: 'var(--font-editorial)', fontStyle: 'italic',
            fontSize: 15, color: 'var(--ink-faint)', whiteSpace: 'nowrap',
          }}>{meta}</div>
        </div>
      )}
    </div>
  );
}
