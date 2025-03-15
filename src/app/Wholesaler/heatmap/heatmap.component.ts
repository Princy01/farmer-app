import { Component, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import {
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexPlotOptions,
  ApexDataLabels,
  ApexLegend,
  ApexTooltip,
  NgApexchartsModule
} from 'ng-apexcharts';

export interface HeatmapOptions {
  series: any[];
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  tooltip: ApexTooltip;
}

@Component({
  selector: 'app-heatmap',
  template: `
    <apx-chart
      [series]="chartOptions.series"
      [chart]="chartOptions.chart"
      [xaxis]="chartOptions.xaxis"
      [yaxis]="chartOptions.yaxis"
      [plotOptions]="chartOptions.plotOptions"
      [dataLabels]="chartOptions.dataLabels"
      [legend]="chartOptions.legend"
      [tooltip]="chartOptions.tooltip"
    ></apx-chart>
  `,
  standalone: true,
  imports: [NgApexchartsModule]
})
export class HeatmapComponent {
  private toastController = inject(ToastController);
  chartOptions: HeatmapOptions;

  constructor() {
    this.chartOptions = {
      series: this.generateConfusionMatrixData(),
      chart: {
        height: 350,
        type: 'heatmap',
        events: {
          dataPointSelection: async (event, chartContext, config) => {
            const selectedData = config.w.config.series[config.seriesIndex].data[config.dataPointIndex];
            this.showToast(`Class: ${selectedData.x}, Value: ${selectedData.y}`);
          }
        }
      },
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: [
              { from: 0, to: 30, color: 'rgb(136, 172, 140)', name: 'Low' },
              { from: 31, to: 60, color: 'rgb(255, 99, 71)', name: 'Medium' },
              { from: 61, to: 100, color: 'rgb(70, 130, 180)', name: 'High' }
            ]
          }
        }
      },
      dataLabels: { enabled: true },
      legend: { show: true },
      tooltip: { enabled: true },
      xaxis: {
        categories: this.getCategories()
      },
      yaxis: {
        labels: {
          formatter: (val: any, index: number) => this.getCategories()[index]
        }
      }
    };
  }

  getCategories() {
    return ['Class A', 'Class B', 'Class C', 'Class D', 'Class E', 'Class F'];
  }

  generateConfusionMatrixData() {
    const classes = 6;
    return Array.from({ length: classes }, (_, rowIndex) => ({
      name: `Class ${String.fromCharCode(65 + rowIndex)}`,
      data: Array.from({ length: classes }, (_, colIndex) => ({
        x: `Class ${String.fromCharCode(65 + colIndex)}`,
        y: this.generateMatrixValue(rowIndex, colIndex)
      }))
    }));
  }

  generateMatrixValue(row: number, col: number): number {
    return row === col ? 90 + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 30);
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'warning'
    });
    await toast.present();
  }
}
