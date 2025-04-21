// Dummy Data Service
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class InsightsService {
  isPremiumWholesaler = true; // toggle this to false to test

  bulkOrders = [
    {
      retailer: 'ABC Traders',
      wholesaler: 'FreshMart',
      product: 'Tomatoes',
      quantity: 500,
      price: 60000,
      date: '2025-04-15'
    },
    {
      retailer: 'CityMart Retail',
      wholesaler: 'AgroPlus',
      product: 'Potatoes',
      quantity: 1000,
      price: 85000,
      date: '2025-04-14'
    }
  ];

  topRetailers = [
    { name: 'ABC Traders', total: 92000 },
    { name: 'CityMart Retail', total: 88500 },
    { name: 'FreshBite', total: 70000 },
    { name: 'RetailPro', total: 67200 },
    { name: 'VegeStop', total: 61400 }
  ];

  getBulkOrders() {
    return this.bulkOrders;
  }

  getTopRetailers() {
    return this.topRetailers;
  }

  isPremium() {
    return this.isPremiumWholesaler;
  }
}
