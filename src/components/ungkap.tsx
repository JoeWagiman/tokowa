"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Ungkap({
  children,
  jeda = 0,
  className,
}: {
  children: ReactNode;
  jeda?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("terlihat");
      return;
    }
    const io = new IntersectionObserver(
      (masuk) => {
        for (const m of masuk) {
          if (m.isIntersecting) {
            el.classList.add("terlihat");
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`ungkap${className ? ` ${className}` : ""}`} style={{ transitionDelay: `${jeda}ms` }}>
      <noscript>
        <style>{`.ungkap{opacity:1 !important;transform:none !important}`}</style>
      </noscript>
      {children}
    </div>
  );
}
