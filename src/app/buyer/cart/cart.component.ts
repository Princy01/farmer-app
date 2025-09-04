import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
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
export class CartComponent implements OnInit, OnDestroy {
  cartForm: FormGroup;
  cartDetails: CartResponse['cart_details'] | null = null;
  cartProducts: CartResponse['products'] = [];
  discount = 0;
  isLoading: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cartService: CartService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
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

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.cartService.clearPendingOperations();
  }

  private checkAuthAndLoadCart() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    if (!this.authService.hasRole('retailer')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadCart();
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

  async loadCart() {
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

      const subscription = this.cartService.getCart().subscribe({
        next: (response) => {
          console.log('Cart loaded:', response);
          this.cartDetails = response.cart_details;
          this.cartProducts = response.products;
          loading.dismiss();
          this.isLoading = false;
        },
        error: async (error) => {
          loading.dismiss();
          this.isLoading = false;

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
                  this.loadCart();
                }
              }
            ]
          });
          await alert.present();
        }
      });

      this.subscriptions.push(subscription);
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

  async increaseQuantity(index: number) {
    if (!this.cartDetails || this.isLoading) return;

    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const product = this.cartProducts[index];
    const newQuantity = product.quantity + 1;

    console.log('Increasing quantity for product:', product.product_id, 'from', product.quantity, 'to', newQuantity);

    this.isLoading = true;

    try {
      const subscription = this.cartService.updateProductQuantity(
        this.cartDetails.cart_id,
        product.product_id,
        newQuantity
      ).subscribe({
        next: (response) => {
          console.log('Quantity increase successful:', response);
          this.cartDetails = response.cart_details;
          this.cartProducts = response.products || [];
          this.isLoading = false;
        },
        error: async (error) => {
          console.error('Error increasing quantity:', error);
          this.isLoading = false;

          if (error.message?.includes('already in progress')) {
            return; // Silently ignore concurrent requests
          }

          if (error.status === 401) {
            this.showAuthError();
            return;
          }

          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: 'Failed to update quantity. Please try again.',
            buttons: [
              {
                text: 'OK',
                handler: () => {
                  this.loadCart(); // Reload to sync state
                }
              }
            ]
          });
          await alert.present();
        }
      });

      this.subscriptions.push(subscription);
    } catch (err) {
      this.isLoading = false;
      console.error('Unexpected error:', err);
    }
  }

  async decreaseQuantity(index: number) {
    if (!this.cartDetails || this.isLoading) return;

    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const product = this.cartProducts[index];
    if (product.quantity <= 1) return;

    const newQuantity = product.quantity - 1;

    console.log('Decreasing quantity for product:', product.product_id, 'from', product.quantity, 'to', newQuantity);

    this.isLoading = true;

    try {
      const subscription = this.cartService.updateProductQuantity(
        this.cartDetails.cart_id,
        product.product_id,
        newQuantity
      ).subscribe({
        next: (response) => {
          console.log('Quantity decrease successful:', response);
          this.cartDetails = response.cart_details;
          this.cartProducts = response.products || [];
          this.isLoading = false;
        },
        error: async (error) => {
          console.error('Error decreasing quantity:', error);
          this.isLoading = false;

          if (error.message?.includes('already in progress')) {
            return; // Silently ignore concurrent requests
          }

          if (error.status === 401) {
            this.showAuthError();
            return;
          }

          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: 'Failed to update quantity. Please try again.',
            buttons: [
              {
                text: 'OK',
                handler: () => {
                  this.loadCart(); // Reload to sync state
                }
              }
            ]
          });
          await alert.present();
        }
      });

      this.subscriptions.push(subscription);
    } catch (err) {
      this.isLoading = false;
      console.error('Unexpected error:', err);
    }
  }

  async removeItem(index: number) {
    if (!this.cartDetails) return;

    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const product = this.cartProducts[index];

    const confirmAlert = await this.alertCtrl.create({
      header: 'Remove Item',
      message: `Are you sure you want to remove "${product.product_name}" from your cart?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          cssClass: 'danger-button',
          handler: async () => {
            await this.performItemRemoval(product.product_id, product.product_name);
          }
        }
      ]
    });

    await confirmAlert.present();
  }

  private async performItemRemoval(productId: number, productName: string) {
    if (!this.cartDetails) return;

    const loading = await this.loadingCtrl.create({
      message: 'Removing item...',
      spinner: 'circular'
    });

    try {
      await loading.present();

      console.log('Removing item:', {
        cartId: this.cartDetails.cart_id,
        productId: productId
      });

      const subscription = this.cartService.removeCartItem(
        this.cartDetails.cart_id,
        productId
      ).subscribe({
        next: (response) => {
          console.log('Item removed successfully:', response);

          this.cartProducts = response.products || [];
          this.cartDetails = response.cart_details;

          loading.dismiss();
          this.showSuccessToast(`${productName} removed from cart`);
        },
        error: async (error) => {
          loading.dismiss();
          console.error('Error removing item:', error);

          if (error.message?.includes('already in progress')) {
            return; // Silently ignore concurrent requests
          }

          if (error.status === 401) {
            this.showAuthError();
            return;
          }

          let errorMessage = 'Failed to remove item. Please try again.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: errorMessage,
            buttons: [
              {
                text: 'OK',
                handler: () => {
                  this.loadCart(); // Reload to sync state
                }
              }
            ]
          });
          await alert.present();
        }
      });

      this.subscriptions.push(subscription);
    } catch (err) {
      loading.dismiss();
      console.error('Unexpected error:', err);

      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'An unexpected error occurred.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  applyDiscount() {
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

      await this.loadCart();
    } finally {
      event.target.complete();
    }
  }
}