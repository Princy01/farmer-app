// this service provides a way to add and retrieve accepted orders (from transport requests) in Upcoming deliveries shown in transport dashboard.

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UpcomingDeliveriesService {
  private acceptedOrders: any[] = [];

  addAcceptedOrder(order: any) {
    this.acceptedOrders.push(order);
  }

  getAcceptedOrders() {
    return this.acceptedOrders;
  }
}
