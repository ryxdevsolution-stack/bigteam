import React, { useMemo } from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';

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

const PieChart: React.FC<PieChartProps> = ({
  data,
  height = 300,
  showLegend = true,
  donut = true,
}) => {
  const defaultColors = ['#00FF88', '#00D4FF', '#FFD700', '#9333EA', '#FF4444', '#F97316'];

  const chartOptions = useMemo<Highcharts.Options>(() => {
    const total = data.reduce((sum, entry) => sum + entry.value, 0);

    const seriesData = data.map((d, index) => {
      const color = d.color || defaultColors[index % defaultColors.length];
      return {
        name: d.name,
        y: d.value,
        color: {
          linearGradient: { x1: 0, x2: 1, y1: 0, y2: 1 },
          stops: [
            [0, color],
            [1, Highcharts.color(color).setOpacity(0.6).get('rgba')]
          ] as Highcharts.GradientColorStopObject[]
        },
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.0f}%',
          distance: donut ? -30 : 10,
          style: {
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 'bold',
            textOutline: 'none'
          }
        }
      };
    });

    return {
      chart: {
        type: 'pie',
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
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: '#374151',
        borderRadius: 12,
        style: {
          color: '#FFFFFF',
          fontSize: '12px'
        },
        formatter: function() {
          const percentage = ((this.y as number) / total * 100).toFixed(1);
          return `<b>${this.point.name}</b><br/>
                  <span style="color:${this.color}">Value:</span> <b>${this.y?.toLocaleString()}</b><br/>
                  <span style="color:${this.color}">Percentage:</span> <b>${percentage}%</b>`;
        }
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          depth: 35,
          innerSize: donut ? '50%' : '0%',
          borderWidth: 0,
          borderColor: null,
          dataLabels: {
            enabled: true,
            distance: donut ? -30 : 10
          },
          showInLegend: showLegend,
          animation: {
            duration: 1000
          },
          states: {
            hover: {
              brightness: 0.1
            }
          }
        }
      },
      legend: {
        enabled: showLegend,
        align: 'center',
        verticalAlign: 'bottom',
        layout: 'horizontal',
        itemStyle: {
          color: '#9CA3AF',
          fontSize: '12px',
          fontWeight: 'normal'
        },
        itemHoverStyle: {
          color: '#FFFFFF'
        },
        itemMarginTop: 10,
        symbolRadius: 6,
        symbolHeight: 12,
        symbolWidth: 12
      },
      series: [{
        type: 'pie',
        name: 'Share',
        colorByPoint: true,
        data: seriesData
      }]
    };
  }, [data, height, showLegend, donut, defaultColors]);

  return (
    <div className="highcharts-container">
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
      />
    </div>
  );
};

export default PieChart;