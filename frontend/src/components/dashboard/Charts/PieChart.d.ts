import React from 'react';
interface PieChartData {
    name: string;
    value: number;
    color?: string;
}
interface PieChartProps {
    data: PieChartData[];
    height?: number;
    showLegend?: boolean;
    donut?: boolean;
}
declare const PieChart: React.FC<PieChartProps>;
export default PieChart;
