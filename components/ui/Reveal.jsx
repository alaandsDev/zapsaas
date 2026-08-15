"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Reveal — continuity/feedback primitive for scroll entrances.
 *
 * Fires once when the element crosses into view, using transform + opacity
 * only (no layout properties) so it never causes reflow or CLS. Honors
 * `prefers-reduced-motion` by skipping straight to the visible state.
 *
 * Not meant to wrap every section identically — use `delay` to stagger a
 * genuine list of cards, and skip wrapping decorative or already-animated
 * elements (framer-motion driven UI, looping mockups, etc).
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`${className} transition-[opacity,transform] duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
