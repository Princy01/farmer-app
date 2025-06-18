// filepath: c:\Users\princ\IONIC_PROJECTS\farmer-app-standalone-master\src\app\buyer\wishlist\wishlist.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  cart,
  close,
  heart,
  heartOutline,
  trashOutline,
  eyeOutline,
  cartOutline,
  storefrontOutline,
  arrowForward
} from 'ionicons/icons';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss'],
})
export class WishlistComponent {
  wishlistItems: any[] = [];
  cartItems: any[] = [];

  constructor(private router: Router, private toastController: ToastController) {
    addIcons({
      chevronBack,
      cart,
      close,
      heart,
      heartOutline,
      trashOutline,
      eyeOutline,
      cartOutline,
      storefrontOutline,
      arrowForward
    });

    const navData = this.router.getCurrentNavigation()?.extras.state;
    if (navData) {
      this.wishlistItems = navData['wishlistItems'] || [];
      this.cartItems = navData['cartItems'] || [];
    }

    // Add sample products if wishlist is empty
    if (this.wishlistItems.length === 0) {
      this.wishlistItems = [
        {
          id: 1,
          name: 'Fresh Tomatoes',
          hindiName: 'टमाटर',
          price: 50,
          image: 'assets/img/Tomato1.png',
        },
        {
          id: 2,
          name: 'Organic Potatoes',
          hindiName: 'आलू',
          price: 40,
          image: 'assets/img/Potato1.png',
        },
        {
          id: 3,
          name: 'Red Onions',
          hindiName: 'प्याज',
          price: 70,
          image: 'assets/img/Onion1.png',
        },
        {
          id: 4,
          name: 'Green Capsicum',
          hindiName: 'शिमला मिर्च',
          price: 80,
          image: 'assets/img/Capsicum1.png',
        },
      ];
    }
  }

  goBack() {
    this.router.navigate(['/buyer/buyer-home']);
  }

  async addToCart(item: any) {
    // Check if item already exists in cart
    const existingItem = this.cartItems.find(cartItem => cartItem.id === item.id);

    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      this.cartItems.push({ ...item, quantity: 1 });
    }

    // Remove from wishlist
    this.wishlistItems = this.wishlistItems.filter((w) => w.id !== item.id);

    const toast = await this.toastController.create({
      message: `${item.name} added to cart!`,
      duration: 2000,
      color: 'success',
      position: 'bottom',
      buttons: [
        {
          text: 'View Cart',
          handler: () => {
            this.goToCart();
          }
        }
      ]
    });
    toast.present();
  }

  async addAllToCart() {
    let addedCount = 0;

    this.wishlistItems.forEach(item => {
      const existingItem = this.cartItems.find(cartItem => cartItem.id === item.id);

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        this.cartItems.push({ ...item, quantity: 1 });
      }
      addedCount++;
    });

    this.wishlistItems = [];

    const toast = await this.toastController.create({
      message: `${addedCount} items added to cart!`,
      duration: 2000,
      color: 'success',
      position: 'bottom',
      buttons: [
        {
          text: 'View Cart',
          handler: () => {
            this.goToCart();
          }
        }
      ]
    });
    toast.present();
  }

  async removeFromWishlist(item: any) {
    this.wishlistItems = this.wishlistItems.filter((w) => w.id !== item.id);

    const toast = await this.toastController.create({
      message: `${item.name} removed from wishlist`,
      duration: 2000,
      color: 'warning',
      position: 'bottom',
    });
    toast.present();
  }

  async clearWishlist() {
    if (this.wishlistItems.length === 0) return;

    const toast = await this.toastController.create({
      message: 'Clear entire wishlist?',
      duration: 4000,
      color: 'danger',
      position: 'bottom',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Clear All',
          handler: () => {
            this.wishlistItems = [];
            this.showClearedToast();
          }
        }
      ]
    });
    toast.present();
  }

  async showClearedToast() {
    const toast = await this.toastController.create({
      message: 'Wishlist cleared!',
      duration: 2000,
      color: 'success',
      position: 'bottom',
    });
    toast.present();
  }

  quickView(item: any) {
    // Implement quick view functionality
    console.log('Quick view for:', item);
    // You can navigate to product details or show a modal
  }

  browseProducts() {
    this.router.navigate(['/buyer/category']);
  }

  goToCart() {
    this.router.navigate(['/cart'], { state: { cartItems: this.cartItems } });
  }

  getTotalValue(): number {
    return this.wishlistItems.reduce((total, item) => total + item.price, 0);
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  }

  onImageError(event: any) {
  // Fallback to a default image or show placeholder
  event.target.src = 'assets/img/placeholder.png'; // Add a placeholder image
  event.target.style.backgroundColor = '#f8f9fa';
  event.target.style.border = '2px dashed #dee2e6';
}

onImageLoad(event: any) {
  // Image loaded successfully, you can add any success handling here
  event.target.style.opacity = '1';
}
}