import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward } from 'ionicons/icons';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent {
  cartItems: any[] = [];
  totalPrice: number = 0;
  selectedPaymentMethod: string = 'upi'; // Default payment method
  estimatedDelivery: string = '3-5 Business Days';
  trackingNumber: string = 'TRK123456789';
  orderPlaced: boolean = false; // Track if order is placed

  // Ride Selection
  selectedDeliveryType: string | null = null;
  selectedUrgency: string | null = null;
  estimatedRidePrice: number = 0; // Default to 0
  grandTotal: number = 0; // Total including transport

  selectedAddress: any = {
    name: 'ABC',
    street: '123 XY',
    city: 'New Delhi',
    state: 'Delhi',
    zip: '110001',
  };

  constructor(private router: Router, private route: ActivatedRoute) {
    addIcons({ chevronBack, chevronForward });

    const navData = this.router.getCurrentNavigation()?.extras.state;
    if (navData) {
      this.cartItems = navData['cartItems'] || [];
      this.totalPrice = navData['totalPrice'] || 0;
    }

    // Capture ride options from query parameters
    this.route.queryParams.subscribe((params) => {
      if (params['deliveryType']) {
        this.selectedDeliveryType = params['deliveryType'];
      }
      if (params['urgency']) {
        this.selectedUrgency = params['urgency'];
      }

      // Calculate estimated ride price
      this.calculateRidePrice();
    });
  }

  goBack() {
    this.router.navigate(['/buyer/cart']);
  }

  changeAddress() {
    this.router.navigate(['/buyer/select-address']);
  }

  arrangeRide() {
    this.router.navigate(['/buyer/ride'], {
      queryParams: {
        deliveryType: this.selectedDeliveryType,
        urgency: this.selectedUrgency,
      },
    });
  }

  confirmOrder() {
    this.orderPlaced = true; // Show order confirmation section
    console.log('Order Confirmed!', {
      items: this.cartItems,
      paymentMethod: this.selectedPaymentMethod,
      total: this.grandTotal,
      deliveryType: this.selectedDeliveryType,
      urgency: this.selectedUrgency,
    });
  }

  selectPayment(method: string) {
    this.selectedPaymentMethod = method;
  }

  calculateRidePrice() {
    if (this.selectedDeliveryType) {
      // Hardcoded transport price calculation (Example formula)
      this.estimatedRidePrice = 50 + this.cartItems.length * 10;
    } else {
      this.estimatedRidePrice = 0;
    }
    this.grandTotal = this.totalPrice + this.estimatedRidePrice;
  }

}
