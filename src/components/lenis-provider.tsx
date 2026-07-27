"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig } from "framer-motion";
import { ReactNode, useCallback, useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reads the OS "reduce motion" setting without tripping hydration.
 *
 * `useSyncExternalStore` renders the server snapshot (false) during SSR and
 * hydration, then immediately re-renders with the real value. Nothing here
 * emits markup, so the swap is invisible; it just re-runs the effect inside
 * ReactLenis with the native-scroll options.
 */
function usePrefersReducedMotion(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );
}

/**
 * Smooth scrolling is the default, but scrolling IS the interaction model of
 * a long-form reading blog. Overriding it with heavy inertia for precisely
 * the readers who asked their OS for less motion breaks the core use case
 * for that group, and Lenis does not self-suppress.
 *
 * With `smoothWheel: false` (and `syncTouch` off), Lenis takes its own
 * "native" branch on every wheel and touch event: it stops its animation and
 * returns without preventing the default, so the browser scrolls the page
 * itself. Swapping the options object also re-creates the instance without
 * unmounting the tree, so no scroll position or component state is lost.
 */
const SMOOTH_SCROLL = {
  lerp: 0.08,
  duration: 1.4,
  smoothWheel: true,
  autoRaf: true,
} as const;

const NATIVE_SCROLL = {
  smoothWheel: false,
  syncTouch: false,
  autoRaf: false,
} as const;

export function LenisProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis
        root
        options={prefersReducedMotion ? NATIVE_SCROLL : SMOOTH_SCROLL}
      >
        {children}
      </ReactLenis>
    </MotionConfig>
  );
}
