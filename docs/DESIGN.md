# Design system

Tourney is a place where a small community runs a competition. The interface has
one job: make that competition legible — who is in, what is at stake, who
advances. Everything below follows from that.

The system lives in [`client/src/styles/tokens.css`](../client/src/styles/tokens.css).
This document is the reasoning; that file is the truth.

---

## Direction

**Dark-first, under lights.** A tournament happens in the evening, on a screen,
usually with something else going on in the room. Dark is the right ground for
that — but the easy dark UI is near-black plus one acid accent, which is what
every generated dashboard looks like. So:

- **A layered neutral scale, not a single black.** Eight dark steps
  (`--ink-950` … `--ink-500`), each far enough from its neighbour to read as a
  different plane without a border. A tournament page stacks page → card → row →
  input; every one of those needs a step of its own.
- **The neutrals are not grey.** They carry a faint violet cast borrowed from
  the accent, so the greys and the brand belong to one family. Nothing is
  `#000`: pure black flattens every shadow and makes the app one sheet of paper.
- **One saturated accent.** Violet `#7c5cff`. It marks what advances — the node
  in the bracket, the active nav link, the primary action — and nothing else.
- **A disciplined semantic set.** Green for success and for credits, red for
  eliminated and destructive, amber for pending. Three signals, each with a
  readable step for text and a solid step for fills.

Credits are green rather than a fourth colour on purpose: in this app money is
the score, and colouring it as a win is accurate.

## Colour

Two layers, and the split is the point.

| Layer     | Example                         | Who uses it          |
| --------- | ------------------------------- | -------------------- |
| Primitive | `--ink-800`, `--violet-500`     | the token sheet only |
| Semantic  | `--surface-overlay`, `--accent` | every component      |

Retuning the palette is an edit to the primitives. Rethinking a role — "cards
should sit one step lighter" — is an edit to the semantics. Neither is a hunt
through components.

**Contrast.** Every text token was measured against every surface it can appear
on, and the floor is WCAG AA (4.5:1) for body-sized text:

| On `--surface-page` | Ratio  |
| ------------------- | ------ |
| `--text-strong`     | 17.5:1 |
| `--text`            | 11.8:1 |
| `--text-muted`      | 6.7:1  |
| `--text-faint`      | 5.1:1  |
| `--accent`          | 6.6:1  |

The brand violet itself (`--violet-500`) reaches only 4.4:1 on the page, so it
is never used for text on a dark surface — `--accent` is the 400 step, and
filled buttons use the 600 step under white. That is the whole reason the ramp
has five steps instead of one value.

## Typography

**Archivo** for display, **Instrument Sans** for body. Both are variable fonts,
self-hosted through `@fontsource-variable/*` — no CDN `<link>`, no third-party
request on page load, no Product Sans.

Archivo has a **width axis**, and the system uses it: headings, buttons, badges,
and numbers are set at `font-stretch: 112%`. Slightly expanded grotesque
lettering is the language of a scoreboard, and it is the single choice that most
makes the app look like _this_ product rather than a component library. Body
text stays in Instrument Sans, which is narrower and quieter and gets out of the
way.

Numbers are part of the personality: scores, credit balances, and prize pools
are set in Archivo with `font-variant-numeric: tabular-nums`, so a column of
figures lines up and a changing balance does not shuffle the layout.

The scale is roughly 1.22 per step, fluid at the two sizes that carry a page
(`--text-3xl`, `--text-4xl`) so a hero heading works at 360px and at 1440px
without a media query.

## The bracket line

One motif, used with restraint. It is the elimination-tree connector: two
entrants, a spine, one line advancing to a seat in the next round.

It appears as:

- the **logo mark** (`components/brand/BracketMark.jsx`), and the standalone
  lockups in `client/public/brand/`;
- the **active nav link**, marked with a short spine and its run-out instead of a
  plain underline;
- a **section divider** (`BracketRule`), instead of a bare `<hr>`;
- a two-pixel **spine down the left edge of every card**, fading out before it
  reaches the bottom;
- a full **tree behind empty states, errors, and the 404**, at ~13% opacity —
  the one place the motif is allowed to be large, because a page with nothing on
  it is exactly where the product can afford to say what it is;
- a **watermark** in the corner of each piece of category art, which is what
  ties the thirteen into one set.

Everything else stays quiet. If the motif starts appearing in a sixth place, one
of the five should lose it.

## Category artwork

Thirteen original abstract compositions, one per category, in
`components/brand/categoryFigures.jsx`. Each is a figure, not a picture: a
shrinking ring for a battle royale, a reticle for a tactical shooter, two
converging lanes and a diagonal for a MOBA, a knight's move for chess.

They are generated from the token palette — a hue wash, line work in
`currentColor`, the name set in the display face — so they cost nothing to ship,
scale to any panel, and restyle with the rest of the system.

The reason they exist: the original app used hotlinked screenshots of commercial
games as tournament cover images. There is no third-party artwork anywhere in
this repository, and `categoryFigures.jsx` is the file that keeps it that way.

The thirteen categories share ten hues, kept apart from the semantic set so that
a green category card is never mistaken for a success state, and spread so that
no two categories near each other in the list carry the same one.

## Motion

Small and purposeful: 120ms for a hover, 180ms for a state change, 320ms for a
dialog. One easing curve for entering (`--ease-out`), one for moving between two
states (`--ease-in-out`). Buttons translate 1px on press; dialogs rise 12px and
fade. Nothing bounces, nothing loops except the two loading indicators.

Everything above is switched off wholesale under `prefers-reduced-motion:
reduce`, in `styles/globals.css`.

## CSS

- `styles/tokens.css` — the system. Imported once, by `styles/globals.css`.
- `styles/globals.css` — element defaults, the focus ring, and the two utilities
  (`.visually-hidden`, `.skip-link`) that must be reachable from anywhere.
- Everything else is a **CSS Module** next to its component. No global class
  names, so no component can be restyled by accident from three folders away.

## Quality floor

- Responsive to 360px.
- A visible focus ring on everything reachable by keyboard, via `:focus-visible`
  so a mouse click does not leave one behind.
- WCAG AA contrast on text, per the table above.
- Semantic HTML, labelled inputs, focus-trapped dialogs that close on Escape.
- Decorative SVG is `aria-hidden`; artwork that stands alone takes a label.
