import type { Variants, Transition } from "framer-motion";

const springFast: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 20,
};

const springSoft: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 24,
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: springSoft },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: springSoft },
};

export const cardFlipEnter: Variants = {
  initial: { opacity: 0, scale: 0.9, rotate: -4 },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: springFast,
  },
};

export const glowTap: Variants = {
  initial: { scale: 1 },
  tap: { scale: 0.95 },
  hover: { scale: 1.04 },
};

