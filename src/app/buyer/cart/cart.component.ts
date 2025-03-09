import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { addIcons } from 'ionicons';
import { trashOutline, cartOutline, chevronBack } from 'ionicons/icons';
// import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartForm: FormGroup;
  cartItems = [
    { id: '1', name: 'Spinach', hindiName: 'पालक', image: 'assets/img/Spinach2.png', price: 40, quantity: 1, discount: 5 },
    { id: '2', name: 'Tomato', hindiName: 'टमाटर', image: 'assets/img/Tomato1.png', price: 30, quantity: 2, discount: 3 }
  ];
  discount = 0;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    // private cartService: CartService
  ) {
    addIcons({ trashOutline, cartOutline, chevronBack });

    this.cartForm = this.fb.group({
      discountCode: [''],
      deliveryDate: ['']
    });
  }

  ngOnInit() {
    // Load cart from API if needed
    // this.cartService.getCartItems().subscribe(items => {
    //   this.cartItems = items;
    // });
  }

  goBack() {
    this.router.navigate(['/buyer/buyer-home']);
  }

  getTotalPrice(): number {
    return this.cartItems.reduce((total, item) =>
      total + (item.price - item.discount) * item.quantity, 0
    );
  }

  increaseQuantity(index: number) {
    this.cartItems[index].quantity++;

    // API request to update quantity
    // this.cartService.updateQuantity(this.cartItems[index].id, this.cartItems[index].quantity);
  }

  decreaseQuantity(index: number) {
    if (this.cartItems[index].quantity > 1) {
      this.cartItems[index].quantity--;

      // API request to update quantity
      // this.cartService.updateQuantity(this.cartItems[index].id, this.cartItems[index].quantity);
    }
  }

  removeItem(index: number) {
    this.cartItems.splice(index, 1);

    // API request to remove item
    // this.cartService.removeFromCart(this.cartItems[index].id);
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
        cartItems: this.cartItems,
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
