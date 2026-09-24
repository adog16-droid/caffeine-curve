/**
 * How much caffeine is in the body over time.
 *
 * A one-compartment pharmacokinetic model with first-order absorption:
 *
 *   amount(t) = D · ka/(ka−ke) · (e^−ke·t − e^−ka·t)
 *
 * ka = 3.5/hr puts peak plasma concentration about 58 minutes after a drink,
 * which is where the literature puts caffeine (Tmax 30–120 min, median around
 * an hour). ke comes from the half-life, which varies a lot between people —
 * smoking roughly halves it, oral contraceptives roughly double it, and genetics
 * move it either way — so it is a parameter rather than a constant.
 */

export type Dose = {
  /** Epoch milliseconds when it was drunk. */
  at: number
  /** Caffeine in the drink, in milligrams. */
  mg: number
}

export type CurvePoint = { t: number; mg: number }

export const ABSORPTION_RATE = 3.5
const HOUR = 3_600_000

export function eliminationRate(halfLifeHours: number): number {
  return Math.LN2 / Math.max(0.5, halfLifeHours)
}

/**
 * Fraction of a dose still circulating `hoursSince` after drinking it.
 * Zero before the drink, so a dose in the future contributes nothing yet.
 */
export function doseFraction(hoursSince: number, halfLifeHours: number): number {
  if (!(hoursSince > 0)) return 0
  const ke = eliminationRate(halfLifeHours)
  const ka = ABSORPTION_RATE
  // ka === ke only happens for a half-life of ~12 minutes; the limit form keeps
  // it finite if someone passes one anyway.
  if (Math.abs(ka - ke) < 1e-9) return ke * hoursSince * Math.exp(-ke * hoursSince)
  return (ka / (ka - ke)) * (Math.exp(-ke * hoursSince) - Math.exp(-ka * hoursSince))
}

/** Milligrams of caffeine in the body at `whenMs`, summed over every dose. */
export function activeMgAt(whenMs: number, doses: Dose[], halfLifeHours: number): number {
  let total = 0
  for (const d of doses) total += d.mg * doseFraction((whenMs - d.at) / HOUR, halfLifeHours)
  return total
}

/** The curve sampled every `stepMs` between two times. */
export function curve(
  fromMs: number,
  toMs: number,
  stepMs: number,
  doses: Dose[],
  halfLifeHours: number,
): CurvePoint[] {
  const out: CurvePoint[] = []
  for (let t = fromMs; t <= toMs; t += stepMs) {
    out.push({ t, mg: activeMgAt(t, doses, halfLifeHours) })
  }
  return out
}
