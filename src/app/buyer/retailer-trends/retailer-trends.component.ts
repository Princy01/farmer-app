import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';

interface PriceData {
  product: string;
  mandiPrices: { mandi: string; price: number }[];
}

@Component({
  selector: 'app-retailer-trends',
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, FormsModule, CommonModule],
  templateUrl: './retailer-trends.component.html',
  styleUrls: ['./retailer-trends.component.scss']
})
export class RetailerTrendsComponent implements OnInit {
  selectedProducts: string[] = ['Tomato', 'Onion'];
  searchTerm = '';

  products: PriceData[] = [
    {
      product: 'Tomato',
      mandiPrices: [
        { mandi: 'Delhi Mandi', price: 22 },
        { mandi: 'Mumbai Mandi', price: 25 },
        { mandi: 'Lucknow Mandi', price: 20 }
      ]
    },
    {
      product: 'Onion',
      mandiPrices: [
        { mandi: 'Delhi Mandi', price: 15 },
        { mandi: 'Mumbai Mandi', price: 18 },
        { mandi: 'Lucknow Mandi', price: 14 }
      ]
    },
    {
      product: 'Potato',
      mandiPrices: [
        { mandi: 'Delhi Mandi', price: 12 },
        { mandi: 'Mumbai Mandi', price: 14 },
        { mandi: 'Lucknow Mandi', price: 11 }
      ]
    }
  ];

  filteredProducts: string[] = [];
  chartOptions: any;

  constructor(private navController: NavController) {
    addIcons({ chevronBackOutline });
  }

  ngOnInit() {
    this.filteredProducts = this.products.map(p => p.product);
    this.updateChart();
  }

  goBack() {
    this.navController.back();
  }

  onProductChange() {
    if (this.selectedProducts.length > 5) {
      // Keep only the first 5 selections
      this.selectedProducts = this.selectedProducts.slice(0, 5);
    }
    this.updateChart();
  }


  filterProductList() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products
      .map(p => p.product)
      .filter(p => p.toLowerCase().includes(term));
  }

  updateChart() {
    const selected = this.products.filter(p =>
      this.selectedProducts.includes(p.product)
    );

    const mandis = ['Delhi Mandi', 'Mumbai Mandi', 'Lucknow Mandi'];

    this.chartOptions = {
      series: mandis.map(mandi => ({
        name: mandi,
        data: selected.map(p =>
          p.mandiPrices.find(mp => mp.mandi === mandi)?.price || 0
        )
      })),
      chart: {
        type: 'bar',
        height: 350,
        stacked: false,
        toolbar: { show: false },
        background: '#fff'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 6,
          columnWidth: '50%'
        }
      },
      colors: ['#FF6B6B', '#4ECDC4', '#FFD166'],
      xaxis: {
        categories: selected.map(p => p.product)
      },
      yaxis: {
        title: {
          text: 'Price (₹/kg)'
        },
        labels: {
          formatter: (val: number) => `₹${val}`
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => `₹${val}`
        }
      }
    };
  }
}
