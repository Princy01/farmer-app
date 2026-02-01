import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ToastController, ModalController } from '@ionic/angular';
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
  cardOutline,
  chevronDownOutline,
  chevronUpOutline,
  businessOutline,
  ellipsisVerticalOutline,
  checkboxOutline,
  squareOutline,
  closeOutline,
  close as closeIcon
} from 'ionicons/icons';
import { CartService, CartItem } from './cart.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

// ─── Grouped wholesaler types ────────────────────────────────────────────────
export interface WholesalerGroup {
  wholesalerId: number;
  branchId: number;
  wholesalerName: string;
  branchName: string;
  items: CartItem[];
  subtotal: number;
  isSelected: boolean;   // whether this group is checked for checkout
  isExpanded: boolean;   // whether the item list is visible
}

interface QuantityUpdate {
  wholesalerKey: string; // "wholesalerId_branchId"
  index: number;         // index within the group's items array
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
  cartProducts: CartItem[] = [];   // raw flat list from backend
  wholesalerGroups: WholesalerGroup[] = [];
  discount = 0;
  isLoading = false;
  selectedDate: string;

  // Feature flag: allow multiple selection
  allowMultipleSelection = false;

  // Derived totals across all selected groups
  selectedSubtotal = 0;
  selectedGroupCount = 0;
  selectedItemCount = 0;

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
      'trash-outline': trashOutline,
      'cart-outline': cartOutline,
      'chevron-back': chevronBack,
      'remove-outline': removeOutline,
      'add-outline': addOutline,
      'pricetag-outline': pricetagOutline,
      'calendar-outline': calendarOutline,
      'checkmark-circle': checkmarkCircle,
      'alert-circle-outline': alertCircleOutline,
      'storefront-outline': storefrontOutline,
      'card-outline': cardOutline,
      'chevron-down-outline': chevronDownOutline,
      'chevron-up-outline': chevronUpOutline,
      'business-outline': businessOutline,
      'ellipsis-vertical-outline': ellipsisVerticalOutline,
      'checkbox-outline': checkboxOutline,
      'square-outline': squareOutline,
      'close': closeIcon,
      'close-outline': closeOutline
    });

    this.selectedDate = new Date().toISOString().split('T')[0];
    this.cartForm = this.fb.group({ discountCode: [''] });
  }

  ngOnInit() {
    this.loadCartItems();
    this.setupQuantityDebounce();
    this.setupDeleteDebounce();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.quantityUpdateSubject.complete();
    this.deleteItemSubject.complete();
    this.cartService.clearPendingOperations();
  }

  // ─── Debounce setup ────────────────────────────────────────────────────────
  private setupQuantityDebounce(): void {
    const sub = this.quantityUpdateSubject.pipe(
      debounceTime(800),
      distinctUntilChanged((a, b) =>
        a.selectedId === b.selectedId && a.quantity === b.quantity
      )
    ).subscribe(update => this.executeQuantityUpdate(update));
    this.subscriptions.push(sub);
  }

  private setupDeleteDebounce(): void {
    const sub = this.deleteItemSubject.pipe(
      debounceTime(500)
    ).subscribe(selectedId => this.executeRemoveItem(selectedId));
    this.subscriptions.push(sub);
  }

  // ─── Load & group ──────────────────────────────────────────────────────────
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
        this.buildGroups();
      },
      error: async () => {
        await this.showToast(this.translate.instant('CART.FAILED_LOAD'), 'danger');
      },
      complete: async () => {
        this.isLoading = false;
        await loading.dismiss();
      }
    });
  }

  /**
   * Builds wholesalerGroups from the flat cartProducts list.
   * Grouping key = wholesalerId + branchId (each combo is unique inventory).
   * Preserves previous selection + expansion state if the key still exists.
   */
  private buildGroups(): void {
    // snapshot previous state by key so we can restore selection/expansion
    const prevState = new Map<string, { isSelected: boolean; isExpanded: boolean }>();
    let firstOne = true
    for (const g of this.wholesalerGroups) {
      prevState.set(this.groupKey(g.wholesalerId, g.branchId), {
        isSelected: g.isSelected,
        isExpanded: g.isExpanded && firstOne
      });

      firstOne = false;
    }

    const map = new Map<string, WholesalerGroup>();

    for (const item of this.cartProducts) {
      const wId = item.wholesaler_id ?? 0;
      const bId = item.branch_id ?? 0;
      const key = this.groupKey(wId, bId);

      if (!map.has(key)) {
        const prev = prevState.get(key);
        map.set(key, {
          wholesalerId: wId,
          branchId: bId,
          wholesalerName: item.wholesaler_name ?? `Wholesaler ${wId}`,
          branchName: `Branch ${bId}`,
          items: [],
          subtotal: 0,
          isSelected: prev?.isSelected ?? false,   // default not selected when single-select
          isExpanded: prev?.isExpanded ?? false  // default collapsed
        });
      }

      const group = map.get(key)!;
        group.items.push(item);
        group.subtotal += item.price * item.quantity;
      }

      this.wholesalerGroups = Array.from(map.values());

      // If no group is selected and single-select mode, select the first one
      if (!this.allowMultipleSelection && this.wholesalerGroups.length > 0) {
        const hasSelection = this.wholesalerGroups.some(g => g.isSelected);
        if (!hasSelection) {
          this.wholesalerGroups[0].isSelected = true;
        }
      }

      this.recalcSelectedTotals();
    }

  private groupKey(wholesalerId: number, branchId: number): string {
    return `${wholesalerId}_${branchId}`;
  }

  // ─── Selection & expansion ─────────────────────────────────────────────────
  toggleGroupSelection(group: WholesalerGroup): void {
    if (this.allowMultipleSelection) {
      // Multi-select mode: toggle the clicked group
      group.isSelected = !group.isSelected;
    } else {
      // Single-select mode: deselect all others, select this one
      this.wholesalerGroups.forEach(g => g.isSelected = false);
      group.isSelected = true;
    }
    this.recalcSelectedTotals();
  }

  toggleGroupExpansion(group: WholesalerGroup): void {
    group.isExpanded = !group.isExpanded;
  }

  selectAllGroups(): void {
    if (!this.allowMultipleSelection) {
      // In single-select mode, this doesn't make sense, so we skip it
      return;
    }

    const allSelected = this.wholesalerGroups.every(g => g.isSelected);
    this.wholesalerGroups.forEach(g => g.isSelected = !allSelected);
    this.recalcSelectedTotals();
  }

  private recalcSelectedTotals(): void {
    this.selectedSubtotal = 0;
    this.selectedGroupCount = 0;
    this.selectedItemCount = 0;

    for (const g of this.wholesalerGroups) {
      if (!g.isSelected) continue;
      this.selectedGroupCount++;
      this.selectedSubtotal += g.subtotal;
      this.selectedItemCount += g.items.length;
    }
  }

  // ─── Quantity controls (operate on group + index within group) ─────────────
  increaseQuantity(group: WholesalerGroup, index: number): void {
    const item = group.items[index];
    item.quantity += 1;
    group.subtotal += item.price; // optimistic update
    this.recalcSelectedTotals();

    this.quantityUpdateSubject.next({
      wholesalerKey: this.groupKey(group.wholesalerId, group.branchId),
      index,
      selectedId: item.selected_id,
      quantity: item.quantity
    });
  }

  decreaseQuantity(group: WholesalerGroup, index: number): void {
    const item = group.items[index];

    if (item.quantity - 1 <= 0) {
      // remove item
      item.quantity = 0;
      this.deleteItemSubject.next(item.selected_id);
      return;
    }

    item.quantity -= 1;
    group.subtotal -= item.price; // optimistic update
    this.recalcSelectedTotals();

    this.quantityUpdateSubject.next({
      wholesalerKey: this.groupKey(group.wholesalerId, group.branchId),
      index,
      selectedId: item.selected_id,
      quantity: item.quantity
    });
  }

  private async executeQuantityUpdate(update: QuantityUpdate): Promise<void> {
    this.isLoading = true;
    this.cartService.updateItemQuantity(update.selectedId, update.quantity).subscribe({
      next: async () => {
        this.isLoading = false;
        await this.showToast(this.translate.instant('CART.QUANTITY_UPDATED'), 'success');
        this.loadCartItems(); // re-sync
      },
      error: async () => {
        this.isLoading = false;
        await this.showToast(this.translate.instant('CART.FAILED_UPDATE_QUANTITY'), 'danger');
        this.loadCartItems(); // revert
      }
    });
  }

  // ─── Remove item ───────────────────────────────────────────────────────────
  async removeItem(group: WholesalerGroup, index: number): Promise<void> {
    const item = group.items[index];
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('CART.REMOVE_ITEM_HEADER'),
      message: this.translate.instant('CART.REMOVE_ITEM_MESSAGE', { product: item.product_name }),
      buttons: [
        { text: this.translate.instant('CART.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('CART.REMOVE'),
          role: 'destructive',
          handler: () => this.deleteItemSubject.next(item.selected_id)
        }
      ]
    });
    await alert.present();
  }

  private async executeRemoveItem(selectedId: number): Promise<void> {
    this.isLoading = true;
    this.cartService.deleteCartItem(selectedId).subscribe({
      next: async () => {
        this.isLoading = false;
        await this.showToast(this.translate.instant('CART.ITEM_REMOVED'), 'success');
        this.loadCartItems();
      },
      error: async () => {
        this.isLoading = false;
        await this.showToast(this.translate.instant('CART.FAILED_REMOVE_ITEM'), 'danger');
        this.loadCartItems();
      }
    });
  }

  // ─── Remove entire wholesaler group ────────────────────────────────────────
  async removeGroup(group: WholesalerGroup): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('CART.REMOVE_ITEM_HEADER'),
      message: this.translate.instant('CART.REMOVE_GROUP_MESSAGE', {
        wholesaler: group.wholesalerName,
        count: group.items.length
      }),
      buttons: [
        { text: this.translate.instant('CART.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('CART.REMOVE'),
          role: 'destructive',
          handler: async () => {
            // fire delete for every item in the group
            const ids = group.items.map(i => i.selected_id);
            for (const id of ids) {
              this.deleteItemSubject.next(id);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // ─── Discount ──────────────────────────────────────────────────────────────
  async applyDiscount(): Promise<void> {
    const code = this.cartForm.get('discountCode')?.value?.trim();
    if (!code) {
      await this.showToast(this.translate.instant('CART.ENTER_CODE'), 'warning');
      return;
    }

    const discountMap: Record<string, number> = { 'SAVE10': 10, 'FRESH20': 20, 'WELCOME15': 15 };
    const amount = discountMap[code.toUpperCase()];

    if (amount) {
      this.discount = amount;
      await this.showToast(
        this.translate.instant('CART.DISCOUNT_APPLIED_MSG', { amount }),
        'success'
      );
    } else {
      await this.showToast(this.translate.instant('CART.INVALID_CODE'), 'danger');
    }
  }

  // ─── Checkout — sends only selected groups ────────────────────────────────
  async checkout(): Promise<void> {
    const selected = this.wholesalerGroups.filter((g: WholesalerGroup) => g.isSelected);

    if (selected.length === 0) {
      await this.showToast(this.translate.instant('CART.SELECT_ITEMS_FIRST'), 'warning');
      return;
    }

    // Flatten selected groups back into items for the existing checkout flow

    const selectedItems: CartItem[] = selected.flatMap((g: WholesalerGroup) => g.items);

    this.router.navigate(['/buyer/checkout'], {
      state: {
        cartItems: selectedItems,
        discount: this.discount,
        totalPrice: this.selectedSubtotal - this.discount,
        wholesalerGroups: selected.map((g: WholesalerGroup) => ({
          wholesalerId: g.wholesalerId,
          branchId: g.branchId,
          wholesalerName: g.wholesalerName,
          branchName: g.branchName,
          itemCount: g.items.length,
          subtotal: g.subtotal
        }))
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/buyer/buyer-home']);
  }

  getSelectAllIconName(wholesalerGroups: WholesalerGroup[]): string {
    return wholesalerGroups.every(g => g.isSelected) ? 'checkbox-outline' : 'square-outline';
  }

  private async showToast(message: string, color = 'dark'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await toast.present();
  }
}