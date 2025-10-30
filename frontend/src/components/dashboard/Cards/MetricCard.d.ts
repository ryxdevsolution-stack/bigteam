import React from 'react';
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
declare const MetricCard: React.FC<MetricCardProps>;
export default MetricCard;
