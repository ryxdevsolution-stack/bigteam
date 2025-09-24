import React from 'react';
import { motion } from 'framer-motion';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-glass-light backdrop-blur-xl border border-light-300 dark:border-dark-800 hover:border-accent-bitcoin/50 dark:hover:border-accent-bitcoin/30 hover:shadow-lg hover:shadow-accent-bitcoin/10 transition-all duration-300 ${className}`}
    >
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-dark-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs sm:text-sm text-dark-600 dark:text-dark-400 mt-1">{subtitle}</p>}
      </div>

      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
};

export default ChartCard;