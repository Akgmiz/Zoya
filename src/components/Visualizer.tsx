import { motion } from "motion/react";

export function Visualizer({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <motion.div
        animate={{
          scale: isActive ? [1, 1.5, 1] : 1,
          opacity: isActive ? [0.4, 0.8, 0.4] : 0.1,
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-rose-500 rounded-full blur-2xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: isActive ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2
        }}
        className="absolute inset-4 bg-rose-400 rounded-full blur-md opacity-50 pointer-events-none"
      />
      
      <div className="relative z-10 w-28 h-28 bg-gradient-to-br from-rose-500 to-rose-700 rounded-full flex items-center justify-center shadow-lg border-4 border-rose-300/30">
        <span className="text-white font-rajdhani font-bold text-2xl tracking-widest uppercase">Zoya</span>
      </div>
    </div>
  );
}
