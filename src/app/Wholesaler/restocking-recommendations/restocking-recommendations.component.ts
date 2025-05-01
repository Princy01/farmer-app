// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { IonicModule } from '@ionic/angular';

// @Component({
//   selector: 'app-restocking-recommendations',
//   standalone: true,
//   imports: [CommonModule, IonicModule],
//   templateUrl: './restocking-recommendations.component.html',
//   styleUrls: ['./restocking-recommendations.component.scss']
// })
// export class RestockingRecommendationsComponent {
//   products = [
//     {
//       name: 'Tomatoes',
//       stock: 50,
//       avgDailySales: 25,
//       mandis: [
//         { name: 'Mandi A', stock: 20 },
//         { name: 'Mandi B', stock: 30 }
//       ]
//     },
//     {
//       name: 'Onions',
//       stock: 90,
//       avgDailySales: 40,
//       mandis: [
//         { name: 'Mandi A', stock: 50 },
//         { name: 'Mandi B', stock: 40 }
//       ]
//     },
//     {
//       name: 'Potatoes',
//       stock: 200,
//       avgDailySales: 25,
//       mandis: [
//         { name: 'Mandi A', stock: 80 },
//         { name: 'Mandi B', stock: 120 }
//       ]
//     }
//   ];

//   getStockToSalesRatio(product: any): number {
//     return product.stock / product.avgDailySales;
//   }

//   getBadge(product: any): string {
//     const ratio = this.getStockToSalesRatio(product);
//     if (ratio < 2) return 'Low Stock';
//     if (ratio < 4) return 'Restock Soon';
//     return 'Stock Sufficient';
//   }

//   getBadgeColor(product: any): string {
//     const ratio = this.getStockToSalesRatio(product);
//     if (ratio < 2) return 'danger';
//     if (ratio < 4) return 'warning';
//     return 'success';
//   }

//   filteredProducts() {
//     return this.products
//       .filter(product => this.getStockToSalesRatio(product) < 4)
//       .sort((a, b) => a.stock - b.stock);
//   }
// }

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircle } from 'ionicons/icons';
import { WholesalerApiService } from '../services/wholesaler-api.service';
import { RestockProduct } from '../services/wholesaler-api.service';

@Component({
  selector: 'app-restocking-recommendations',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './restocking-recommendations.component.html',
  styleUrls: ['./restocking-recommendations.component.scss']
})
export class RestockingRecommendationsComponent implements OnInit {
  products: RestockProduct[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private wholesalerService: WholesalerApiService) {
    addIcons({ alertCircle });
  }

  ngOnInit() {
    this.loadRestockingRecommendations();
  }

  async loadRestockingRecommendations() {
    this.isLoading = true;
    this.error = null;

    this.wholesalerService.getRestockingRecommendations().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load restocking recommendations:', error);
        this.error = 'Failed to load recommendations. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getBadgeText(ratio: number): string {
    if (ratio < 2) return 'Low Stock';
    if (ratio < 4) return 'Restock Soon';
    return 'Stock Sufficient';
  }

  getBadgeColor(product: RestockProduct): string {
    const ratio = product.stock_to_sales_ratio;
    if (ratio < 2) return 'danger';
    if (ratio < 4) return 'warning';
    return 'success';
  }

  filteredProducts() {
    return this.products
      .filter(product => product.stock_to_sales_ratio < 4)
      .sort((a, b) => a.stock_to_sales_ratio - b.stock_to_sales_ratio);
  }
}
