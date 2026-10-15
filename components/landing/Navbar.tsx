"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "./icons";

const products = [
  { label: "Asesmen Minat & Bakat", href: "#fitur" },
  { label: "Analisis Hasil", href: "#fitur" },
  { label: "Chat bersama Tera", href: "#preview" },
];

export default function Navbar({ authSlot }: { authSlot?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-overlay/5 bg-bg/70 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-[15px] font-semibold tracking-tight text-fg"
          >
            Terang<span className="text-fg-faint">.in</span>
          </Link>

          <div className="hidden items-center gap-6 text-[13px] text-fg-muted sm:flex">
            <div className="relative" ref={ref}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1 transition-colors hover:text-fg"
                aria-expanded={open}
                aria-haspopup="true"
              >
                Products
                <ChevronDown
                  className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open && (
                <div className="absolute left-0 top-8 w-52 rounded-xl border border-overlay/10 bg-surface p-1.5 shadow-2xl">
                  {products.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2 text-[13px] text-fg-secondary transition-colors hover:bg-overlay/5 hover:text-fg"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link
              href="#pricing"
              className="transition-colors hover:text-fg"
            >
              Pricing
            </Link>
          </div>
        </div>

        {authSlot ?? (
          <div className="flex items-center gap-1.5">
            <Link
              href="/login"
              className="hidden h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] text-fg-secondary transition-colors hover:text-fg sm:flex"
            >
              Ask Us
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/signup"
              className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
            >
              Get Started
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
