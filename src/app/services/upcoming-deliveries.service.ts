// this service provides a way to add and retrieve accepted orders (from transport requests) in Upcoming deliveries shown in transport dashboard.

import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class UpcomingDeliveriesService {
  private acceptedOrders: any[] = [];
constructor(private database: DatabaseService){
  this.getOrdersFromLocalStorage()
}

getOrdersFromLocalStorage(){
  const transporterDeliveries = this.database.getPendingDeliveriesFromLocalStorage("T001")
  this.acceptedOrders = transporterDeliveries.filter(order => order.assigned)
}
  addAcceptedOrder(order: any) {
    this.acceptedOrders.push(order);
  }

  getAcceptedOrders() {
    return this.acceptedOrders;
  }
}
