'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Menu, ArrowRight } from 'lucide-react'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

interface Props {
  activePage?: 'home' | 'how-it-works' | 'explore'
}

const CSS = `
  .pub-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; padding: 0 28px; height: 64px;
    transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
  }
  .pub-nav.scrolled {
    background: rgba(8,10,16,0.88);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .pub-nav-logo {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none; cursor: pointer; flex: 1;
  }
  .pub-nav-links { display: flex; align-items: center; gap: 36px; }
  .pub-nav-link {
    font-size: 14px; color: #6B7280; text-decoration: none;
    font-weight: 500; transition: color 0.2s; cursor: pointer;
  }
  .pub-nav-link:hover, .pub-nav-link.active { color: #F0F2FF; }
  .pub-nav-actions {
    display: flex; align-items: center; gap: 8px; flex: 1; justify-content: flex-end;
  }
  .pub-btn-ghost {
    padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;
    color: #9CA3AF; text-decoration: none; transition: color 0.2s;
    background: none; border: none; cursor: pointer;
  }
  .pub-btn-ghost:hover { color: #F0F2FF; }
  .pub-btn-nav {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 20px; border-radius: 22px; font-size: 14px; font-weight: 700;
    background: #1E5EFF; color: white; text-decoration: none;
    transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s; border: none; cursor: pointer;
  }
  .pub-btn-nav:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 0 36px rgba(30,94,255,0.5); }
  .pub-hamburger {
    display: none; background: none; border: none; color: #6B7280; cursor: pointer; padding: 4px;
  }

  /* Mobile menu */
  .pub-mmenu {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(8,10,16,0.97);
    padding: 24px 28px 40px;
    transform: translateX(100%); transition: transform 0.32s cubic-bezier(0.4,0,0.2,1);
  }
  .pub-mmenu.open { transform: translateX(0); }
  .pub-mmenu-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 52px; }
  .pub-mmenu-link {
    font-family: var(--font-display);
    font-size: 26px; font-weight: 700; color: #4B5563;
    padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: color 0.2s; display: block; text-decoration: none; cursor: pointer;
  }
  .pub-mmenu-link:hover, .pub-mmenu-link.active { color: #F0F2FF; }
  .pub-mmenu-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 44px; }
  .pub-btn-full-primary {
    padding: 15px; border-radius: 12px; font-size: 16px; font-weight: 700;
    background: #1E5EFF; color: white; text-align: center; text-decoration: none; display: block;
  }
  .pub-btn-full-ghost {
    padding: 15px; border-radius: 12px; font-size: 16px; font-weight: 700;
    border: 1px solid rgba(255,255,255,0.1); color: #9CA3AF;
    text-align: center; text-decoration: none; display: block;
  }

  @media (max-width: 768px) {
    .pub-nav-links, .pub-nav-actions { display: none; }
    .pub-hamburger { display: block; }
    .pub-nav { padding: 0 16px; }
  }
`

export default function PublicNav({ activePage }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <style>{CSS}</style>

      <nav className={`pub-nav${scrolled ? ' scrolled' : ''}`}>
        <Link href="/" className="pub-nav-logo">
          <TikkitXLogo size="md" />
        </Link>

        <div className="pub-nav-links">
          <Link href="/#features" className={`pub-nav-link${activePage === 'home' ? ' active' : ''}`}>Features</Link>
          <Link href="/how-it-works" className={`pub-nav-link${activePage === 'how-it-works' ? ' active' : ''}`}>How it works</Link>
          <Link href="/explore" className={`pub-nav-link${activePage === 'explore' ? ' active' : ''}`}>Explore</Link>
          <Link href="/blog" className="pub-nav-link">Blog</Link>
        </div>

        <div className="pub-nav-actions">
          <Link href="/auth/login" className="pub-btn-ghost">Log in</Link>
          <Link href="/auth/login" className="pub-btn-nav">Get started <ArrowRight size={14} /></Link>
        </div>

        <button className="pub-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`pub-mmenu${menuOpen ? ' open' : ''}`} role="dialog" aria-modal="true">
        <div className="pub-mmenu-header">
          <TikkitXLogo size="md" />
          <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        <Link href="/#features" className="pub-mmenu-link" onClick={() => setMenuOpen(false)}>Features</Link>
        <Link href="/how-it-works" className="pub-mmenu-link" onClick={() => setMenuOpen(false)}>How it works</Link>
        <Link href="/explore" className={`pub-mmenu-link${activePage === 'explore' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Explore</Link>
        <Link href="/blog" className="pub-mmenu-link" onClick={() => setMenuOpen(false)}>Blog</Link>
        <div className="pub-mmenu-actions">
          <Link href="/auth/login" className="pub-btn-full-primary">Get started free</Link>
          <Link href="/auth/login" className="pub-btn-full-ghost">Log in</Link>
        </div>
      </div>
    </>
  )
}
