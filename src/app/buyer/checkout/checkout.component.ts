import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward } from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';

interface CartItem {
  id: number;
  name: string;
  image: string;
  hindiName: string;
  quantity: number;
  price: number;
  weight: number;
}
interface DirectOrder {
  id: number;
  buyerId: string;
  sellerId: string;
  items: any[];
  totalAmount: number;
  pickupLocation: string;
  dropoffLocation: string;
  weight: number;
  distance?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: Date;
  transportRequired: false;
}

interface DeliveryAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface Order {
  items: CartItem[];
  paymentMethod: string;
  total: number;
  deliveryType: string | null;
  urgency: string | null;
  transporterId: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  weight: number;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent {
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  selectedPaymentMethod: string = 'upi';
  estimatedDelivery: string = '3-5 Business Days';
  trackingNumber: string = 'TRK123456789';
  orderPlaced: boolean = false;
  isLoading: boolean = false;

  selectedDeliveryType: string | null = null;
  selectedUrgency: string | null = null;
  estimatedRidePrice: number = 0;
  grandTotal: number = 0;
  selectedTransporter: string | null = null;
  availableTransporters: any[] = [];

  isSearchingDriver: boolean = false;
  hasRideRequest: boolean = false;

  selectedAddress: DeliveryAddress = {
    name: 'ABC',
    street: '123 XY',
    city: 'New Delhi',
    state: 'Delhi',
    zip: '110001',
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private alertCtrl: AlertController
  ) {
    addIcons({ chevronBack, chevronForward });
    this.loadTransporters();

    const navData = this.router.getCurrentNavigation()?.extras.state;
    if (navData) {
      this.cartItems = navData['cartItems'] || [];
      this.totalPrice = navData['totalPrice'] || 0;
    }

    this.route.queryParams.subscribe((params) => {
      if (params['deliveryType']) {
        this.selectedDeliveryType = params['deliveryType'];
        this.hasRideRequest = true;
      }
      if (params['urgency']) {
        this.selectedUrgency = params['urgency'];
      }
      if (this.hasRideRequest) {
        // Wait for next render cycle before showing alert
        setTimeout(() => this.confirmDriverSearch(), 100);
      }
              this.calculateRidePrice();

    });
  }

  private loadTransporters() {
    this.availableTransporters = this.databaseService.getAvailableTransporters();
  }

  calculateRidePrice() {
    if (this.selectedDeliveryType && this.selectedAddress) {
      const totalWeight = this.calculateTotalWeight();

      this.estimatedRidePrice = this.databaseService.calculateBasePrice(
        this.selectedAddress.city,
        'Destination',
        totalWeight,
        this.selectedDeliveryType,
        this.selectedUrgency || 'normal',
        this.selectedTransporter || undefined
      );
    } else {
      this.estimatedRidePrice = 0;
    }
    this.grandTotal = this.totalPrice + this.estimatedRidePrice;
  }

  selectTransporter(transporterId: string) {
    this.selectedTransporter = transporterId;
    this.calculateRidePrice();
  }

  arrangeRide() {
    this.router.navigate(['/buyer/ride'], {
      queryParams: {
        totalWeight: this.calculateTotalWeight(),
        pickup: this.selectedAddress.city,
        delivery: 'Destination'
      }
    });
  }

  async confirmDriverSearch() {
    const alert = await this.alertCtrl.create({
      header: 'Estimated Transport Cost',
      message: `The estimated transport cost is ₹${this.estimatedRidePrice}. Would you like to search for an available driver?`,
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: () => {
            this.hasRideRequest = false;
            this.selectedDeliveryType = null;
            this.selectedUrgency = null;
            this.estimatedRidePrice = 0;
            this.calculateRidePrice();
          }
        },
        {
          text: 'Yes',
          handler: () => {
            this.startDriverSearch();
          }
        }
      ]
    });
    await alert.present();
  }

  private calculateTotalWeight(): number {
    console.log(this.cartItems)
    return this.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  private async startDriverSearch() {
    this.isSearchingDriver = true;
    this.pollForDriverAssignment();
  }

  private currentOrderId: string | null = null;

  private async pollForDriverAssignment() {
    if (this.currentOrderId) {
      console.warn('Already polling for order:', this.currentOrderId);
      return;
    }

    const request = {
      deliveryType: this.selectedDeliveryType!,
      urgency: this.selectedUrgency!,
      pickup: this.selectedAddress.city,
      delivery: 'Destination',
      distance: this.getDistance(),
      load: {
        weight: this.calculateTotalWeight(),
        type: ""
      },
      basePrice: this.estimatedRidePrice,
      requestedDate: new Date().toISOString()
    };

    // Create order only once
    const newOrderId = await this.databaseService.createUnassignedOrder(request);
    this.currentOrderId = newOrderId;

    const pollInterval = setInterval(async () => {
      console.log("Checking driver assignment for order:", this.currentOrderId);

      const assignedDriver = await this.databaseService.checkOrderAssignment(this.currentOrderId!);
      console.log('Driver assignment result:', assignedDriver);

      if (assignedDriver) {
        this.isSearchingDriver = false;
        this.selectedTransporter = assignedDriver.id;
        clearInterval(pollInterval);
        this.currentOrderId = null;
        this.showDriverFoundAlert(assignedDriver);
      }
    }, 5000);

    // Clear polling after timeout
    setTimeout(() => {
      if (this.isSearchingDriver) {
        clearInterval(pollInterval);
        this.isSearchingDriver = false;
        this.currentOrderId = null;
        this.showNoDriverAlert();
      }
    }, 120000);
  }

  private getDistance(): number {
    // You could either calculate this based on actual locations
    // or get it from a previous calculation
    return Math.floor(Math.random() * (150 - 50 + 1)) + 50; // Sample 50-150km
  }

  private async showDriverFoundAlert(driver: any) {
    const alert = await this.alertCtrl.create({
      header: 'Driver Found!',
      message: `${driver.name} will handle your delivery.`,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showNoDriverAlert() {
    const alert = await this.alertCtrl.create({
      header: 'No Driver Available',
      message: 'Would you like to continue searching?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: () => {
            this.hasRideRequest = false;
            this.selectedDeliveryType = null;
            this.selectedUrgency = null;
            this.estimatedRidePrice = 0;
            this.calculateRidePrice();
          }
        },
        {
          text: 'Yes',
          handler: () => {
            this.startDriverSearch();
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmOrder() {
    if (!this.selectedTransporter) {
      const alert = await this.alertCtrl.create({
        header: 'No Transporter Selected',
        message: 'Your order will be processed directly with the seller without transport arrangement.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Continue',
            handler: () => {
              this.processDirectOrder();
            }
          }
        ]
      });
      await alert.present();
      return;
    }

    // Process normal order with transporter
    await this.processOrderWithTransport();
  }

  private async processDirectOrder() {
    this.isLoading = true;
    try {
      const directOrder: DirectOrder = {
        id: Date.now(),
        buyerId: 'currentUserId', // Replace with actual user ID
        sellerId: 'sellerId', // Get this from your cart items or store
        items: this.cartItems,
        totalAmount: this.totalPrice, // Using only item price, no transport cost
        pickupLocation: this.selectedAddress.city,
        dropoffLocation: 'Destination',
        weight: this.calculateTotalWeight(),
        status: 'pending',
        createdAt: new Date(),
        transportRequired: false
      };

      const result = await this.databaseService.assignDirectOrder(directOrder);

      if (result.success) {
        this.orderPlaced = true;
        const alert = await this.alertCtrl.create({
          header: 'Success',
          message: 'Order sent directly to seller!',
          buttons: ['OK']
        });
        await alert.present();
      } else {
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: result.message || 'Failed to place direct order.',
          buttons: ['OK']
        });
        await alert.present();
      }
    } catch (error) {
      console.error('Error processing direct order:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'An unexpected error occurred.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      this.isLoading = false;
    }
  }

  private async processOrderWithTransport() {
    this.isLoading = true;
    try {
      const order: Order = {
        items: this.cartItems,
        paymentMethod: this.selectedPaymentMethod,
        total: this.grandTotal,
        deliveryType: this.selectedDeliveryType,
        urgency: this.selectedUrgency,
        transporterId: this.selectedTransporter,
        pickupLocation: this.selectedAddress.city,
        dropoffLocation: 'Destination',
        weight: this.calculateTotalWeight()
      };

      const result = await this.databaseService.assignOrderToTransporters(order);

      if (result.success) {
        this.orderPlaced = true;
        const alert = await this.alertCtrl.create({
          header: 'Success',
          message: 'Order confirmed successfully!',
          buttons: ['OK']
        });
        await alert.present();
      } else {
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: result.message || 'Failed to assign order.',
          buttons: ['OK']
        });
        await alert.present();
      }
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/buyer/cart']);
  }

  changeAddress() {
    this.router.navigate(['/buyer/select-address']);
  }

  selectPayment(method: string) {
    this.selectedPaymentMethod = method;
  }

  getAvailableTransporterName(): string {
    if (!this.selectedTransporter) return '';
    const transporter = this.availableTransporters.find(t => t.id === this.selectedTransporter);
    return transporter?.name || '';
  }
}