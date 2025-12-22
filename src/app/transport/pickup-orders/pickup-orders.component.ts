import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  location,
  qrCodeOutline,
  checkmarkCircle,
  receipt,
  time,
  business,
  cube,
  scanOutline,
  warningOutline,
  documentText,
  checkmarkDone,
  close,
  alertCircle,
  camera,
  images,
  closeCircle,
  informationCircle,
  send,
  arrowForward
} from 'ionicons/icons';

import { addIcons } from 'ionicons';

interface PickupOrder {
  id: string;
  wholesaler: string;
  address: string;
  date: string; // ISO date string
  totalWeight: string;
  status: 'pending' | 'in_progress' | 'completed';
}

@Component({
  selector: 'app-pickup-orders',
  templateUrl: './pickup-orders.component.html',
  styleUrls: ['./pickup-orders.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class PickupOrdersComponent implements OnInit {
  orders: PickupOrder[] = [
    {
      id: 'ORD123456',
      wholesaler: 'Green Valley Wholesale',
      address: 'Warehouse 12, APMC Market, Sector 19, Vashi - 400703',
      date: '2025-12-22',
      totalWeight: '33 kg',
      status: 'pending'
    },
    {
      id: 'ORD123457',
      wholesaler: 'Fresh Farms',
      address: 'Plot 8, Navi Mumbai Market Yard',
      date: '2025-12-22',
      totalWeight: '20 kg',
      status: 'pending'
    },
    {
      id: 'ORD123458',
      wholesaler: 'AgroMart',
      address: 'Shop 5, Main Road, Vashi',
      date: '2025-12-23',
      totalWeight: '15 kg',
      status: 'pending'
    }
  ];

  groupedOrders: { date: string, orders: PickupOrder[] }[] = [];

  constructor(private router: Router) {
    addIcons({
      location,
      qrCodeOutline,
      checkmarkCircle,
      receipt,
      time,
      business,
      cube,
      scanOutline,
      warningOutline,
      documentText,
      checkmarkDone,
      close,
      alertCircle,
      camera,
      images,
      closeCircle,
      informationCircle,
      send,
      arrowForward
    });
  }

  ngOnInit() {
    this.groupOrdersByDate();
  }

  groupOrdersByDate() {
    const groups: { [date: string]: PickupOrder[] } = {};
    this.orders.forEach(order => {
      if (!groups[order.date]) {
        groups[order.date] = [];
      }
      groups[order.date].push(order);
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

  openOrder(order: PickupOrder) {
    this.router.navigate(['/pickup-confirmation', order.id]);
    // alert(`Open order: ${order.id}`);
  }
}