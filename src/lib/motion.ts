export const EASE = [0.16, 1, 0.3, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } }
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } }
};

export const clipReveal = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  visible: { clipPath: "inset(0 0 0% 0)", transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1] as const } }
};

export const cardHover = {
  rest: { y: 0, borderColor: "rgba(237,232,223,0.14)" },
  hover: { y: -2, borderColor: "rgba(201,154,75,0.4)", transition: { duration: 0.2 } }
};
