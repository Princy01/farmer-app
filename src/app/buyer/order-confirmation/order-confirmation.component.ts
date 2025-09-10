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

  constructor(private router: Router) {
    addIcons({
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
    });

    const navigation = this.router.getCurrentNavigation();
    this.orderData = navigation?.extras?.state?.['orderData'];

    if (!this.orderData) {
      this.router.navigate(['/buyer/home']);
    }
  }

  ngOnInit() {
    this.calculateDeliveryTime();

    // Hide animation after 3 seconds
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
    if (this.orderData?.hasTransport) {
      this.estimatedDelivery = this.orderData.urgency === 'urgent' ?
        '2-4 hours' : '4-8 hours';
    } else {
      this.estimatedDelivery = '1-2 business days';
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