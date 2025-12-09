import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  receiptOutline,
  navigateOutline,  // Changed from trackingOutline
  homeOutline,
  timeOutline,
  locationOutline,
  callOutline,
  downloadOutline,
  bagOutline,
  cardOutline,
  cashOutline,
  rocketOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.scss'],
})
export class OrderConfirmationComponent implements OnInit {
  orderData: any;
  estimatedDelivery: string = '';
  showAnimation: boolean = true;
  hasTransport: boolean = false;
  transportInfo: any = null;

  constructor(private router: Router) {
    addIcons({
      checkmarkCircle,
      receiptOutline,
      navigateOutline,
      homeOutline,
      timeOutline,
      locationOutline,
      callOutline,
      downloadOutline,
      bagOutline,
      cardOutline,
      cashOutline,
      rocketOutline
    });

    const navigation = this.router.getCurrentNavigation();
    this.orderData = navigation?.extras?.state?.['orderData'];

    if (!this.orderData) {
      this.router.navigate(['/buyer/home']);
      return;
    }

    // Extract transport info
    this.hasTransport = this.orderData.hasTransport || false;
    this.transportInfo = this.orderData.transportData;

    console.log('Order confirmation data:', this.orderData);
    console.log('Has transport:', this.hasTransport);
  }

  ngOnInit() {
    this.calculateDeliveryTime();

    setTimeout(() => {
      this.showAnimation = false;
    }, 3000);
  }

  trackOrder() {
    this.router.navigate(['/buyer/order-tracking'], {
      queryParams: { orderId: this.orderData.orderId }
    });
  }

  goToOrderHistory() {
    this.router.navigate(['/buyer/order-history']);
  }

  goHome() {
    this.router.navigate(['/buyer/home']);
  }

  downloadInvoice() {
    // Implement invoice download functionality
    console.log('Downloading invoice for order:', this.orderData.orderId);
  }

  private calculateDeliveryTime() {
    if (this.hasTransport && this.transportInfo) {
      const deliveryType = this.transportInfo.delivery_type;
      switch (deliveryType) {
        case 'priority':
          this.estimatedDelivery = '2-4 hours';
          break;
        case 'express':
          this.estimatedDelivery = '4-8 hours';
          break;
        case 'standard':
          this.estimatedDelivery = '1-2 days';
          break;
        default:
          this.estimatedDelivery = '1-2 business days';
      }
    } else {
      this.estimatedDelivery = '2-3 business days';
    }
  }

  getTransportTypeName(): string {
    if (!this.transportInfo) return '';

    const type = this.transportInfo.delivery_type;
    switch (type) {
      case 'standard': return 'Standard Delivery';
      case 'express': return 'Express Delivery';
      case 'priority': return 'Priority Delivery';
      default: return type;
    }
  }

  getFormattedDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}