Run-of-show row for the teaching day; expands into a phased mini lesson plan.

```jsx
<AgendaItem
  time="9:00 – 9:45" title="Traits vs. Feelings" desc="Readers separate feeling from trait."
  std="5R1 · Inference & Evidence" durationLabel="45 min"
  done={done} onToggleDone={setDone}
  expanded={open} onToggleExpand={() => setOpen(!open)}
  teachingPoint="Readers separate how a character feels right now from who they are over time."
  phases={[{ min: '3', name: 'CONNECT', note: "Link to yesterday's thinking" }]}
/>
```
