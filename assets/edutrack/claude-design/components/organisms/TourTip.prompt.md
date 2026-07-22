Guided-tour tooltip + spotlight cutout; both glide between steps with the settle easing.

```jsx
<TourSpotlight x={rect.x} y={rect.y} width={rect.w} height={rect.h} />
<TourTip stepLabel="STEP 1 OF 5" title="YOUR LESSON SHELF"
  text="Every unit comes loaded with ready-to-teach lessons."
  onNext={next} onBack={back} onSkip={skip} />
```
