import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';

interface ProductPrices {
  [key: string]: number;
}

interface MarketPrices {
  [key: string]: ProductPrices;
}

@Component({
  selector: 'app-market-comparison',
  templateUrl: './market-comparison.component.html',
  styleUrls: ['./market-comparison.component.scss'],
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, FormsModule, CommonModule]
})
export class MarketComparisonComponent implements OnInit {
  constructor(private navController: NavController) {
      addIcons({ chevronBackOutline})
     }
     goToTrends() {
      this.navController.navigateBack('/wholesaler/trends'); // Change the path as per your route
    }

  priceComparisonOptions: any;
  availableMandis = ['Azadpur Mandi', 'Ghazipur Mandi', 'Okhla Mandi'];
  availableProducts = ['Potato', 'Onion', 'Tomato', 'Cauliflower', 'Green Peas', 'Cabbage'];
  selectedMandis: string[] = ['Azadpur Mandi'];
  selectedProducts: string[] = ['Potato', 'Onion', 'Tomato'];

  private priceData: MarketPrices = {
    'Azadpur Mandi': { 'Potato': 45, 'Onion': 52, 'Tomato': 38, 'Cauliflower': 24, 'Green Peas': 33, 'Cabbage': 26 },
    'Ghazipur Mandi': { 'Potato': 42, 'Onion': 48, 'Tomato': 35, 'Cauliflower': 22, 'Green Peas': 31, 'Cabbage': 24 },
    'Okhla Mandi': { 'Potato': 48, 'Onion': 55, 'Tomato': 42, 'Cauliflower': 28, 'Green Peas': 36, 'Cabbage': 29 }
  };

  ngOnInit() {
    this.initializeCharts();
  }

  updateChart() {
    const series = this.selectedMandis.map(mandi => ({
      name: mandi,
      data: this.selectedProducts.map(product => this.priceData[mandi][product])
    }));

    this.priceComparisonOptions = {
      ...this.priceComparisonOptions,
      series: series,
      xaxis: {
        ...this.priceComparisonOptions.xaxis,
        categories: this.selectedProducts
      }
    };
  }

  private initializeCharts() {
    this.priceComparisonOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 350,
        stacked: false,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5
        },
      },
      colors: ['#008FFB', '#00E396', '#FEB019'],
      xaxis: {
        categories: this.selectedProducts,
        title: { text: 'Products' }
      },
      yaxis: {
        title: { text: 'Price (₹/kg)' },
        labels: {
          formatter: (val: number) => `₹${val}`
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => `₹${val}/kg`
        }
      }
    };
    this.updateChart();
  }
}