import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { doseFraction, activeMgAt, curve, CaffeineCurve } from '../src'

const HOUR = 3_600_000

describe('the curve math', () => {
  it('contributes nothing before the drink', () => {
    expect(doseFraction(-1, 5)).toBe(0)
    expect(doseFraction(0, 5)).toBe(0)
  })

  it('peaks about an hour after drinking', () => {
    let best = 0, at = 0
    for (let h = 0; h <= 4; h += 0.01) {
      const f = doseFraction(h, 5)
      if (f > best) { best = f; at = h }
    }
    expect(at).toBeGreaterThan(0.75)
    expect(at).toBeLessThan(1.2)
  })

  it('halves over one half-life once absorbed', () => {
    expect(doseFraction(11, 5) / doseFraction(6, 5)).toBeCloseTo(0.5, 2)
  })

  it('adds up separate drinks', () => {
    const t = Date.now()
    const one = activeMgAt(t, [{ at: t - 2 * HOUR, mg: 100 }], 5)
    const two = activeMgAt(t, [{ at: t - 2 * HOUR, mg: 100 }, { at: t - 2 * HOUR, mg: 100 }], 5)
    expect(two).toBeCloseTo(one * 2, 6)
  })

  it('samples the whole range', () => {
    const pts = curve(0, 24 * HOUR, HOUR, [], 5)
    expect(pts).toHaveLength(25)
    expect(pts[24].t).toBe(24 * HOUR)
  })
})

describe('the chart', () => {
  const from = new Date(2026, 0, 1, 6, 0).getTime()
  const render = (props: Record<string, unknown>) =>
    renderToStaticMarkup(createElement(CaffeineCurve, { doses: [], from, ...props }))

  it('renders an svg with the curve', () => {
    const html = render({ doses: [{ at: from + 2 * HOUR, mg: 95 }] })
    expect(html).toMatch(/^<svg/)
    expect(html).toMatch(/<path d="M/)
    expect(html).toMatch(/peaking at \d+mg/)
  })

  it('draws the optional lines only when asked', () => {
    const bare = render({})
    const full = render({ now: from + HOUR, bedtime: from + 17 * HOUR, sleepLimitMg: 50 })
    expect((full.match(/<line/g) ?? []).length).toBeGreaterThan((bare.match(/<line/g) ?? []).length)
  })

  it('ignores a "now" outside the chart', () => {
    const html = render({ now: from - 5 * HOUR })
    expect(html).not.toMatch(/opacity="0.55"/)
  })
})
