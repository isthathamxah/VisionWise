import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Vitest doesn't auto-run Testing Library's cleanup between tests the way
// Jest does — without this, each render() leaves its DOM behind for the
// next test in the same file.
afterEach(cleanup)
