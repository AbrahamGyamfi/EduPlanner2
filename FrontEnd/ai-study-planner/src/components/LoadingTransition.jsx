import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const LoadingTransition = ({ isOpen, message, subMessage }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center"
        >
          {/* Animated Spinner */}
          <motion.div
            className="w-20 h-20 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full"
            animate={{
              rotate: 360,
            }}
            transition={{
              loop: Infinity,
              ease: "linear",
              duration: 1
            }}
          />

          {/* Loading Messages */}
          <div className="text-center mt-6">
            <motion.h2 
              className="text-2xl font-bold text-white mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            >
              {message}
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-300"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            >
              {subMessage}
            </motion.p>
          </div>

          {/* Bouncing Dots */}
          <motion.div className="flex space-x-2 mt-8">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-blue-400 rounded-full"
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  delay: i * 0.2,
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingTransition;
