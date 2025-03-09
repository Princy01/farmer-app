import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBack, cart, closeOutline } from 'ionicons/icons';
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
    addIcons({ chevronBack, cart, closeOutline });

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
          name: 'Tomatoes',
          hindiName: 'टमाटर',
          price: 50,
          image: 'assets/img/Tomato1.png',
        },
        {
          id: 2,
          name: 'Potatoes',
          hindiName: 'आलू',
          price: 40,
          image: 'assets/img/Potato1.png',
        },
        {
          id: 3,
          name: 'Onion',
          hindiName: 'प्याज',
          price: 70,
          image: 'assets/img/Onion1.png',
        },
      ];
    }
  }
  goBack() {
    this.router.navigate(['/buyer/buyer-home']);
  }

  async addToCart(item: any) {
    this.cartItems.push(item);
    this.wishlistItems = this.wishlistItems.filter((w) => w !== item);

    const toast = await this.toastController.create({
      message: `${item.name} added to cart`,
      duration: 2000,
      color: 'success',
    });
    toast.present();
  }

  async removeFromWishlist(item: any) {
    this.wishlistItems = this.wishlistItems.filter((w) => w !== item);

    const toast = await this.toastController.create({
      message: `${item.name} removed from wishlist`,
      duration: 2000,
      color: 'danger',
    });
    toast.present();
  }

  goToCart() {
    this.router.navigate(['/cart'], { state: { cartItems: this.cartItems } });
  }
}
