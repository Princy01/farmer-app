import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward } from 'ionicons/icons';
// New imports
import { DatabaseService } from '../../services/database.service';

// New interfaces
interface CartItem {
  id: number;
  name: string;
  image: string;
  hindiName: string;
  quantity: number;
  price: number;
  weight: number;
}

interface DeliveryAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent {
  // Old properties
  /*
  cartItems: any[] = [];
  totalPrice: number = 0;
  selectedPaymentMethod: string = 'upi';
  estimatedDelivery: string = '3-5 Business Days';
  trackingNumber: string = 'TRK123456789';
  orderPlaced: boolean = false;

  selectedDeliveryType: string | null = null;
  selectedUrgency: string | null = null;
  estimatedRidePrice: number = 0;
  grandTotal: number = 0;

  selectedAddress: any = {
    name: 'ABC',
    street: '123 XY',
    city: 'New Delhi',
    state: 'Delhi',
    zip: '110001',
  };
  */

  // Updated properties with proper typing
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

  // Old constructor
  /*
  constructor(private router: Router, private route: ActivatedRoute) {
    addIcons({ chevronBack, chevronForward });

    const navData = this.router.getCurrentNavigation()?.extras.state;
    if (navData) {
      this.cartItems = navData['cartItems'] || [];
      this.totalPrice = navData['totalPrice'] || 0;
    }

    this.route.queryParams.subscribe((params) => {
      if (params['deliveryType']) {
        this.selectedDeliveryType = params['deliveryType'];
      }
      if (params['urgency']) {
        this.selectedUrgency = params['urgency'];
      }
      this.calculateRidePrice();
    });
  }
  */

  // Updated constructor with DatabaseService
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
        this.startDriverSearch();
        this.calculateRidePrice();
      }
    });
  }

  // New method to load transporters
  private loadTransporters() {
    this.availableTransporters = this.databaseService.getAvailableTransporters();
  }

  // Old calculateRidePrice method
  /*
  calculateRidePrice() {
    if (this.selectedDeliveryType) {
      this.estimatedRidePrice = 50 + this.cartItems.length * 10;
    } else {
      this.estimatedRidePrice = 0;
    }
    this.grandTotal = this.totalPrice + this.estimatedRidePrice;
  }
  */

  // Updated calculateRidePrice method
  calculateRidePrice() {
    if (this.selectedDeliveryType && this.selectedAddress) {
      const totalWeight = this.cartItems.reduce((sum, item) => sum + (item.weight || 0), 0);

      this.estimatedRidePrice = this.databaseService.calculateBasePrice(
        this.selectedAddress.city,
        'Destination', // TODO: Update with actual delivery address
        totalWeight,
        this.selectedDeliveryType,
        this.selectedUrgency || 'normal',
        // this.selectedTransporter || undefined
      );
    } else {
      this.estimatedRidePrice = 0;
    }
    this.grandTotal = this.totalPrice + this.estimatedRidePrice;
  }

  // New method for transporter selection
  selectTransporter(transporterId: string) {
    this.selectedTransporter = transporterId;
    this.calculateRidePrice();
  }

  // Old arrangeRide method
  /*
  arrangeRide() {
    this.router.navigate(['/buyer/ride'], {
      queryParams: {
        deliveryType: this.selectedDeliveryType,
        urgency: this.selectedUrgency,
      },
    });
  }
  */

  // Updated arrangeRide method
  arrangeRide() {
    this.router.navigate(['/buyer/ride'], {
      queryParams: {
        deliveryType: this.selectedDeliveryType,
        urgency: this.selectedUrgency,
      },
    });
  }

  private calculateTotalWeight(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.weight || 0), 0);
  }

  private async startDriverSearch() {
    this.isSearchingDriver = true;
    // Start polling for driver assignment
    this.pollForDriverAssignment();
  }

  private async pollForDriverAssignment() {
    // Simulate polling every 5 seconds
    const pollInterval = setInterval(async () => {
      const assignedDriver = await this.databaseService.checkDriverAssignment(
        this.selectedDeliveryType!,
        this.selectedUrgency!,
        this.calculateTotalWeight()
      );

      if (assignedDriver) {
        this.isSearchingDriver = false;
        this.selectedTransporter = assignedDriver.id;
        clearInterval(pollInterval);
        this.showDriverFoundAlert(assignedDriver);
      }
    }, 5000);

    // Stop polling after 2 minutes if no driver found
    setTimeout(() => {
      if (this.isSearchingDriver) {
        clearInterval(pollInterval);
        this.isSearchingDriver = false;
        this.showNoDriverAlert();
      }
    }, 120000);
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

  // Old confirmOrder method
  /*
  confirmOrder() {
    this.orderPlaced = true;
    console.log('Order Confirmed!', {
      items: this.cartItems,
      paymentMethod: this.selectedPaymentMethod,
      total: this.grandTotal,
      deliveryType: this.selectedDeliveryType,
      urgency: this.selectedUrgency,
    });
  }
  */

  // Updated confirmOrder method
  async confirmOrder() {
    if (!this.selectedTransporter) {
      // TODO: Add proper error handling UI
      return;
    }

    this.isLoading = true;
    try {
      const order = {
        items: this.cartItems,
        paymentMethod: this.selectedPaymentMethod,
        total: this.grandTotal,
        deliveryType: this.selectedDeliveryType,
        urgency: this.selectedUrgency,
        transporterId: this.selectedTransporter,
        pickupLocation: this.selectedAddress.city,
        dropoffLocation: 'Destination', // TODO: Update with actual delivery address
        weight: this.cartItems.reduce((sum, item) => sum + (item.weight || 0), 0)
      };

      const result = await this.databaseService.assignOrderToTransporters(order);

      if (result.success) {
        this.orderPlaced = true;
        console.log('Order Confirmed!', order);
      } else {
        console.error('Failed to assign order:', result.message);
        // TODO: Add proper error handling UI
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Existing unchanged methods
  goBack() {
    this.router.navigate(['/buyer/cart']);
  }

  changeAddress() {
    this.router.navigate(['/buyer/select-address']);
  }

  selectPayment(method: string) {
    this.selectedPaymentMethod = method;
  }

  getAvailableTransporterName() {
    console.log(this.availableTransporters,this.selectedTransporter)
    return this.availableTransporters.find(transporter => transporter.name == this.selectedTransporter!)!.name
  }
}