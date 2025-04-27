import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { addIcons } from 'ionicons';
import { trashOutline, cartOutline, chevronBack,removeOutline, addOutline } from 'ionicons/icons';
import { CartService } from './cart.service';

interface DummyProduct {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_id: number;
  unit_name: string;
  price_while_added: number;
  latest_wholesaler_price: number;
  is_active: boolean;
}

interface DummyCartDetails {
  cart_id: number;
  retailer_id: number;
  retailer_name: string;
  wholeseller_id: number;
  wholeseller_name: string;
  cart_status: number;
}
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartForm: FormGroup;
  cartDetails: any;
  cartProducts: any[] = [];
  discount = 0;

  useRealData: boolean = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cartService: CartService
  ) {
    addIcons({ trashOutline, cartOutline, chevronBack, removeOutline, addOutline });

    this.cartForm = this.fb.group({
      discountCode: [''],
      deliveryDate: ['']
    });
  }

  private getDummyData() {
    const dummyCartDetails: DummyCartDetails = {
      cart_id: 1001,
      retailer_id: 2001,
      retailer_name: "Sample Retail Store",
      wholeseller_id: 3001,
      wholeseller_name: "Fresh Produce Wholesale",
      cart_status: 1
    };

    const dummyProducts: DummyProduct[] = [
      {
        product_id: 1,
        product_name: "Tomatoes",
        quantity: 5,
        unit_id: 1,
        unit_name: "kg",
        price_while_added: 40,
        latest_wholesaler_price: 45,
        is_active: true
      },
      {
        product_id: 2,
        product_name: "Potatoes",
        quantity: 10,
        unit_id: 1,
        unit_name: "kg",
        price_while_added: 25,
        latest_wholesaler_price: 25,
        is_active: true
      },
      {
        product_id: 3,
        product_name: "Onions",
        quantity: 8,
        unit_id: 1,
        unit_name: "kg",
        price_while_added: 30,
        latest_wholesaler_price: 28,
        is_active: true
      }
    ];

    return { cart_details: dummyCartDetails, products: dummyProducts };
  }

  ngOnInit() {
    if (this.useRealData) {
      const cartId = localStorage.getItem('cartId');
      if (cartId) {
        this.loadCart(Number(cartId));
      } else {
        console.warn('No cart ID found in localStorage');
        // Maybe redirect to home or show empty cart message
      }
    } else {
      // When using dummy data, just load it directly
      this.loadCart();
    }
  }

  goBack() {
    this.router.navigate(['/buyer/buyer-home']);
  }

  loadCart(cartId?: number) {
    if (this.useRealData && cartId) {
      this.cartService.getCart(cartId).subscribe({
        next: (response) => {
          this.cartDetails = response.cart_details;
          this.cartProducts = response.products;
        },
        error: (error) => {
          console.error('Error loading cart:', error);
          // Fallback to dummy data on error
          const dummyData = this.getDummyData();
          this.cartDetails = dummyData.cart_details;
          this.cartProducts = dummyData.products;
        }
      });
    } else {
      // Load dummy data without requiring cartId
      const dummyData = this.getDummyData();
      this.cartDetails = dummyData.cart_details;
      this.cartProducts = dummyData.products;
    }
  }

  getTotalPrice(): number {
    return this.cartProducts.reduce((total, item) =>
      total + (item.latest_wholesaler_price * item.quantity), 0
    );
  }

  increaseQuantity(index: number) {
    this.cartProducts[index].quantity++;
    if (this.useRealData) {
      // Here you would make the API call when implemented
      console.log('Quantity updated (simulated API call)');
    }
  }

  decreaseQuantity(index: number) {
    if (this.cartProducts[index].quantity > 1) {
      this.cartProducts[index].quantity--;
      if (this.useRealData) {
        // Here you would make the API call when implemented
        console.log('Quantity updated (simulated API call)');
      }
    }
  }

  removeItem(index: number) {
    const product = this.cartProducts[index];
    if (this.useRealData) {
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
    } else {
      // Handle dummy data removal
      this.cartProducts.splice(index, 1);
    }
  }

  applyDiscount() {
    const code = this.cartForm.get('discountCode')?.value;
    const validCodes: { [key: string]: number } = {
      'SAVE10': 10,
      'FRESH20': 20
    };

    this.discount = validCodes[code] ? (this.getTotalPrice() * validCodes[code]) / 100 : 0;

    // API request for discount (if using backend)
    // this.cartService.applyDiscount(code).subscribe(discountAmount => {
    //   this.discount = discountAmount;
    // });
  }

  checkout() {
    this.router.navigate(['/buyer/checkout'], {
      state: {
        cartItems: this.cartProducts,
        totalPrice: this.getTotalPrice() - this.discount,
        deliveryDate: this.cartForm.get('deliveryDate')?.value
      }
    });

    // API request to initiate checkout
    // this.cartService.checkout({ cartItems: this.cartItems, totalPrice: this.getTotalPrice(), deliveryDate: this.cartForm.get('deliveryDate')?.value })
    //   .subscribe(response => {
    //     console.log("Order placed successfully", response);
    //   });
  }


}
