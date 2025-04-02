import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

register();

@Component({
  selector: 'app-stock-insights',
  template: `
    <ion-content>
      <swiper-container [slidesPerView]="1" [pagination]="true">
        <!-- Current Stock Levels -->
        <swiper-slide>
          <div class="chart-container">
            <h3>Current Stock Levels</h3>
            <apx-chart
              [series]="stockLevelsOptions.series"
              [chart]="stockLevelsOptions.chart"
              [xaxis]="stockLevelsOptions.xaxis"
              [yaxis]="stockLevelsOptions.yaxis"
              [colors]="stockLevelsOptions.colors"
              [plotOptions]="stockLevelsOptions.plotOptions"
            ></apx-chart>
          </div>
        </swiper-slide>

        <!-- Low Stock Alerts -->
        <swiper-slide>
          <div class="chart-container">
            <h3>Low Stock Alerts</h3>
            <ion-list class="alerts-container">
              <ion-item *ngFor="let alert of lowStockAlerts"
                       [class]="alert.severity">
                <ion-label>
                  <h2>{{alert.product}}</h2>
                  <p>Current Stock: {{alert.currentStock | number}} kg</p>
                  <p>Threshold: {{alert.threshold | number}} kg</p>
                </ion-label>
                <ion-badge slot="end" [color]="getAlertColor(alert.severity)">
                  {{alert.severity | uppercase}}
                </ion-badge>
              </ion-item>
            </ion-list>
          </div>
        </swiper-slide>
      </swiper-container>
    </ion-content>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    swiper-container {
      height: 100%;
    }
    .chart-container {
      width: 100%;
      height: 100%;
      padding: 20px;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h3 {
      color: #333;
      margin-bottom: 20px;
      text-align: center;
    }
    .alerts-container {
      height: calc(100% - 60px);
      overflow-y: auto;
      padding: 0 10px;
    }
    ion-item.critical {
      --background: rgba(255, 68, 68, 0.1);
      margin-bottom: 8px;
      border-radius: 8px;
    }
    ion-item.warning {
      --background: rgba(255, 160, 0, 0.1);
      margin-bottom: 8px;
      border-radius: 8px;
    }
    ion-item.normal {
      --background: rgba(0, 200, 81, 0.1);
      margin-bottom: 8px;
      border-radius: 8px;
    }
    ion-item h2 {
      font-weight: bold;
      font-size: 1.1em;
    }
    ion-badge {
      padding: 8px 12px;
    }
  `],
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StockInsightsComponent implements OnInit {
  stockLevelsOptions: any;
  lowStockAlerts: any[] = [];

  ngOnInit() {
    this.initializeCharts();
    this.initializeAlerts();
  }

  getAlertColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'warning': return 'warning';
      case 'normal': return 'success';
      default: return 'medium';
    }
  }

  private initializeCharts() {
    this.stockLevelsOptions = {
      series: [{
        name: 'Current Stock',
        data: [8500, 12000, 6800, 4500, 7200, 5500]
      }],
      chart: {
        type: 'bar',
        height: 350,
        background: '#ffffff',
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '50%',
          distributed: true,
          dataLabels: {
            position: 'bottom'
          }
        }
      },
      colors: ['#33b2df', '#546E7A', '#d4526e', '#13d8aa', '#A5978B', '#2b908f'],
      dataLabels: {
        enabled: true,
        textAnchor: 'start',
        style: {
          colors: ['#000']
        },
        formatter: function (val: number) {
          return val.toLocaleString() + ' kg';
        },
        offsetX: 0
      },
      xaxis: {
        categories: ['Potato', 'Onion', 'Tomato', 'Cauliflower',
                    'Green Peas', 'Cabbage'],
        title: {
          text: 'Stock Level (kg)'
        }
      },
      yaxis: {
        labels: {
          show: true
        }
      },
      tooltip: {
        y: {
          formatter: function(val: number) {
            return val.toLocaleString() + ' kg';
          }
        }
      }
    };
  }

  private initializeAlerts() {
    this.lowStockAlerts = [
      {
        product: 'Cauliflower',
        currentStock: 4500,
        threshold: 5000,
        severity: 'critical'
      },
      {
        product: 'Green Peas',
        currentStock: 7200,
        threshold: 8000,
        severity: 'warning'
      },
      {
        product: 'Onion',
        currentStock: 12000,
        threshold: 10000,
        severity: 'normal'
      },
      {
        product: 'Potato',
        currentStock: 4800,
        threshold: 6000,
        severity: 'critical'
      },
      {
        product: 'Tomato',
        currentStock: 6500,
        threshold: 7000,
        severity: 'warning'
      }
    ];
  }
}