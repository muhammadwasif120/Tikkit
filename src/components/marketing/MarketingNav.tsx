'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { ButtonLink, Logo, ThemeToggle } from '@/components/kit'
import { cn } from '@/lib/cn'

const links = [
  { href: '/#features', label: 'Features' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/explore', label: 'Explore events' },
  { href: '/blog', label: 'Blog' },
]

export function MarketingNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-200',
        scrolled ? 'border-b border-line bg-canvas/80 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="TIKKIT X home" className="shrink-0"><Logo /></Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-fg">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <ButtonLink href="/auth/login" variant="ghost">Log in</ButtonLink>
          <ButtonLink href="/auth/login?flow=organizer-signup">Start free trial</ButtonLink>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-fg hover:bg-raised md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-canvas px-4 pb-10 pt-4 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="border-b border-line py-4 text-lg font-medium text-fg">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            <ButtonLink href="/auth/login?flow=organizer-signup" size="lg">Start free trial</ButtonLink>
            <ButtonLink href="/auth/login" variant="secondary" size="lg">Log in</ButtonLink>
            <div className="flex items-center justify-between pt-2 text-sm text-muted">
              <span>Appearance</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
