"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement for the landing page: the nav gains a backdrop once you scroll, and
 * sections marked [data-reveal] ease in as they enter the viewport. Without JS everything is visible.
 */
export function LandingEffects() {
  useEffect(() => {
    const root = document.querySelector(".landing");
    if (!root) return;

    const onScroll = () => root.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      return () => window.removeEventListener("scroll", onScroll);
    }

    root.classList.add("js-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    root.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return null;
}
