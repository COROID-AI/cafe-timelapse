import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ERA_CONFIGS, ERA_YEARS } from "../eras/eraConfig";
import type { EraConfig } from "../eras/eraConfig";
import { clamp01, easeInOutCubic, TRANSITION_DURATION_MS } from "../utils/timeline";
import { useEraStore } from "../state/eraStore";

/**
 * Era transition core (handoff findings 56610b82 + d25328b1):
 *
 * A single mutable module-level object holds blend state. Every scene
 * component reads it inside its own useFrame subscription and mutates
 * materials/visibility directly. React never re-renders during a
 * transition, and era-specific sub-trees stay mounted permanently, so
 * there are no remount janks and no GC churn.
 */

export interface TransitionState {
  /** Era index the blend started from. */
  from: number;
  /** Era index currently being blended to. */
  to: number;
  /** Raw linear progress 0→1. */
  progress: number;
  /** Eased progress consumed by scene components. */
  t: number;
}

export const transitionState: TransitionState = {
  from: 0,
  to: 0,
  progress: 1,
  t: 1,
};

/** Which discrete era variant owns the stage right now. */
export function dominantEraIndex(): number {
  return transitionState.progress < 0.5 ? transitionState.from : transitionState.to;
}

// Shared scratch colour (rAF is single-threaded; safe to reuse).
const tmpTo = new THREE.Color();

/** Lerps two hex colours by the current eased blend into `out`. */
export function lerpEraColor(aHex: string, bHex: string, t: number, out: THREE.Color): THREE.Color {
  return out.set(aHex).lerp(tmpTo.set(bHex), t);
}

/** Convenience: mixes one named palette slot between the active eras. */
export function mixPaletteSlot(
  slot: keyof EraConfig["palette"],
  out: THREE.Color,
): THREE.Color {
  const a = ERA_CONFIGS[ERA_YEARS[transitionState.from]].palette[slot];
  const b = ERA_CONFIGS[ERA_YEARS[transitionState.to]].palette[slot];
  return lerpEraColor(a, b, transitionState.t, out);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function TransitionController() {
  const eraIndex = useEraStore((s) => s.eraIndex);

  useEffect(() => {
    const st = transitionState;
    if (eraIndex === st.to) return;
    // Mid-transition retarget: resolve from whichever side dominates so
    // the blend never visibly rewinds.
    st.from = st.progress >= 1 ? st.to : st.progress < 0.5 ? st.from : st.to;
    st.to = eraIndex;
    st.progress = prefersReducedMotion() ? 1 : 0;
    st.t = st.progress;
  }, [eraIndex]);

  useFrame((_, delta) => {
    const st = transitionState;
    if (st.progress >= 1) return;
    // Clamp delta so tab-suspension never teleports the blend.
    const d = Math.min(delta, 1 / 20);
    st.progress = clamp01(st.progress + (d * 1000) / TRANSITION_DURATION_MS);
    st.t = easeInOutCubic(st.progress);
  });

  return null;
}
