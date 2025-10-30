import React from 'react';
interface BarChartData {
    name: string;
    value: number;
    color?: string;
}
interface BarChartProps {
    data: BarChartData[];
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    horizontal?: boolean;
    gradient?: boolean;
}
declare const BarChart: React.FC<BarChartProps>;
export default BarChart;
