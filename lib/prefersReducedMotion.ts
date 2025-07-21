// hooks/useDirectionalExitMotion.ts
import { useReducedMotion } from "framer-motion";

/** Expose raw prefersReducedMotion value */
export const usePrefersReducedMotion = useReducedMotion;

/** Hook that returns exit variants based on direction and motion preference */
export function useDirectionalExitMotion() {
  const prefersReducedMotion = useReducedMotion();

  const getExitVariant = (direction: number) => ({
    x: prefersReducedMotion ? 0 : direction < 0 ? 30 : -30,
    opacity: 0,
  });

  return { getExitVariant, prefersReducedMotion };
}
