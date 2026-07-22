Text input in two voices: `boxed` for deliberate form entry, `underline` for quick in-context jotting.

```jsx
<TextField label="YOUR NAME" value={name} onChange={setName} />
<TextField variant="underline" placeholder="Reflection…" value={note} onChange={setNote} />
<TextField multiline placeholder="How did it go?" value={note} onChange={setNote} />
```
