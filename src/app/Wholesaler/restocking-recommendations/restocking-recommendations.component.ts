import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-restocking-recommendations',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './restocking-recommendations.component.html',
  styleUrls: ['./restocking-recommendations.component.scss']
})
export class RestockingRecommendationsComponent {
  products = [
    {
      name: 'Tomatoes',
      stock: 50,
      avgDailySales: 25,
      mandis: [
        { name: 'Mandi A', stock: 20 },
        { name: 'Mandi B', stock: 30 }
      ]
    },
    {
      name: 'Onions',
      stock: 90,
      avgDailySales: 40,
      mandis: [
        { name: 'Mandi A', stock: 50 },
        { name: 'Mandi B', stock: 40 }
      ]
    },
    {
      name: 'Potatoes',
      stock: 200,
      avgDailySales: 25,
      mandis: [
        { name: 'Mandi A', stock: 80 },
        { name: 'Mandi B', stock: 120 }
      ]
    }
  ];

  getStockToSalesRatio(product: any): number {
    return product.stock / product.avgDailySales;
  }

  getBadge(product: any): string {
    const ratio = this.getStockToSalesRatio(product);
    if (ratio < 2) return 'Low Stock';
    if (ratio < 4) return 'Restock Soon';
    return 'Stock Sufficient';
  }

  getBadgeColor(product: any): string {
    const ratio = this.getStockToSalesRatio(product);
    if (ratio < 2) return 'danger';
    if (ratio < 4) return 'warning';
    return 'success';
  }

  filteredProducts() {
    return this.products
      .filter(product => this.getStockToSalesRatio(product) < 4)
      .sort((a, b) => a.stock - b.stock);
  }
}
