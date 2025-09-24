import React, { useMemo } from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';

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

const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 300,
  showGrid = true,
  showLegend = false,
  horizontal = false,
  gradient = true,
}) => {
  const defaultColors = ['#00FF88', '#00D4FF', '#FFD700', '#9333EA', '#FF4444'];

  const chartOptions = useMemo<Highcharts.Options>(() => {
    const categories = data.map(d => d.name);
    const seriesData = data.map((d, index) => {
      const color = d.color || defaultColors[index % defaultColors.length];

      if (gradient) {
        return {
          y: d.value,
          color: {
            linearGradient: horizontal
              ? { x1: 0, x2: 1, y1: 0, y2: 0 }
              : { x1: 0, x2: 0, y1: 0, y2: 1 },
            stops: [
              [0, color],
              [1, Highcharts.color(color).setOpacity(0.3).get('rgba')]
            ] as Highcharts.GradientColorStopObject[]
          }
        };
      }

      return {
        y: d.value,
        color: color
      };
    });

    return {
      chart: {
        type: horizontal ? 'bar' : 'column',
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
        gridLineWidth: 0
      },
      yAxis: {
        title: {
          text: null
        },
        labels: {
          style: {
            color: '#6B7280',
            fontSize: '12px'
          }
        },
        gridLineWidth: showGrid ? 1 : 0,
        gridLineColor: '#1F2937',
        gridLineDashStyle: 'Dot'
      },
      legend: {
        enabled: showLegend
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: '#374151',
        borderRadius: 12,
        style: {
          color: '#FFFFFF',
          fontSize: '12px'
        },
        formatter: function() {
          return `<b>${this.x}</b><br/>
                  <span style="color:${this.color}">Value:</span> <b>${this.y?.toLocaleString()}</b>`;
        }
      },
      plotOptions: {
        series: {
          borderRadius: 8,
          borderWidth: 0,
          dataLabels: {
            enabled: false
          }
        },
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 8
        },
        bar: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 8
        }
      },
      series: [{
        name: 'Value',
        type: horizontal ? 'bar' : 'column',
        data: seriesData,
        showInLegend: false
      }]
    };
  }, [data, height, showGrid, showLegend, horizontal, gradient, defaultColors]);

  return (
    <div className="highcharts-container">
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
      />
    </div>
  );
};

export default BarChart;