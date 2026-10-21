"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Clock } from "./Clock";

type Props = {
  /** Highlight the blog link. */
  blog?: boolean;
  /** Right-hand link, defaults to "start trial". */
  cta?: { href: string; label: string; external?: boolean };
  /** Adds the reading progress bar under the menu. Give the inner <i> an id the page script can drive. */
  progress?: boolean;
};

export function Header({ blog, cta = { href: "/signup", label: "start trial", external: false }, progress }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isExternal = cta.external ?? cta.href.startsWith("http");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <header className={`bar ${open ? "is-open" : ""}`}>
      <div className="in">
        <Link className="brand" href="/" aria-label="Doubtster home" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/doubtster-logo-light.svg" alt="Doubtster" height={36} />
        </Link>
        <nav aria-label="Main" className="nav-desk">
          <Link href="/#features">features</Link>
          <Link href="/examples">examples</Link>
          <Link href="/#pricing">pricing</Link>
          <Link href="/#faq">faq</Link>
          <Link href="/blog" aria-current={blog ? "page" : undefined}>blog</Link>
        </nav>
        <div className="logo" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/doubtster-icon.svg" alt="" width={28} height={28} />
        </div>
        <div className="r">
          <span><Clock /></span>
          <Link href="/login" className="login-link">log in</Link>
          {isExternal ? (
            <a href={cta.href} target="_blank" rel="noopener noreferrer" className="cta-link">{cta.label}</a>
          ) : (
            <Link href={cta.href} className="cta-link">{cta.label}</Link>
          )}
          <button
            type="button"
            className="menu-btn"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="17" y2="6" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="14" x2="17" y2="14" />
              </svg>
            )}
          </button>
        </div>
        {progress && (
          <div className="pbar" aria-hidden="true">
            <i id="pbar" />
          </div>
        )}
      </div>

      {open && mounted && createPortal(
        <div className="mob-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <div className="mob-backdrop" onClick={() => setOpen(false)} />
          <div className="mob-menu">
            <nav className="mob-links" aria-label="Mobile Navigation">
              <Link href="/#features" onClick={() => setOpen(false)}>features</Link>
              <Link href="/examples" onClick={() => setOpen(false)}>examples</Link>
              <Link href="/#pricing" onClick={() => setOpen(false)}>pricing</Link>
              <Link href="/#faq" onClick={() => setOpen(false)}>faq</Link>
              <Link href="/blog" aria-current={blog ? "page" : undefined} onClick={() => setOpen(false)}>blog</Link>
            </nav>
            <div className="mob-actions">
              <Link href="/login" className="mob-login" onClick={() => setOpen(false)}>
                log in
              </Link>
              {isExternal ? (
                <a href={cta.href} target="_blank" rel="noopener noreferrer" className="mob-cta" onClick={() => setOpen(false)}>
                  {cta.label}
                </a>
              ) : (
                <Link href={cta.href} className="mob-cta" onClick={() => setOpen(false)}>
                  {cta.label}
                </Link>
              )}
            </div>
            <div className="mob-foot">
              <span>Current time: <Clock /></span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
