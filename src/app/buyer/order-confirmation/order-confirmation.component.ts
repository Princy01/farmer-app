import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { OrderService, RetailerOrderResponse } from './order.service';  // Import the service and response interface
import { addIcons } from 'ionicons';
import {
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

  constructor(private router: Router, private orderService: OrderService) {  // Inject OrderService
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

    // Fetch full order details if orderIds are available
    if (this.orderData?.orderIds && this.orderData.orderIds.length > 0) {
      const orderId = this.orderData.orderIds[0];  // Use the first order ID
      this.orderService.getRetailerOrderDetails(orderId).subscribe({
        next: (response: RetailerOrderResponse) => {
          this.orderData = {
            ...this.orderData,
            orderId: response.order_id,
            orderDate: response.date_of_order,
            deliveryAddress: response.delivery_address,
            grandTotal: response.final_amount,
            items: response.items.map(item => ({
              ...item,
              product_name: item.product_name || 'Unknown Product',
              unit_name: item.unit_name || 'Unit',
              latest_wholesaler_price: item.price  // Map price to match HTML usage
            }))
          };
          console.log('Fetched order details:', this.orderData);
        },
        error: (err) => {
          console.error('Failed to fetch order details:', err);
          // Optionally, show an error message or fallback
        }
      });
    }

    setTimeout(() => {
      this.showAnimation = false;
    }, 3000);
  }

  trackOrder() {
    // Assuming orderIds is an array, use the first one or handle multiple
    const orderId = this.orderData.orderIds ? this.orderData.orderIds[0] : this.orderData.orderId;
    this.router.navigate(['/buyer/order-tracking'], {
      queryParams: { orderId: orderId }
    });
  }

  goToOrderHistory() {
    this.router.navigate(['/buyer/retailer-order-history']);
  }

  goHome() {
    this.router.navigate(['/buyer/buyer-home']);
  }

  downloadInvoice() {
    // Implement invoice download functionality
    const orderId = this.orderData.orderIds ? this.orderData.orderIds[0] : this.orderData.orderId;
    console.log('Downloading invoice for order:', orderId);
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