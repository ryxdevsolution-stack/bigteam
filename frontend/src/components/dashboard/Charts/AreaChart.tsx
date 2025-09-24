import React, { useMemo } from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { format } from 'date-fns';

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

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  dataKeys = [
    { key: 'users', color: '#00FF88', name: 'Users' },
    { key: 'engagement', color: '#00D4FF', name: 'Engagement' },
  ],
  height = 300,
  showGrid = true,
  showLegend = true,
}) => {
  const chartOptions = useMemo<Highcharts.Options>(() => {
    const categories = data.map(d => format(new Date(d.date), 'MMM dd'));

    const series = dataKeys.map(dataKey => ({
      name: dataKey.name,
      type: 'area' as const,
      data: data.map(d => d[dataKey.key] as number || 0),
      color: dataKey.color,
      fillColor: {
        linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
        stops: [
          [0, dataKey.color],
          [1, Highcharts.color(dataKey.color).setOpacity(0.1).get('rgba')]
        ] as Highcharts.GradientColorStopObject[]
      },
      lineWidth: 2,
      marker: {
        enabled: false,
        symbol: 'circle',
        radius: 4,
        states: {
          hover: {
            enabled: true,
            radius: 6
          }
        }
      }
    }));

    return {
      chart: {
        type: 'area',
        height: height,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'inherit'
        }
      },
      title: {
        text: undefined
      },
      credits: {
        enabled: false
      },
      xAxis: {
        categories: categories,
        labels: {
          style: {
            color: '#6B7280',
            fontSize: '12px'
          }
        },
        lineColor: '#374151',
        tickColor: '#374151',
        gridLineWidth: showGrid ? 1 : 0,
        gridLineColor: '#1F2937',
        gridLineDashStyle: 'Dot'
      },
      yAxis: {
        title: {
          text: null
        },
        labels: {
          style: {
            color: '#6B7280',
            fontSize: '12px'
          },
          formatter: function() {
            return `${((this.value as number) / 1000).toFixed(0)}k`;
          }
        },
        gridLineWidth: showGrid ? 1 : 0,
        gridLineColor: '#1F2937',
        gridLineDashStyle: 'Dot'
      },
      legend: {
        enabled: showLegend,
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: {
          color: '#9CA3AF',
          fontSize: '12px',
          fontWeight: 'normal'
        },
        itemHoverStyle: {
          color: '#FFFFFF'
        }
      },
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: '#374151',
        borderRadius: 12,
        style: {
          color: '#FFFFFF',
          fontSize: '12px'
        },
        formatter: function() {
          const points = this.points || [];
          let tooltipHtml = `<b>${this.x}</b><br/>`;

          points.forEach(point => {
            tooltipHtml += `<span style="color:${point.color}">${point.series.name}</span>: <b>${point.y?.toLocaleString()}</b><br/>`;
          });

          return tooltipHtml;
        }
      },
      plotOptions: {
        area: {
          stacking: undefined,
          lineColor: undefined,
          lineWidth: 2,
          marker: {
            lineWidth: 1,
            lineColor: undefined
          }
        }
      },
      series: series
    };
  }, [data, dataKeys, height, showGrid, showLegend]);

  return (
    <div className="highcharts-container">
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
      />
    </div>
  );
};

export default AreaChart;