import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
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

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cartService: CartService
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
    const cartId = localStorage.getItem('cartId');
    if (cartId) {
      this.loadCart(Number(cartId));
    } else {
      this.router.navigate(['/buyer/buyer-home']);
    }
  }

  goBack() {
    this.router.navigate(['/buyer/buyer-home']);
  }

  loadCart(cartId: number) {
    this.cartService.getCart(cartId).subscribe({
      next: (response) => {
        this.cartDetails = response.cart_details;
        this.cartProducts = response.products;
      },
      error: (error) => {
        console.error('Error loading cart:', error);
      }
    });
  }

  getTotalPrice(): number {
    return this.cartProducts.reduce((total, item) =>
      total + (item.latest_wholesaler_price * item.quantity), 0
    );
  }

  increaseQuantity(index: number) {
    // TODO: Implement API call for quantity update
    this.cartProducts[index].quantity++;
  }

  decreaseQuantity(index: number) {
    if (this.cartProducts[index].quantity > 1) {
      // TODO: Implement API call for quantity update
      this.cartProducts[index].quantity--;
    }
  }

  removeItem(index: number) {
    if (!this.cartDetails) return;

    const product = this.cartProducts[index];
    this.cartService.removeCartItem(
      this.cartDetails.cart_id,
      product.product_id,
      this.cartDetails.wholeseller_id
    ).subscribe({
      next: (response) => {
        this.cartProducts = response.products;
        this.cartDetails = response.cart_details;
      },
      error: (error) => {
        console.error('Error removing item:', error);
      }
    });
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
}