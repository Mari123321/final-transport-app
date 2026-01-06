// src/components/AnimatedPage.jsx
import { motion } from 'framer-motion';

const AnimatedPage = ({ children }) => {
  const animations = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.5, ease: 'easeInOut' },
  };

  return (
    <motion.div
      initial={animations.initial}
      animate={animations.animate}
      exit={animations.exit}
      transition={animations.transition}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
