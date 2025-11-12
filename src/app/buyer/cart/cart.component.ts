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
import { CartService, CartItem, AddCartItemRequest } from './cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit, OnDestroy {
  cartForm: FormGroup;
  cartProducts: CartItem[] = [];
  discount = 0;
  isLoading: boolean = false;
  selectedDate: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cartService: CartService,
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

    // Initialize with today's date
    this.selectedDate = new Date().toISOString().split('T')[0];

    this.cartForm = this.fb.group({
      discountCode: [''],
    });
  }

  ngOnInit() {
    this.loadCartItems();
    this.subscribeToCartChanges();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.cartService.clearPendingOperations();
  }


  private subscribeToCartChanges(): void {
    const cartSub = this.cartService.cartItems$.subscribe(
      (items) => {
        this.cartProducts = items;
        console.log('Cart items updated:', items);
      }
    );
    this.subscriptions.push(cartSub);
  }


  async loadCartItems(): Promise<void> {
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Loading cart...',
      spinner: 'dots'
    });
    await loading.present();

    this.cartService.getCartItems(this.selectedDate).subscribe({
      next: (items) => {
        this.cartProducts = items;
        console.log('Cart loaded:', items);
      },
      error: async (error) => {
        console.error('Error loading cart:', error);
        await this.showToast('Failed to load cart items', 'danger');
      },
      complete: async () => {
        this.isLoading = false;
        await loading.dismiss();
      }
    });
  }

  async increaseQuantity(index: number): Promise<void> {
  if (this.isLoading) return;

  const item = this.cartProducts[index];
  const newQuantity = item.quantity + 1;

  this.isLoading = true;

  this.cartService.updateItemQuantity(item.selected_id, newQuantity).subscribe({
    next: async () => {
      // Update local state immediately for better UX
      this.cartProducts[index].quantity = newQuantity;
      await this.showToast('Quantity updated', 'success');
      // Refresh cart to sync with backend
      this.loadCartItems();
    },
    error: async (error) => {
      console.error('Error updating quantity:', error);
      await this.showToast('Failed to update quantity', 'danger');
      this.isLoading = false;
    }
  });
}

  async decreaseQuantity(index: number): Promise<void> {
  if (this.isLoading) return;

  const item = this.cartProducts[index];

  if (item.quantity <= 1) {
    await this.confirmRemoveItem(index);
    return;
  }

  const newQuantity = item.quantity - 1;
  this.isLoading = true;

  this.cartService.updateItemQuantity(item.selected_id, newQuantity).subscribe({
    next: async () => {
      // Update local state immediately for better UX
      this.cartProducts[index].quantity = newQuantity;
      await this.showToast('Quantity updated', 'success');
      // Refresh cart to sync with backend
      this.loadCartItems();
    },
    error: async (error) => {
      console.error('Error updating quantity:', error);
      await this.showToast('Failed to update quantity', 'danger');
      this.isLoading = false;
    }
  });
}


  async removeItem(index: number): Promise<void> {
    await this.confirmRemoveItem(index);
  }


  private async confirmRemoveItem(index: number): Promise<void> {
    const item = this.cartProducts[index];

    const alert = await this.alertCtrl.create({
      header: 'Remove Item',
      message: `Are you sure you want to remove ${item.product_name} from your cart?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.executeRemoveItem(item.selected_id);
          }
        }
      ]
    });

    await alert.present();
  }


  private async executeRemoveItem(selectedId: number): Promise<void> {
    this.isLoading = true;

    this.cartService.deleteCartItem(selectedId).subscribe({
      next: async () => {
        await this.showToast('Item removed from cart', 'success');
        // Refresh cart to sync with backend
        this.loadCartItems();
      },
      error: async (error) => {
        console.error('Error removing item:', error);
        await this.showToast('Failed to remove item', 'danger');
        this.isLoading = false;
      }
    });
  }


  async applyDiscount(): Promise<void> {
    const discountCode = this.cartForm.get('discountCode')?.value?.trim();

    if (!discountCode) {
      await this.showToast('Please enter a discount code', 'warning');
      return;
    }

    // Mock discount logic - replace with actual API call
    const discountMap: { [key: string]: number } = {
      'SAVE10': 10,
      'FRESH20': 20,
      'WELCOME15': 15
    };

    const discountAmount = discountMap[discountCode.toUpperCase()];

    if (discountAmount) {
      this.discount = discountAmount;
      await this.showToast(`Discount of ₹${discountAmount} applied!`, 'success');
    } else {
      await this.showToast('Invalid discount code', 'danger');
    }
  }


  getTotalPrice(): number {
    return this.cartProducts.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }


  async checkout(): Promise<void> {
    if (this.cartProducts.length === 0) {
      await this.showToast('Your cart is empty', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirm Order',
      message: `Total Amount: ₹${this.getTotalPrice() - this.discount}`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: async () => {
            await this.processCheckout();
          }
        }
      ]
    });

    await alert.present();
  }


  private async processCheckout(): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: 'Processing order...',
      spinner: 'dots'
    });
    await loading.present();

    // TODO: Implement actual checkout API call
    setTimeout(async () => {
      await loading.dismiss();
      await this.showToast('Order placed successfully!', 'success');
      this.cartService.clearCart();
      this.router.navigate(['/buyer/orders']);
    }, 2000);
  }


  goBack(): void {
    this.router.navigate(['/buyer/buyer-home']);
  }


  private async showToast(message: string, color: string = 'dark'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}