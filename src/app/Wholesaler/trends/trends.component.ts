import { Component } from '@angular/core';
import {
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexLegend,
  ApexTooltip,
  NgApexchartsModule
} from 'ng-apexcharts';

export interface TrendsOptions {
  series: any[];
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  tooltip: ApexTooltip;
}

@Component({
  selector: 'app-trends',
  template: `
    <div style="display: flex; align-items: center;">
      <button (click)="navigate('left')">&#8592;</button>
      <div style="background-color: rgb(49, 1, 1); padding: 10px; border: 2px solid black;">
        <h3 style="color: white;">Trends</h3>
        <apx-chart
          [series]="chartOptions.series"
          [chart]="chartOptions.chart"
          [xaxis]="chartOptions.xaxis"
          [yaxis]="chartOptions.yaxis"
          [dataLabels]="chartOptions.dataLabels"
          [legend]="chartOptions.legend"
          [tooltip]="chartOptions.tooltip"
        ></apx-chart>
      </div>
      <button (click)="navigate('right')">&#8594;</button>
    </div>

  `,
  standalone: true,
  imports: [NgApexchartsModule]
})
export class TrendsComponent {
  chartOptions: TrendsOptions;

  constructor() {
    this.chartOptions = {
      series: this.generateTrendData(),
      chart: {
        height: 200,
        type: 'scatter'
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#ffffff']
        }
      },
      legend: { show: false },
      tooltip: { enabled: true },
      xaxis: {
        categories: [0, 1, 2, 3],
        labels: {
          style: {
            colors: '#ffffff'
          }
        }
      },
      yaxis: {
        min: 0,
        max: 5,
        labels: {
          style: {
            colors: '#ffffff'
          }
        }
      }
    };
  }

  navigate(direction: string) {
    alert(`Navigating ${direction} to another screen.`);
  }

  generateTrendData() {
    return [
      {
        name: 'Trends',
        data: [
          { x: 0, y: 2 },
          { x: 1, y: 4 },
          { x: 2, y: 3 },
          { x: 3, y: 1 }
        ]
      }
    ];
  }
}
