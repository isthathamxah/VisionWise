import { ScanLine, Sparkles, ShieldCheck } from 'lucide-react'

// Shared between the Home page's "How it works" section and the Scanner's
// first-visit onboarding sheet — one source for the same three steps.
export const STEPS = [
  { icon: ScanLine, k: '01', title: 'Point your camera', line: 'The model detects the object live, right in your browser. Nothing uploaded.' },
  { icon: Sparkles, k: '02', title: 'Get real nutrition data', line: 'Ingredients, nutrients and impact — estimated from a dish, or read straight off a package label.' },
  { icon: ShieldCheck, k: '03', title: 'See an honest verdict', line: 'A score from 0–100, a plain-English reason, and one useful tip.' },
]
