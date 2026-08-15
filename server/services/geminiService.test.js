import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeFood } from './geminiService.js'

test('sanitizeFood returns undefined for non-food or missing input', () => {
  assert.equal(sanitizeFood(undefined), undefined)
  assert.equal(sanitizeFood(null), undefined)
  assert.equal(sanitizeFood({ isFood: false }), undefined)
  assert.equal(sanitizeFood('not an object'), undefined)
})

test('sanitizeFood keeps valid dish data and clamps percentDV to 400', () => {
  const result = sanitizeFood({
    isFood: true,
    dishType: 'dish',
    source: 'estimated',
    servingNote: 'Estimated for 1 plate',
    unclear: false,
    nutrients: [
      { label: 'Sodium', amount: 900, unit: 'mg', percentDV: 950, impact: 'High', note: 'Very high for one serving.' }
    ],
    ingredients: []
  })
  assert.equal(result.dishType, 'dish')
  assert.equal(result.source, 'estimated')
  assert.equal(result.nutrients[0].percentDV, 400)
  assert.equal(result.nutrients[0].impact, 'High')
})

test('sanitizeFood forces source to estimated unless dishType is packaged', () => {
  const result = sanitizeFood({ isFood: true, dishType: 'dish', source: 'label', unclear: false, nutrients: [], ingredients: [] })
  assert.equal(result.source, 'estimated')

  const packaged = sanitizeFood({ isFood: true, dishType: 'packaged', source: 'label', unclear: false, nutrients: [], ingredients: [] })
  assert.equal(packaged.source, 'label')
})

test('sanitizeFood drops malformed nutrient and ingredient entries', () => {
  const result = sanitizeFood({
    isFood: true,
    unclear: false,
    nutrients: [{ label: 'Calories' }, { label: 'Protein', amount: 12 }],
    ingredients: [{ whatItIs: 'no name field' }, { name: 'Sugar' }]
  })
  assert.equal(result.nutrients.length, 1)
  assert.equal(result.nutrients[0].label, 'Protein')
  assert.equal(result.ingredients.length, 1)
  assert.equal(result.ingredients[0].name, 'Sugar')
})

test('sanitizeFood returns empty nutrients/ingredients when unclear', () => {
  const result = sanitizeFood({
    isFood: true,
    unclear: true,
    nutrients: [{ label: 'Calories', amount: 100 }],
    ingredients: [{ name: 'Salt' }]
  })
  assert.equal(result.nutrients.length, 0)
  assert.equal(result.ingredients.length, 0)
})

test('sanitizeFood defaults an invalid impact/concern enum to null instead of guessing', () => {
  const result = sanitizeFood({
    isFood: true,
    unclear: false,
    nutrients: [{ label: 'Fiber', amount: 4, impact: 'Extreme' }],
    ingredients: [{ name: 'MSG', concern: 'Severe' }]
  })
  assert.equal(result.nutrients[0].impact, null)
  assert.equal(result.ingredients[0].concern, null)
})

test('sanitizeFood survives empty nutrients/ingredients on a clear food scan', () => {
  const result = sanitizeFood({ isFood: true, unclear: false, nutrients: [], ingredients: [] })
  assert.equal(result.isFood, true)
  assert.deepEqual(result.nutrients, [])
  assert.deepEqual(result.ingredients, [])
})

test('sanitizeFood keeps a valid nutrient direction and defaults an invalid one to neutral', () => {
  const result = sanitizeFood({
    isFood: true,
    unclear: false,
    nutrients: [
      { label: 'Sugar', amount: 19, direction: 'limit' },
      { label: 'Fiber', amount: 4, direction: 'beneficial' },
      { label: 'Iron', amount: 2, direction: 'made up value' }
    ],
    ingredients: []
  })
  assert.equal(result.nutrients[0].direction, 'limit')
  assert.equal(result.nutrients[1].direction, 'beneficial')
  assert.equal(result.nutrients[2].direction, 'neutral')
})

test('sanitizeFood defaults a missing nutrient direction to neutral', () => {
  const result = sanitizeFood({ isFood: true, unclear: false, nutrients: [{ label: 'Calories', amount: 95 }], ingredients: [] })
  assert.equal(result.nutrients[0].direction, 'neutral')
})

test('sanitizeFood caps nutrients at 12 and ingredients at 8', () => {
  const manyNutrients = Array.from({ length: 20 }, (_, i) => ({ label: `N${i}`, amount: 1 }))
  const manyIngredients = Array.from({ length: 20 }, (_, i) => ({ name: `I${i}` }))
  const result = sanitizeFood({ isFood: true, unclear: false, nutrients: manyNutrients, ingredients: manyIngredients })
  assert.equal(result.nutrients.length, 12)
  assert.equal(result.ingredients.length, 8)
})
