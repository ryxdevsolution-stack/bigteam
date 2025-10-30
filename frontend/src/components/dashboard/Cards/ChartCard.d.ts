import React from 'react';
interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    delay?: number;
}
declare const ChartCard: React.FC<ChartCardProps>;
export default ChartCard;
