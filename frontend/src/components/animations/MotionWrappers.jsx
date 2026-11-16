import { motion, useReducedMotion } from "motion/react";

/**
 * Smooth entrance animation wrapper for sections, headers, or content blocks.
 */
export function FadeIn({ children, className = "", delay = 0, duration = 0.45, y = 12, ...rest }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // Custom smooth ease-out
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Orchestrates staggered entrance for child cards, list items, or metrics.
 */
export function StaggerContainer({
  children,
  className = "",
  stagger = 0.08,
  delayChildren = 0.05,
  ...rest
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual item inside a StaggerContainer.
 */
export function StaggerItem({ children, className = "", y = 14, ...rest }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  const itemVariants = {
    hidden: { opacity: 0, y },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

/**
 * Subtle interactive card lift on hover.
 */
export function HoverLift({ children, className = "", y = -3, ...rest }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
