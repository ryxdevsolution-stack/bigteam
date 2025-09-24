import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  sparkline?: number[];
  delay?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  trend = 'neutral',
  icon,
  sparkline,
  delay = 0,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-dark-600 dark:text-dark-400';
    }
  };

  const renderSparkline = () => {
    if (!sparkline || sparkline.length === 0) return null;

    const max = Math.max(...sparkline);
    const min = Math.min(...sparkline);
    const height = 40;
    const width = 100;
    const points = sparkline
      .map((val, i) => {
        const x = (i / (sparkline.length - 1)) * width;
        const y = height - ((val - min) / (max - min)) * height;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4 opacity-20" width={width} height={height}>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
          className={getTrendColor()}
        />
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      className="relative p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-glass-light backdrop-blur-xl border border-light-300 dark:border-dark-800 hover:border-accent-bitcoin/50 dark:hover:border-accent-bitcoin/30 hover:shadow-lg hover:shadow-accent-bitcoin/10 transition-all duration-300 overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-dark-600 dark:text-dark-400 text-xs sm:text-sm mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-dark-900 dark:text-white">
                {prefix}
                <CountUp
                  start={0}
                  end={value}
                  duration={2.5}
                  separator=","
                  decimals={value % 1 !== 0 ? 2 : 0}
                />
                {suffix}
              </span>
            </div>
          </div>
          {icon && (
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-accent-bitcoin/10 dark:bg-glass-medium backdrop-blur-sm">
              {icon}
            </div>
          )}
        </div>

        {change !== undefined && (
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-dark-600 dark:text-dark-400">vs last month</span>
          </div>
        )}
      </div>

      {renderSparkline()}

      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent-bitcoin/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
};

export default MetricCard;