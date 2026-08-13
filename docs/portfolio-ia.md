# Portfolio information architecture

Updated: 2026-08-12

The goal the structure serves: **get hired, and get work.** Everything below is
downstream of that.

---

## The two questions a visitor asks

They arrive and decide twice, in this order:

1. **In three seconds** — "is this person at my level?" Answered by the
   strongest few pieces, and only by those.
2. **In two minutes** — "can they do *my* thing?" Answered by depth in the
   category their problem lives in.

A single long grid of everything answers the second question and buries the
first. A hand-picked set of five answers the first and fails the second. So the
site does both, in that order: **seven on the landing page, everything one
click down.**

Nothing was deleted to achieve this. Twenty-four projects are still on the
site; they just no longer all compete for the front door.

---

## Categories

Five, in two tiers. The tiers are the point — six equal boxes read as a
generalist, and a generalist competes on price.

### Lead tier — what the work is sold as now

| Category | Page | Count |
|---|---|---|
| Interactive Experience | `interactive.html` | 8 |
| AI Products | `ai-products.html` | 5 |
| AI Skills & Tools | `ai-tools.html` | 7 |

### Base tier — the twenty years that make the lead tier credible

| Category | Page | Count |
|---|---|---|
| Product Design | `work.html` | 13 |
| Brand & Visual | `brand.html` | 11 |

The base tier is present, quieter, and visually behind a rule. It is not
hidden: it is the reason a buyer believes the lead tier.

---

## Why design and build are separate categories

`Product Design` and `AI Products` used to blur together. They are different
purchases, made by different buyers, at different prices.

What earns the higher rate is holding *both* — designing the thing and
building it. When both live under one label, a reader assumes only one of
them, and generally assumes the weaker reading: a designer who cannot ship.
Splitting them turns the combination from something inferred into something
visible.

The same logic split Interactive Experience out of `ai-products.html`.
Designing an AI product and staging a room-scale experience are sold to
different people, and almost none of the interactive work is AI at all — it is
networking, tracking and timing. Leaving it filed under "AI Products"
mislabelled it in both directions.

---

## Innovation Workshop — deliberately not a category

Takao sells innovation strategy, and the method exists: `breakbias.html` is a
779-line page linked from the homepage.

**It contains zero images.** The category is not empty of content; it is empty
of *evidence*. A category advertised with no visual proof reads as "here is
something I cannot show you," which is worse than not listing it.

The material to fix this exists offline — photographs and handouts from past
in-person workshops. **The moment those are added to `breakbias.html`, this
becomes the sixth category** and moves into the lead tier, where it belongs.
Until then it stays where it is: in `Initiatives` on the homepage and in
`What I do`, described rather than displayed.

A test enforces this — the homepage category index must not advertise a
category with no case study.

---

## Naming decisions

- **"AI Skills & Tools"**, not "AI Skills." The page holds CLIs and libraries
  as well as Claude skills, and "skills" is Anthropic-internal vocabulary that
  a recruiter will not recognise. The label has to work for both readers.
- **"Brand & Visual"**, not "Branding / visual design / creative direction."
  Three words a buyer scans, not a service list.

---

## Homepage composition

```
Hero            — names the intersection outright
Selected Work   — 7 cards, one drawn from every category
Categories      — 5 categories, 2 tiers, live counts
Initiatives     — BreakBias, intentfirst.ai
What I do       — capability detail
```

The seven are chosen for range as much as strength: two AI products, one
interactive, one AI tool, two product design, one brand. A visitor who reads
only the landing page still sees the whole shape of the practice.

The hero's live chips (Rakugaki Jam, Resona, Typespace) carry the "open it
right now" proof that the removed playable section used to provide.


---

## Column and rule (2026-08-12)

The three lead pages were centred in a 1200px column while `work.html` used
1680px, so the same site had two different left edges. They now share one
column — measured: grid left 40px, right 1400px on all four at 1440px wide.

They also borrow work.html's index rule: every card hangs off a hairline drawn
across the top of its row. What they do **not** borrow is its austerity. A
client-project index can be a name and a thumbnail; these pages have to argue
for each item, so labels, description and footer meta all stay.

## The nav separator

The tier break between `AI Tools` and `Product Design` is drawn as a
pseudo-element inside the existing 28px gap, not as a list item. As an element
it consumed a flex slot and made that one gap 57px against 28px everywhere
else. Measured after the fix: 28px × 6, all equal.

## Interactive Experience — the input is the argument

The page opens with a specification, not a paragraph:

```
INPUT    your voice · your face · your body · your handwriting · every phone at once
OUTPUT   a screen bigger than the one you are holding
NOT      AI. Almost none of this is. It is networking, tracking and timing.
```

That same vocabulary then leads every card as the one solid-filled label, so
the grid can be scanned by input alone — "which of these uses my voice" is
answerable without reading a single description.

Order is by strength, not by category: Resona, Kao Game, Rakugaki Jam,
Typespace, Koe Baku · then Games: EmojiDrop, Marubatsu 2.0, Werewolf.

## The identity meta row is gone from the three lead pages

`Takao Umehara / Product design × AI systems / Index / Information / N projects
/ 20 years · New York / New York / 2026` repeated the nav and the footer on
every page. The wordmark stays; the meta row does not. `work.html` and
`brand.html` still carry theirs — **not yet reconciled**, and worth deciding
one way or the other.

One casualty: the line "AI Tools — open source, designed & built by Takao"
lived inside that row. The claim now sits in the page copy instead, where it
reads as an argument rather than as metadata.
