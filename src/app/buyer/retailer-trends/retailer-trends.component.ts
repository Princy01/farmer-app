import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { RetailerTrendsService, PriceComparisonRow } from './retailer-trends.service';

interface Product {
  id: number;
  name: string;
}

@Component({
  selector: 'app-retailer-trends',
  standalone: true,
  imports: [IonicModule, NgApexchartsModule, FormsModule, CommonModule],
  templateUrl: './retailer-trends.component.html',
  styleUrls: ['./retailer-trends.component.scss']
})
export class RetailerTrendsComponent implements OnInit {
  selectedProducts: number[] = [];
  searchTerm = '';

  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoadingProducts = false;
  isLoadingPrices = false;
  productsError = false;
  pricesError = false;
  chartOptions: any = {
    series: [],
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
      categories: []
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
  priceData: PriceComparisonRow[] = [];

  constructor(private navController: NavController, private retailerService: RetailerTrendsService) {
    addIcons({ chevronBackOutline });
  }

  ngOnInit() {
    this.loadAvailableProducts();
  }

  goBack() {
    this.navController.back();
  }

  loadAvailableProducts() {
    this.isLoadingProducts = true;
    this.productsError = false;
    this.retailerService.getAvailableProducts().subscribe({
      next: (data) => {
        this.products = (data || []).map(item => ({
          id: item.product_id,
          name: item.product_name
        }));
        this.filteredProducts = [...this.products];
        this.selectedProducts = this.products.slice(0, 2).map(product => product.id);
        this.isLoadingProducts = false;
        this.loadPriceData();
      },
      error: (error) => {
        console.error('Failed to load available products:', error);
        this.products = [];
        this.filteredProducts = [];
        this.selectedProducts = [];
        this.productsError = true;
        this.isLoadingProducts = false;
      }
    });
  }

  onProductChange() {
    if (this.selectedProducts.length > 5) {
      this.selectedProducts = this.selectedProducts.slice(0, 5);
    }
    this.loadPriceData();
  }

  filterProductList() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(term)
    );
  }

  private loadPriceData() {
    if (this.selectedProducts.length === 0) {
      this.priceData = [];
      this.pricesError = false;
      this.updateChart();
      return;
    }
    this.isLoadingPrices = true;
    this.pricesError = false;
    const productIds = this.selectedProducts.join(',');
    this.retailerService.getPriceComparison(productIds).subscribe({
      next: (data) => {
        this.priceData = data;
        this.isLoadingPrices = false;
        this.updateChart();
      },
      error: (err) => {
        console.error('Failed to load price comparison:', err);
        this.priceData = [];
        this.pricesError = true;
        this.isLoadingPrices = false;
        this.updateChart();
      }
    });
  }

  updateChart() {
    const selectedProductIds = this.selectedProducts;
    const selectedData = this.priceData.filter(p =>
      selectedProductIds.includes(p.product_id)
    );

    // Group by mandi and product
    const mandis = [...new Set(selectedData.map(p => p.mandi_name))];
    const productNames = selectedProductIds.map(id =>
      this.products.find(p => p.id === id)?.name || ''
    );

    this.chartOptions = {
      series: mandis.map(mandi => ({
        name: mandi,
        data: productNames.map(productName => {
          const productData = selectedData.find(p => p.product_name === productName && p.mandi_name === mandi);
          return productData ? productData.price : 0;
        })
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
        categories: productNames
      },
      yaxis: {
        title: {
          text: 'Price (₹/kg)'  // Adjust based on unit_name if needed
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