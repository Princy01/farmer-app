import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  cubeOutline,
  person,
  personCircle,
  call,
  cube,
  checkmarkCircle,
  eyeOff
} from 'ionicons/icons';

import { addIcons } from 'ionicons';

interface PickupOrder {
  id: string;
  driverName: string;
  driverPhone: string;
  date: string; // ISO date string
  totalWeight: string;
  status: 'pending' | 'otp_generated' | 'picked_up';
  otp?: string;
}

@Component({
  selector: 'app-wholesaler-pickup-orders',
  templateUrl: './pickup-orders.component.html',
  styleUrls: ['./pickup-orders.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class WholesalerPickupOrdersComponent implements OnInit {
  orders: PickupOrder[] = [
    {
      id: 'ORD123456',
      driverName: 'Ravi Kumar',
      driverPhone: '9876543210',
      date: '2025-12-22',
      totalWeight: '33 kg',
      status: 'pending'
    },
    {
      id: 'ORD123457',
      driverName: 'Priya Singh',
      driverPhone: '9123456780',
      date: '2025-12-22',
      totalWeight: '20 kg',
      status: 'pending'
    },
    {
      id: 'ORD123458',
      driverName: 'Amit Patel',
      driverPhone: '9988776655',
      date: '2025-12-23',
      totalWeight: '15 kg',
      status: 'pending'
    }
  ];

  groupedOrders: { date: string, orders: PickupOrder[] }[] = [];
  otpVisible: { [orderId: string]: boolean } = {};

  constructor(private router: Router) {
    addIcons({
      cubeOutline,
      person,
      personCircle,
      call,
      cube,
      checkmarkCircle,
      eyeOff
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

  generateOtp(order: PickupOrder) {
    // Generate a 6-digit OTP
    order.otp = Math.floor(100000 + Math.random() * 900000).toString();
    order.status = 'otp_generated';
    this.otpVisible[order.id] = true;
  }

  hideOtp(order: PickupOrder) {
    this.otpVisible[order.id] = false;
  }
}