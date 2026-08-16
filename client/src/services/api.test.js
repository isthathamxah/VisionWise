import { describe, it, expect } from 'vitest'
import { getApiError } from './api'

describe('getApiError', () => {
  it('prefers the first express-validator error message', () => {
    const err = { response: { data: { errors: [{ msg: 'Email is invalid' }] } } }
    expect(getApiError(err)).toBe('Email is invalid')
  })

  it('falls back to a plain error field', () => {
    const err = { response: { data: { error: 'Invalid credentials' } } }
    expect(getApiError(err)).toBe('Invalid credentials')
  })

  it('falls back to message when there is no error/errors field', () => {
    const err = { response: { data: { message: 'Something broke' } } }
    expect(getApiError(err)).toBe('Something broke')
  })

  it('uses the caller-supplied fallback when the response body is empty', () => {
    const err = { response: { data: {} } }
    expect(getApiError(err, 'Try again')).toBe('Try again')
  })

  it('gives a network-specific message when the request never got a response', () => {
    const err = { request: {} }
    expect(getApiError(err)).toMatch(/reach the server/i)
  })

  it('uses the fallback for a non-axios error', () => {
    expect(getApiError(new Error('boom'), 'Default message')).toBe('Default message')
  })
})
