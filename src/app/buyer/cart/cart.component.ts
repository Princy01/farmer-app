import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  trashOutline,
  cartOutline,
  chevronBack,
  removeOutline,
  addOutline,
  pricetagOutline,
  calendarOutline,
  checkmarkCircle,
  alertCircleOutline,
  storefrontOutline,
  cardOutline
} from 'ionicons/icons';
import { CartService } from './cart.service';
import { CartResponse } from './cart.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartForm: FormGroup;
  cartDetails: CartResponse['cart_details'] | null = null;
  cartProducts: CartResponse['products'] = [];
  discount = 0;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cartService: CartService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {
    addIcons({
      trashOutline,
      cartOutline,
      chevronBack,
      removeOutline,
      addOutline,
      pricetagOutline,
      calendarOutline,
      checkmarkCircle,
      alertCircleOutline,
      storefrontOutline,
      cardOutline
    });

    this.cartForm = this.fb.group({
      discountCode: [''],
      deliveryDate: ['']
    });
  }

  ngOnInit() {
    this.checkAuthAndLoadCart();
  }

  // Authentication check
  private checkAuthAndLoadCart() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    // Check if user has retailer role
    if (!this.authService.hasRole('retailer')) {
      this.showUnauthorizedError();
      return;
    }

    // Load cart using cartId from localStorage (if available) or create new cart
    const cartId = localStorage.getItem('cartId');
    if (cartId) {
      this.loadCart(Number(cartId));
    } else {
      // Redirect to buyer home if no cart exists
      this.router.navigate(['/buyer/buyer-home']);
    }
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: 'Authentication Error',
      message: 'Your session has expired. Please login again.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  // Unauthorized error handler
  private async showUnauthorizedError() {
    const alert = await this.alertCtrl.create({
      header: 'Access Denied',
      message: 'You do not have permission to access this page.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  goBack() {
    this.router.navigate(['/buyer/buyer-home']);
  }

  async loadCart(cartId: number) {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Loading cart...',
      spinner: 'circular'
    });

    try {
      await loading.present();
      this.isLoading = true;

      // Call service without retailerId - backend will get retailer_id from JWT
      this.cartService.getCart(cartId).subscribe({
        next: (response) => {
          this.cartDetails = response.cart_details;
          this.cartProducts = response.products;
          loading.dismiss();
          this.isLoading = false;
        },
        error: async (error) => {
          loading.dismiss();
          this.isLoading = false;

          // Handle authentication errors
          if (error.status === 401) {
            this.showAuthError();
            return;
          }

          console.error('Error loading cart:', error);
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: 'Failed to load cart. Please try again.',
            buttons: [
              {
                text: 'Dismiss',
                role: 'cancel'
              },
              {
                text: 'Retry',
                handler: () => {
                  this.loadCart(cartId);
                }
              }
            ]
          });
          await alert.present();
        }
      });
    } catch (err) {
      loading.dismiss();
      this.isLoading = false;
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'An unexpected error occurred.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  getTotalPrice(): number {
    return this.cartProducts.reduce((total, item) =>
      total + (item.latest_wholesaler_price * item.quantity), 0
    );
  }

  increaseQuantity(index: number) {
    this.cartProducts[index].quantity++;
  }

  decreaseQuantity(index: number) {
    if (this.cartProducts[index].quantity > 1) {
      this.cartProducts[index].quantity--;
    }
  }

  async removeItem(index: number) {
    if (!this.cartDetails) return;

    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Removing item...',
      spinner: 'circular'
    });

    try {
      await loading.present();
      const product = this.cartProducts[index];

      this.cartService.removeCartItem(
        this.cartDetails.cart_id,
        product.product_id,
        this.cartDetails.wholeseller_id
      ).subscribe({
        next: (response) => {
          this.cartProducts = response.products;
          this.cartDetails = response.cart_details;
          loading.dismiss();
        },
        error: async (error) => {
          loading.dismiss();

          // Handle authentication errors
          if (error.status === 401) {
            this.showAuthError();
            return;
          }

          console.error('Error removing item:', error);
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: 'Failed to remove item. Please try again.',
            buttons: ['OK']
          });
          await alert.present();
        }
      });
    } catch (err) {
      loading.dismiss();
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'An unexpected error occurred.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  applyDiscount() {
    // TODO: Implement API call for discount
    const code = this.cartForm.get('discountCode')?.value;
    const validCodes: { [key: string]: number } = {
      'SAVE10': 10,
      'FRESH20': 20
    };

    this.discount = validCodes[code] ? (this.getTotalPrice() * validCodes[code]) / 100 : 0;
  }

  checkout() {
    if (!this.cartDetails) return;

    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    // Navigate to checkout with cart data including retailer info
    this.router.navigate(['/buyer/checkout'], {
      state: {
        cartItems: this.cartProducts,
        totalPrice: this.getTotalPrice() - this.discount,
        deliveryDate: this.cartForm.get('deliveryDate')?.value,
        retailer: {
          id: this.cartDetails.retailer_id,
          name: this.cartDetails.retailer_name,
          address: this.cartDetails.retailer_address,
          state: this.cartDetails.retailer_state_name,
          location: this.cartDetails.retailer_location_name
        },
        wholeseller: this.cartDetails.wholeseller_id ? {
          id: this.cartDetails.wholeseller_id,
          name: this.cartDetails.wholeseller_name
        } : null
      }
    });
  }

  async handleRefresh(event: any) {
    try {
      if (!this.authService.isAuthenticated()) {
        this.showAuthError();
        return;
      }

      const cartId = localStorage.getItem('cartId');
      if (cartId) {
        await this.loadCart(Number(cartId));
      }
    } finally {
      event.target.complete();
    }
  }
}