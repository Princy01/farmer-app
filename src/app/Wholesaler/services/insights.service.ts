import { Injectable } from '@angular/core';

/**
 * Insights Service
 *
 * Note: This service currently uses mock data for development purposes.
 * In production, replace with actual API calls to fetch real-time data.
 */
@Injectable({ providedIn: 'root' })
export class InsightsService {
  // TODO: Replace with actual API call to check premium status
  private isPremiumWholesaler = true;

  // TODO: Replace with actual API endpoint
  private readonly bulkOrders = [
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

  // TODO: Replace with actual API endpoint
  private readonly topRetailers = [
    { name: 'ABC Traders', total: 92000 },
    { name: 'CityMart Retail', total: 88500 },
    { name: 'FreshBite', total: 70000 },
    { name: 'RetailPro', total: 67200 },
    { name: 'VegeStop', total: 61400 }
  ];

  /**
   * Gets bulk orders data
   * TODO: Replace with HTTP call to actual API endpoint
   */
  getBulkOrders() {
    // In production, this should return an Observable from HTTP call
    return [...this.bulkOrders]; // Return a copy to prevent external mutations
  }

  /**
   * Gets top retailers data
   * TODO: Replace with HTTP call to actual API endpoint
   */
  getTopRetailers() {
    // In production, this should return an Observable from HTTP call
    return [...this.topRetailers]; // Return a copy to prevent external mutations
  }

  /**
   * Checks if the current wholesaler has premium status
   * TODO: Replace with HTTP call to actual API endpoint
   */
  isPremium(): boolean {
    // In production, this should check against actual user data
    return this.isPremiumWholesaler;
  }
}
