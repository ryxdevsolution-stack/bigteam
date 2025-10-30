import React from 'react';
interface DataPoint {
    date: string;
    users?: number;
    posts?: number;
    engagement?: number;
    revenue?: number;
}
interface AreaChartProps {
    data: DataPoint[];
    dataKeys?: Array<{
        key: keyof DataPoint;
        color: string;
        name: string;
    }>;
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
}
declare const AreaChart: React.FC<AreaChartProps>;
export default AreaChart;
