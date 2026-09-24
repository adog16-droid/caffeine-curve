import { curve, type Dose } from './curve'

const HOUR = 3_600_000
const MIN = 60_000

export const DEFAULT_COLORS = {
  curve: '#e6c180',
  band: 'rgba(230,193,128,.10)',
  sleepLimit: '#86c98d',
  ceiling: '#a87f57',
  bedtime: '#b6a693',
  now: '#ffffff',
  axis: '#7a6c5d',
}

export type Band = { start: number; end: number }

export type CaffeineCurveProps = {
  /** The drinks to plot. */
  doses: Dose[]
  /** Left edge of the chart, epoch ms. */
  from: number
  /** How many hours the chart spans. Default 24. */
  hours?: number
  /** Caffeine half-life in hours. Default 5. */
  halfLifeHours?: number
  /** Draws a vertical "now" line. */
  now?: number
  /** Draws a vertical bedtime line. */
  bedtime?: number
  /** Draws a dashed horizontal line at this many mg. */
  sleepLimitMg?: number
  /** Draws a second dashed line, e.g. where more caffeine stops helping. */
  ceilingMg?: number
  /** Shaded vertical bands, e.g. hours you want to be sharp for. */
  bands?: Band[]
  /** Sampling interval. Default 10 minutes. */
  stepMinutes?: number
  /** viewBox width; the SVG scales to its container. Default 340. */
  width?: number
  /** Plot height, excluding the axis labels. Default 150. */
  height?: number
  /** Id for the fill gradient. Only needed for differently coloured charts on one page. */
  gradientId?: string
  colors?: Partial<typeof DEFAULT_COLORS>
}

/**
 * Caffeine in the body across a day, as an SVG area chart.
 *
 * Pure render, no hooks and no state, so it works in client and server
 * components alike. Everything it draws comes from its props.
 */
export function CaffeineCurve({
  doses, from, hours = 24, halfLifeHours = 5, now, bedtime, sleepLimitMg,
  ceilingMg, bands = [], stepMinutes = 10, width: W = 340, height: H = 150,
  gradientId = 'caffeine-curve-fill', colors,
}: CaffeineCurveProps) {
  const c = { ...DEFAULT_COLORS, ...colors }
  const t0 = from
  const t1 = from + hours * HOUR
  const pts = curve(t0, t1, stepMinutes * MIN, doses, halfLifeHours)
  const peak = pts.reduce((m, p) => Math.max(m, p.mg), 0)
  const yMax = Math.max(peak * 1.15, (sleepLimitMg ?? 0) * 2, 120)

  const X = (t: number) => ((t - t0) / (t1 - t0)) * W
  const Y = (v: number) => H - (v / yMax) * H
  const inRange = (t?: number) => t !== undefined && t >= t0 && t <= t1
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)} ${Y(p.mg).toFixed(1)}`).join(' ')
  const ticks = Array.from({ length: Math.floor(hours / 6) + 1 }, (_, i) => t0 + i * 6 * HOUR)

  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} width="100%" role="img"
         aria-label={`Caffeine in the body, peaking at ${Math.round(peak)}mg`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.curve} stopOpacity="0.34" />
          <stop offset="1" stopColor={c.curve} stopOpacity="0" />
        </linearGradient>
      </defs>
      {bands.map((b, i) => (
        <rect key={i} x={X(b.start)} y={0} width={Math.max(2, X(b.end) - X(b.start))} height={H} fill={c.band} />
      ))}
      {sleepLimitMg !== undefined && sleepLimitMg <= yMax && (
        <line x1={0} y1={Y(sleepLimitMg)} x2={W} y2={Y(sleepLimitMg)}
              stroke={c.sleepLimit} strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
      )}
      {ceilingMg !== undefined && ceilingMg <= yMax && (
        <line x1={0} y1={Y(ceilingMg)} x2={W} y2={Y(ceilingMg)}
              stroke={c.ceiling} strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
      )}
      <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={c.curve} strokeWidth="2" strokeLinejoin="round" />
      {inRange(bedtime) && (
        <line x1={X(bedtime!)} y1={0} x2={X(bedtime!)} y2={H} stroke={c.bedtime} strokeWidth="1" opacity="0.5" />
      )}
      {inRange(now) && (
        <line x1={X(now!)} y1={0} x2={X(now!)} y2={H} stroke={c.now} strokeWidth="1" opacity="0.55" />
      )}
      {ticks.map((t) => (
        <text key={t} x={Math.min(W - 12, Math.max(10, X(t)))} y={H + 15} fill={c.axis}
              fontSize="9" textAnchor="middle">
          {new Date(t).toLocaleTimeString([], { hour: 'numeric' }).replace(' ', '').toLowerCase()}
        </text>
      ))}
    </svg>
  )
}
