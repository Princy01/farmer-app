import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
import { TranslateService, TranslateModule } from '@ngx-translate/core';

interface QuantityUpdate {
  index: number;
  selectedId: number;
  quantity: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, TranslateModule],
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
  private quantityUpdateSubject = new Subject<QuantityUpdate>();
  private deleteItemSubject = new Subject<number>();

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cartService: CartService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private translate: TranslateService
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

    this.selectedDate = new Date().toISOString().split('T')[0];

    this.cartForm = this.fb.group({
      discountCode: [''],
    });
  }

  ngOnInit() {
    this.loadCartItems();
    this.subscribeToCartChanges();
    this.setupQuantityDebounce();
    this.setupDeleteDebounce();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.quantityUpdateSubject.complete();
    this.deleteItemSubject.complete();
    this.cartService.clearPendingOperations();
  }

  private setupQuantityDebounce(): void {
    const quantitySub = this.quantityUpdateSubject.pipe(
      debounceTime(800), // Wait 800ms after last change
      distinctUntilChanged((prev, curr) =>
        prev.selectedId === curr.selectedId && prev.quantity === curr.quantity
      )
    ).subscribe(async (update) => {
      await this.executeQuantityUpdate(update);
    });

    this.subscriptions.push(quantitySub);
  }

  private setupDeleteDebounce(): void {
    const deleteSub = this.deleteItemSubject.pipe(
      debounceTime(500) // Wait 500ms before deleting
    ).subscribe(async (selectedId) => {
      await this.executeRemoveItem(selectedId);
    });

    this.subscriptions.push(deleteSub);
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
      message: this.translate.instant('CART.LOADING_CART'),
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
        await this.showToast(this.translate.instant('CART.FAILED_LOAD'), 'danger');
      },
      complete: async () => {
        this.isLoading = false;
        await loading.dismiss();
      }
    });
  }

  increaseQuantity(index: number): void {
    const item = this.cartProducts[index];
    const newQuantity = item.quantity + 1;

    // Update UI immediately for responsive feel
    this.cartProducts[index].quantity = newQuantity;

    // Queue the update with debounce
    this.quantityUpdateSubject.next({
      index,
      selectedId: item.selected_id,
      quantity: newQuantity
    });
  }

  decreaseQuantity(index: number): void {
    const item = this.cartProducts[index];
    const newQuantity = item.quantity - 1;

    if (newQuantity <= 0) {
      // Auto-delete when quantity reaches 0
      this.cartProducts[index].quantity = 0;
      this.deleteItemSubject.next(item.selected_id);
      return;
    }

    // Update UI immediately for responsive feel
    this.cartProducts[index].quantity = newQuantity;

    // Queue the update with debounce
    this.quantityUpdateSubject.next({
      index,
      selectedId: item.selected_id,
      quantity: newQuantity
    });
  }

  private async executeQuantityUpdate(update: QuantityUpdate): Promise<void> {
    this.isLoading = true;

    this.cartService.updateItemQuantity(update.selectedId, update.quantity).subscribe({
      next: async () => {
        await this.showToast(this.translate.instant('CART.QUANTITY_UPDATED'), 'success');
        // Refresh cart to sync with backend
        this.loadCartItems();
      },
      error: async (error) => {
        console.error('Error updating quantity:', error);
        await this.showToast(this.translate.instant('CART.FAILED_UPDATE_QUANTITY'), 'danger');
        // Revert the optimistic update
        this.loadCartItems();
      }
    });
  }

  async removeItem(index: number): Promise<void> {
    await this.confirmRemoveItem(index);
  }

  private async confirmRemoveItem(index: number): Promise<void> {
    const item = this.cartProducts[index];

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('CART.REMOVE_ITEM_HEADER'),
      message: this.translate.instant('CART.REMOVE_ITEM_MESSAGE', { product: item.product_name }),
      buttons: [
        {
          text: this.translate.instant('CART.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('CART.REMOVE'),
          role: 'destructive',
          handler: () => {
            this.deleteItemSubject.next(item.selected_id);
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
        await this.showToast(this.translate.instant('CART.ITEM_REMOVED'), 'success');
        // Refresh cart to sync with backend
        this.loadCartItems();
      },
      error: async (error) => {
        console.error('Error removing item:', error);
        await this.showToast(this.translate.instant('CART.FAILED_REMOVE_ITEM'), 'danger');
        this.isLoading = false;
        // Reload to revert optimistic update
        this.loadCartItems();
      }
    });
  }

  async applyDiscount(): Promise<void> {
    const discountCode = this.cartForm.get('discountCode')?.value?.trim();

    if (!discountCode) {
      await this.showToast(this.translate.instant('CART.ENTER_CODE'), 'warning');
      return;
    }

    const discountMap: { [key: string]: number } = {
      'SAVE10': 10,
      'FRESH20': 20,
      'WELCOME15': 15
    };

    const discountAmount = discountMap[discountCode.toUpperCase()];

    if (discountAmount) {
      this.discount = discountAmount;
      await this.showToast(this.translate.instant('CART.DISCOUNT_APPLIED_MSG', { amount: discountAmount }), 'success');
    } else {
      await this.showToast(this.translate.instant('CART.INVALID_CODE'), 'danger');
    }
  }

  getTotalPrice(): number {
    return this.cartProducts.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  async checkout(): Promise<void> {
    if (this.cartProducts.length === 0) {
      await this.showToast(this.translate.instant('CART.EMPTY_CART'), 'warning');
      return;
    }

    console.log('Proceeding to checkout with items:', this.cartProducts);
    this.router.navigate(['/buyer/checkout'], {
      state: {
        cartItems: this.cartProducts,
        discount: this.discount,
        totalPrice: this.getTotalPrice() - this.discount
      }
    });
  }

  // private async processCheckout(): Promise<void> {
  //   const loading = await this.loadingCtrl.create({
  //     message: this.translate.instant('CART.PROCESSING_ORDER'),
  //     spinner: 'dots'
  //   });
  //   await loading.present();

  //   setTimeout(async () => {
  //     await loading.dismiss();
  //     await this.showToast(this.translate.instant('CART.ORDER_PLACED'), 'success');
  //     this.cartService.clearCart();
  //     this.router.navigate(['/buyer/orders']);
  //   }, 2000);
  // }

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