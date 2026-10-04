import { Easing, useReducedMotion } from 'react-native-reanimated';

/** Durations in ms, from the v2 design (univpn-v2-final.html, section 8). */
export const Motion = {
  press: 140,
  text: 220,
  sheetIn: 300,
  sheetOut: 200,
  dialogIn: 200,
  dialogOut: 140,
  listStagger: 40,
} as const;

export const Ease = {
  out: Easing.out(Easing.ease),
  inOut: Easing.inOut(Easing.ease),
  in: Easing.in(Easing.ease),
  sheet: Easing.bezier(0.2, 0.8, 0.2, 1),
};

/** Returns `ms`, or 0 when the system asks for reduced motion (animation jumps to its end state). */
export function useMotionDuration(ms: number) {
  return useReducedMotion() ? 0 : ms;
}
