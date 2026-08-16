import { describe, it, expect } from 'vitest'
import { nutrientStyle } from './NutritionPanel'

describe('nutrientStyle', () => {
  it('colors a limit nutrient red at High impact', () => {
    expect(nutrientStyle('limit', 'High').text).toBe('text-bad')
  })

  it('colors a limit nutrient amber at Moderate impact', () => {
    expect(nutrientStyle('limit', 'Moderate').text).toBe('text-neutral')
  })

  it('colors a limit nutrient green at Low impact (little of something to limit is good)', () => {
    expect(nutrientStyle('limit', 'Low').text).toBe('text-good')
  })

  it('colors a beneficial nutrient green at Moderate/High impact', () => {
    expect(nutrientStyle('beneficial', 'Moderate').text).toBe('text-good')
    expect(nutrientStyle('beneficial', 'High').text).toBe('text-good')
  })

  // Regression guard: this used to default any non-High/Moderate beneficial
  // nutrient (including a null/missing impact) to green via `impact === 'Low' ? muted : good`.
  it('does NOT default a beneficial nutrient with null impact to green', () => {
    expect(nutrientStyle('beneficial', null).text).not.toBe('text-good')
    expect(nutrientStyle('beneficial', null).text).toBe('text-muted')
  })

  it('falls back to muted for an unrecognized direction/impact combination', () => {
    expect(nutrientStyle('neutral', 'High').text).toBe('text-muted')
    expect(nutrientStyle(undefined, undefined).text).toBe('text-muted')
  })
})
