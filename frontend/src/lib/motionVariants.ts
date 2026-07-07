import type { Variants } from "motion/react";

/**
 * Shared Motion variants for page-load stagger animations.
 * Used across Workout, Profile, Dishes, and Tracker pages.
 *
 * Usage:
 *   <motion.div variants={STAGGER_CONTAINER} initial="hidden" animate="show">
 *     {items.map(item => (
 *       <motion.div key={item.id} variants={STAGGER_ITEM}>
 *         <Card ... />
 *       </motion.div>
 *     ))}
 *   </motion.div>
 */

export const STAGGER_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

export const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25 } },
};
