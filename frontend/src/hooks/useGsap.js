import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Custom React hook for GSAP animations with automatic lifecycle cleanup via gsap.context().
 * Respects prefers-reduced-motion to ensure accessibility.
 *
 * @param {React.RefObject} scopeRef - Container element ref to scope selectors
 * @param {Function} animationFn - Function receiving (ctx, isReduced) to define animations
 * @param {Array} deps - Dependency array for re-triggering animation
 */
export function useGsap(scopeRef, animationFn, deps = []) {
  useEffect(() => {
    if (!scopeRef.current) return;

    const isReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      animationFn(isReduced);
    }, scopeRef);

    return () => ctx.revert();
  }, deps);
}

/**
 * Reusable scroll reveal hook using GSAP ScrollTrigger.
 * Elements with selector or target fade and slide up smoothly when scrolled into view.
 */
export function useGsapScrollReveal(containerRef, selector, options = {}) {
  const {
    stagger = 0.12,
    y = 28,
    duration = 0.75,
    ease = "power2.out",
    start = "top 88%",
  } = options;

  useGsap(
    containerRef,
    (isReduced) => {
      const elements = containerRef.current.querySelectorAll(selector);
      if (!elements || elements.length === 0) return;

      if (isReduced) {
        gsap.set(elements, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        elements,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease,
          scrollTrigger: {
            trigger: containerRef.current,
            start,
            toggleActions: "play none none none",
          },
        },
      );
    },
    [selector],
  );
}
