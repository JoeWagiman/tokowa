"use client";

import { useEffect, useRef } from "react";

export function Pita({ items, balik = false }: { items: string[]; balik?: boolean }) {
  const dalamRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dalam = dalamRef.current;
    const set = setRef.current;
    if (!dalam || !set) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let x = 0;
    let terakhir = performance.now();
    let terlihat = true;
    let w = set.offsetWidth;
    const ukur = () => {
      w = set.offsetWidth;
    };
    window.addEventListener("resize", ukur);
    if (document.fonts) {
      void document.fonts.ready.then(ukur);
    }
    const io = new IntersectionObserver(
      ([m]) => {
        terlihat = m.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(dalam);
    const KECEPATAN = 28;
    const putar = (t: number) => {
      const dt = Math.min(64, t - terakhir);
      terakhir = t;
      if (terlihat) {
        if (w > 0) {
          x += ((balik ? KECEPATAN : -KECEPATAN) * dt) / 1000;
          if (x <= -w) x += w;
          if (x > 0) x -= w;
          dalam.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
        }
      }
      raf = requestAnimationFrame(putar);
    };
    raf = requestAnimationFrame(putar);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", ukur);
    };
  }, [balik]);

  return (
    <div className="pita" aria-hidden="true">
      <div ref={dalamRef} className="pita-dalam">
        <div ref={setRef} className="pita-set">
          {items.map((label) => (
            <span key={label} className="pita-chip">
              {label}
            </span>
          ))}
        </div>
        <div className="pita-set" aria-hidden="true">
          {items.map((label) => (
            <span key={`ulang-${label}`} className="pita-chip">
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
