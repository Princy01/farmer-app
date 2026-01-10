import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { RetailerTrendsService, PriceComparisonRow } from './retailer-trends.service';  // Import the service

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
  selectedProducts: number[] = [1, 2];  // Use IDs (e.g., 1 for Tomato, 2 for Onion)
  searchTerm = '';

  // Hardcoded products with IDs (replace with API fetch if available)
  products: Product[] = [
    { id: 1, name: 'Tomato' },
    { id: 2, name: 'Onion' },
    { id: 3, name: 'Potato' }
  ];

  filteredProducts: Product[] = [];
  chartOptions: any;
  priceData: PriceComparisonRow[] = [];  // Store API response

  constructor(private navController: NavController, private retailerService: RetailerTrendsService) {
    addIcons({ chevronBackOutline });
  }

  ngOnInit() {
    this.loadAvailableProducts();
    // this.filteredProducts = [...this.products];
    this.loadPriceData();
  }

  goBack() {
    this.navController.back();
  }

  loadAvailableProducts() {
    this.retailerService.getAvailableProducts().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.products = data.map(item => ({
            id: item.product_id,
            name: item.product_name
          }));
        }
        // If no data returned, keep hardcoded products
        this.filteredProducts = [...this.products];
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
      this.updateChart();
      return;
    }
    const productIds = this.selectedProducts.join(',');
    this.retailerService.getPriceComparison(productIds).subscribe({
      next: (data) => {
        this.priceData = data;
        this.updateChart();
      },
      error: (err) => {
        console.error('Failed to load price comparison:', err);
        this.priceData = [];
        this.updateChart();
        // Optionally show a toast or alert
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