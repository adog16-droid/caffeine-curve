# caffeine-curve

A React component that charts how much caffeine is in your body across a day,
and the small pharmacokinetic model behind it.

Each drink rises to a peak about an hour after you have it, then fades with
your half-life. Several drinks stack. The chart draws the result as a smooth
area curve, with optional lines for "now", bedtime and a sleep limit, and
optional shaded bands for the hours you care about.

## Usage

```tsx
import { CaffeineCurve } from './src'

const sixAm = new Date().setHours(6, 0, 0, 0)
const at = (h: number, m = 0) => new Date().setHours(h, m, 0, 0)

<CaffeineCurve
  from={sixAm}
  doses={[
    { at: at(8, 30), mg: 95 },   // coffee
    { at: at(13, 0), mg: 80 },   // energy drink
  ]}
  halfLifeHours={5}
  now={Date.now()}
  bedtime={at(23)}
  sleepLimitMg={50}
  bands={[{ start: at(10), end: at(13) }]}
/>
```

The SVG scales to the width of its container.

## Props

| Prop | Default | What it does |
|---|---|---|
| `doses` | — | `{ at, mg }[]` — when each drink was had (epoch ms) and its caffeine |
| `from` | — | Left edge of the chart (epoch ms) |
| `hours` | `24` | How long the chart spans |
| `halfLifeHours` | `5` | Caffeine half-life. Typically 3–7 hours |
| `now` | — | Vertical line at this time |
| `bedtime` | — | Vertical line at this time |
| `sleepLimitMg` | — | Dashed horizontal line at this level |
| `ceilingMg` | — | A second dashed line |
| `bands` | `[]` | `{ start, end }[]` shaded vertical bands |
| `stepMinutes` | `10` | Sampling interval |
| `width` / `height` | `340` / `150` | Drawing size (viewBox) |
| `colors` | gold on dark | Override any of `curve`, `band`, `sleepLimit`, `ceiling`, `bedtime`, `now`, `axis` |
| `gradientId` | `caffeine-curve-fill` | Only needed for several differently coloured charts on one page |

It uses no hooks or state, so it works in client and server components alike.

## The model

A one-compartment model with first-order absorption:

    amount(t) = D · ka/(ka−ke) · (e^−ke·t − e^−ka·t)

- `ka = 3.5/hr` puts the peak about 58 minutes after a drink, matching the
  published range for caffeine (30–120 minutes, median around an hour).
- `ke = ln 2 / half-life`. Half-life varies a lot between people — smoking
  roughly halves it, oral contraceptives roughly double it — which is why it is
  a prop and not a constant.

`src/curve.ts` exports the pieces: `doseFraction`, `activeMgAt` and `curve`.

This is an estimate for visualising the shape of a day, not medical advice.

## Running the tests

```bash
npm install
npm test
```

## License

MIT — see [LICENSE](LICENSE).
