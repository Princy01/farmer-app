import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { addIcons } from 'ionicons';
import { trashOutline, cartOutline, chevronBack } from 'ionicons/icons';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent {
  cartForm: FormGroup;

  cartItems = [
    { name: 'Spinach', hindiName: 'पालक', image: 'assets/img/Spinach2.png', price: 40, quantity: 1, discount: 5 },
    { name: 'Tomato', hindiName: 'टमाटर', image: 'assets/img/Tomato1.png', price: 30, quantity: 2, discount: 3 },
  ];

  discount = 0; // Total discount applied using code

  constructor(private router: Router, private fb: FormBuilder) {
    addIcons({ trashOutline, cartOutline, chevronBack });

    this.cartForm = this.fb.group({
      discountCode: [''],
      deliveryDate: ['']

    });
  }

  goBack() {
    this.router.navigate(['/buyer/buyer-home']);
  }
  // Get Total Price After Applying Discounts
  getTotalPrice() {
    return this.cartItems.reduce((total, item) =>
      total + (item.price - item.discount) * item.quantity, 0
    );
  }

  // Increase Quantity (Each Click Adds 100g)
  increaseQuantity(index: number) {
    this.cartItems[index].quantity++;
  }

  // Decrease Quantity (Minimum 100g)
  decreaseQuantity(index: number) {
    if (this.cartItems[index].quantity > 1) {
      this.cartItems[index].quantity--;
    }
  }

  // Remove Item from Cart
  removeItem(index: number) {
    this.cartItems.splice(index, 1);
  }

  // Apply Discount Code
  applyDiscount() {
    const validCodes: { [key: string]: number } = {
      'SAVE10': 10,  // 10% off total
      'FRESH20': 20  // 20% off total
    };

    const code = this.cartForm.get('discountCode')?.value;
    this.discount = validCodes[code] ? (this.getTotalPrice() * validCodes[code]) / 100 : 0;
  }

  // Checkout and Pass Data
  checkout() {
    this.router.navigate(['/buyer/checkout'], {
      state: {
        cartItems: this.cartItems,
        totalPrice: this.getTotalPrice() - this.discount,
        deliveryDate: this.cartForm.get('deliveryDate')?.value
      }
    });
  }
}
