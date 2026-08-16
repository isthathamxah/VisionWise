import { describe, it, expect } from 'vitest'
import { dedupeDetections } from './detections'

describe('dedupeDetections', () => {
  it('returns one entry per distinct class', () => {
    const preds = [
      { class: 'apple', score: 0.9, bbox: [0, 0, 1, 1] },
      { class: 'bottle', score: 0.8, bbox: [1, 1, 1, 1] },
      { class: 'banana', score: 0.7, bbox: [2, 2, 1, 1] },
    ]
    expect(dedupeDetections(preds)).toHaveLength(3)
  })

  it('collapses duplicate classes to their highest-confidence instance', () => {
    const preds = [
      { class: 'apple', score: 0.6, bbox: [0, 0, 1, 1] },
      { class: 'apple', score: 0.95, bbox: [1, 1, 1, 1] }, // the better of two apples
      { class: 'apple', score: 0.4, bbox: [2, 2, 1, 1] },
    ]
    const result = dedupeDetections(preds)
    expect(result).toHaveLength(1)
    expect(result[0].score).toBe(0.95)
  })

  it('sorts by confidence descending', () => {
    const preds = [
      { class: 'low', score: 0.3 },
      { class: 'high', score: 0.9 },
      { class: 'mid', score: 0.6 },
    ]
    expect(dedupeDetections(preds).map(d => d.class)).toEqual(['high', 'mid', 'low'])
  })

  it('returns an empty array for no predictions', () => {
    expect(dedupeDetections([])).toEqual([])
  })

  it('does not mutate the input array', () => {
    const preds = [{ class: 'a', score: 0.2 }, { class: 'b', score: 0.9 }]
    const copy = [...preds]
    dedupeDetections(preds)
    expect(preds).toEqual(copy)
  })
})
