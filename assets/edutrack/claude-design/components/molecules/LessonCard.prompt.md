The physical index card — EduTrack's core object. Brown = lesson, green = vitamin.

```jsx
<LessonCard label="Traits vs. Feelings" code="5R1" onPointerDown={startDrag} />
<LessonCard kind="vitamin" label="Word Collector" code="5L4" dropIn />
<LessonCard label="Narrator POV" code="5R6" dimmed />
```

`dimmed` = already placed; `dropIn` plays the landing squash; `size="sm"` for dense calendar views.
