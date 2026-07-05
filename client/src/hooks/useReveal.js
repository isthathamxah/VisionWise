import { useEffect, useRef } from 'react'

// Adds `.in` to a `.reveal-on-scroll` element when it scrolls into view.
export function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
      }),
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    )
    const nodes = el.querySelectorAll('.reveal-on-scroll')
    nodes.forEach(n => io.observe(n))
    return () => io.disconnect()
  }, [])
  return ref
}
