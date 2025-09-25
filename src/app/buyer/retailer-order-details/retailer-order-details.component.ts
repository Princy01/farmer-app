import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  imageUrl?: string;
}

interface Order {
  orderId: string;
  placedAt: string;
  status: 'Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  wholesalerName: string;
  wholesalerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  deliveredAt?: string;
  paymentMethod: string;
  orderNotes?: string;
}

@Component({
  selector: 'app-retailer-order-details',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './retailer-order-details.component.html',
  styleUrls: ['./retailer-order-details.component.scss'],
})
export class RetailerOrderDetailsComponent implements OnInit {
  order!: Order;

  constructor(private router: Router) {}

  ngOnInit() {
    // Get order from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.order = navigation.extras.state['order'];
    }

    // If no order data, navigate back
    if (!this.order) {
      this.router.navigate(['/buyer/retailer-order-tracking']);
    }
  }

  goBack() {
    this.router.navigate(['/buyer/retailer-order-tracking']);
  }

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'Placed': 'medium',
      'Confirmed': 'primary',
      'Packed': 'secondary',
      'Shipped': 'tertiary',
      'In Transit': 'warning',
      'Out for Delivery': 'warning',
      'Delivered': 'success',
      'Cancelled': 'danger'
    };
    return statusColors[status] || 'medium';
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'Placed': 'time-outline',
      'Confirmed': 'checkmark-circle-outline',
      'Packed': 'cube-outline',
      'Shipped': 'airplane-outline',
      'In Transit': 'car-outline',
      'Out for Delivery': 'bicycle-outline',
      'Delivered': 'checkmark-done-circle',
      'Cancelled': 'close-circle-outline'
    };
    return statusIcons[status] || 'help-outline';
  }

  getOrderProgress(status: string): number {
    const progressMap: { [key: string]: number } = {
      'Placed': 0.2,
      'Confirmed': 0.4,
      'Packed': 0.6,
      'Shipped': 0.7,
      'In Transit': 0.8,
      'Out for Delivery': 0.9,
      'Delivered': 1.0,
      'Cancelled': 0
    };
    return progressMap[status] || 0;
  }

  getSubtotal(): number {
    // Calculate subtotal (total amount minus delivery fee and tax)
    const deliveryFee = this.getDeliveryFee();
    const taxFee = this.getTaxFee();
    return this.order.totalAmount - deliveryFee - taxFee;
  }

  getDeliveryFee(): number {
    // Calculate delivery fee (5% of subtotal or minimum 50)
    const subtotalWithoutFees = this.order.totalAmount * 0.85; // Approximate subtotal
    return Math.max(Math.round(subtotalWithoutFees * 0.05), 50);
  }

  getTaxFee(): number {
    // Calculate tax fee (10% of subtotal)
    const subtotalWithoutFees = this.order.totalAmount * 0.85; // Approximate subtotal
    return Math.round(subtotalWithoutFees * 0.10);
  }

  getPaymentIcon(paymentMethod: string): string {
    const paymentIcons: { [key: string]: string } = {
      'UPI': 'phone-portrait-outline',
      'Card': 'card-outline',
      'Cash on Delivery': 'cash-outline',
      'Wallet': 'wallet-outline',
      'Net Banking': 'globe-outline'
    };
    return paymentIcons[paymentMethod] || 'card-outline';
  }

  contactWholesaler() {
    // Handle wholesaler contact
    console.log('Contacting wholesaler:', this.order.wholesalerPhone);
  }
}