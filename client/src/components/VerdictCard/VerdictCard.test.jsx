import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VerdictCard from './VerdictCard'

const nonFoodResult = {
  verdict: 'Good',
  score: 82,
  reason: 'A sturdy, reusable object.',
  tips: ['Keep it clean.'],
  breakdown: [{ label: 'Durability', percent: 100 }],
}

const foodResult = {
  verdict: 'Neutral',
  score: 54,
  reason: 'Moderate sugar content.',
  tips: [],
  breakdown: [],
  food: {
    isFood: true,
    unclear: false,
    source: 'estimated',
    servingNote: 'Estimated for 1 serving',
    nutrients: [{ label: 'Sugar', amount: 19, unit: 'g', percentDV: 21, impact: 'Moderate', direction: 'limit', note: '' }],
    ingredients: [],
  },
}

describe('VerdictCard', () => {
  it('renders nothing when there is no result', () => {
    const { container } = render(<VerdictCard result={null} onScanAgain={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the verdict, score and breakdown chart for a non-food object', () => {
    render(<VerdictCard result={nonFoodResult} onScanAgain={() => {}} />)
    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.getByText('Durability')).toBeInTheDocument()
  })

  it('renders the nutrition panel instead of the breakdown chart for a food scan', () => {
    render(<VerdictCard result={foodResult} onScanAgain={() => {}} />)
    expect(screen.getByText('Sugar')).toBeInTheDocument()
    expect(screen.queryByText('Durability')).not.toBeInTheDocument()
  })

  it('uses the supplied actionLabel on the primary button', () => {
    render(<VerdictCard result={nonFoodResult} onScanAgain={() => {}} actionLabel="Close" />)
    expect(screen.getByRole('button', { name: /Close/ })).toBeInTheDocument()
  })
})
