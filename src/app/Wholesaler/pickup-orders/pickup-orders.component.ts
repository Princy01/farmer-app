import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  cubeOutline,
  person,
  personCircle,
  call,
  cube,
  eyeOff,
  checkmarkCircle
} from 'ionicons/icons';
import { WholesalerOrderService, WholesalerOrderSummary, WholesalerOrderDetails, OrderStatus } from './pickup-orders.service';

interface PickupOrder extends WholesalerOrderSummary {
  driverName?: string;
  driverPhone?: string;
  totalWeight: string;
  status: 'pending' | 'otp_generated' | 'picked_up';
  otp?: string;
}

@Component({
  selector: 'app-wholesaler-pickup-orders',
  templateUrl: './pickup-orders.component.html',
  styleUrls: ['./pickup-orders.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class WholesalerPickupOrdersComponent implements OnInit {
  orders: PickupOrder[] = [];
  groupedOrders: { date: string, orders: PickupOrder[] }[] = [];
  otpVisible: { [orderId: string]: boolean } = {};
  viewMode: 'list' | 'details' = 'list';
  selectedOrderDetails: WholesalerOrderDetails | null = null;
  orderStatuses: OrderStatus[] = [];
  selectedStatuses: number[] = [];

  constructor(private router: Router, private orderService: WholesalerOrderService) {
    addIcons({
      arrowBack,
      cubeOutline,
      person,
      personCircle,
      call,
      cube,
      eyeOff,
      checkmarkCircle
    });
  }

  ngOnInit() {
    this.loadOrderStatuses();
  }

  loadOrderStatuses() {
    this.orderService.getOrderStatuses().subscribe({
      next: (data) => {
        this.orderStatuses = data;
        this.selectedStatuses = data.map(s => s.order_status_id); // Default to all selected
        this.loadOrders();
      },
      error: (err) => {
        console.error('Failed to load order statuses:', err);
        // Handle error, e.g., show toast
      }
    });
  }

  loadOrders() {
    if (this.selectedStatuses.length === 0) {
      this.orders = [];
      this.groupOrdersByDate();
      return;
    }
    this.orderService.getWholesalerOrders(this.selectedStatuses).subscribe({
      next: (data) => {
        this.orders = data.map(order => ({
          ...order,
          totalWeight: `${order.total_quantity} kg`, // Assuming kg, adjust if needed
          status: this.mapStatus(order.order_status_id),
          driverName: 'N/A', // Not available in backend, set placeholder
          driverPhone: 'N/A'  // Not available in backend, set placeholder
        }));
        this.groupOrdersByDate();
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        // Handle error, e.g., show toast
      }
    });
  }

  private mapStatus(statusId: number): 'pending' | 'otp_generated' | 'picked_up' {
    switch (statusId) {
      case 1: return 'pending';
      case 2: return 'otp_generated';
      case 3: return 'picked_up';
      default: return 'pending';
    }
  }

  groupOrdersByDate() {
    const groups: { [date: string]: PickupOrder[] } = {};
    this.orders.forEach(order => {
      const date = order.date_of_order.split('T')[0]; // Extract date part
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(order);
    });
    this.groupedOrders = Object.keys(groups)
      .sort()
      .map(date => ({
        date,
        orders: groups[date]
      }));
  }

  getDateLabel(date: string): string {
    const today = new Date();
    const d = new Date(date);
    if (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    ) {
      return 'Today';
    }
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }

  onStatusFilterChange(selectedValues: number[]) {
    this.selectedStatuses = selectedValues;
    this.loadOrders();
  }

  viewOrderDetails(order: PickupOrder) {
    this.orderService.getWholesalerOrderDetails(order.order_id).subscribe({
      next: (data) => {
        this.selectedOrderDetails = data;
        this.viewMode = 'details';
      },
      error: (err) => {
        console.error('Failed to load order details:', err);
        // Handle error, e.g., show toast
      }
    });
  }

  goBackToList() {
    this.viewMode = 'list';
    this.selectedOrderDetails = null;
  }

  generateOtp(order: PickupOrder) {
    this.orderService.generatePickupOtp(order.order_id).subscribe({
      next: (data) => {
        order.otp = data.otp_code;
        order.status = 'otp_generated';
        this.otpVisible[order.order_id.toString()] = true;
      },
      error: (err) => {
        console.error('Failed to generate OTP:', err);
        // Handle error, e.g., show toast
      }
    });
  }

  hideOtp(order: PickupOrder) {
    this.otpVisible[order.order_id.toString()] = false;
  }
}