import { Component } from '@angular/core';
import { IonicModule, NavController, MenuController, ActionSheetController, LoadingController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {addIcons} from 'ionicons';
import { chatbubblesSharp, notificationsCircleSharp,logoAndroid, personCircleSharp, arrowForwardCircleSharp,
   chevronForwardOutline, listCircleOutline, addCircleOutline, timeOutline, statsChartOutline,personOutline,
   trendingUpOutline, reloadOutline, settingsOutline, closeOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { WholesalerApiService } from '../services/wholesaler-api.service';
import { AuthService } from '@/auth/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HomePage {
  // items = [
  //   { name: 'Potato1', qty: 5000, orders: 200 },
  //   { name: 'Potato2', qty: 500, orders: 200 },
  //   { name: 'Tomato1', qty: 1000, orders: 150 },
  //   { name: 'Tomato2', qty: 2000, orders: 500 },
  // ];

  items: any[] = [];
  filteredItems: any[] = [];  // Add this for search functionality

  notifications = 5;  // Example notification count
  messages = 3;       // Example message count

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private menuCtrl: MenuController,
    private actionSheetController: ActionSheetController,
    private wholesalerService: WholesalerApiService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private authService: AuthService
  ) {

    addIcons({chatbubblesSharp, notificationsCircleSharp, logoAndroid, personCircleSharp, arrowForwardCircleSharp,
       chevronForwardOutline, listCircleOutline, addCircleOutline, timeOutline, statsChartOutline,personOutline,
       trendingUpOutline, reloadOutline, settingsOutline, closeOutline});
}

async loadOrderSummary() {
  const loading = await this.loadingCtrl.create({
    message: 'Loading inventory...',
    spinner: 'circular',
  });

  try {
    await loading.present();

    this.wholesalerService.getOrderSummary().subscribe({
      next: (data) => {
        this.items = data.map(item => ({
          name: item.product_name,
          qty: item.stock_left,
          orders: item.stock_in
        }));
        this.filteredItems = [...this.items];
        loading.dismiss();
      },
      error: async (error) => {
        loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'Failed to load inventory. Please try again later.',
          buttons: [
            {
              text: 'Dismiss',
              role: 'cancel'
            },
            {
              text: 'Retry',
              handler: () => {
                this.loadOrderSummary();
              }
            }
          ]
        });
        await alert.present();
      }
    });
  } catch (err) {
    loading.dismiss();
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: 'An unexpected error occurred.',
      buttons: ['OK']
    });
    await alert.present();
  }
}
async handleRefresh(event: any) {
  try {
    await this.loadOrderSummary();
  } finally {
    event.target.complete();
  }
}

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Account Options',
      buttons: [
        {
          text: 'Profile',
          icon: 'person-outline',
          cssClass: 'custom-action-sheet-btn',
          handler: () => {
            this.router.navigate(['/wholesaler/profile']);
          }
        },
        {
          text: 'Market Opportunities',
          icon: 'trending-up-outline',
          cssClass: 'custom-action-sheet-btn',
          handler: () => {
            this.router.navigate(['/wholesaler/market-opportunities']);
          }
        },
        {
          text: 'Restocking Recommendations',
          icon: 'reload-outline',
          cssClass: 'custom-action-sheet-btn',
          handler: () => {
            this.router.navigate(['/wholesaler/restocking-recommendations']);
          }
        },
        {
          text: 'Settings',
          icon: 'settings-outline',
          cssClass: 'custom-action-sheet-btn',
          handler: () => {
            this.router.navigate(['/wholesaler/settings']);
          }
        },
        {
          text: 'Logout',
          icon: 'close-outline',
          cssClass: 'custom-action-sheet-btn',
          handler: () => {
            this.authService.logout(); // <-- Call logout logic
            this.router.navigate(['/login']);
          }
        },
      ]
    });
    await actionSheet.present();
  }

  ngOnInit() {
    this.loadOrderSummary();
  }

  createOrder() {
    this.router.navigate(['/wholesaler/for-sale']);
  }

  viewMyOrders() {
    this.router.navigate(['/wholesaler/orders']);
  }

  viewPastOrders() {
    this.router.navigate(['/wholesaler/past-orders']);
  }

  searchItems(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredItems = this.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm)
    );
  }

  async toggleMenu() {
    await this.menuCtrl.toggle();
  }

  viewDetails(item: any) {
    console.log('Item details:', item);
  }

  loadMore() {
    console.log('Load more items');
  }

  openProfile() {
    this.navCtrl.navigateForward('/profile');
  }

  openNotifications() {
    console.log('Opening notifications');
    // Add logic to navigate to notifications page if needed
  }

  openMessages() {
    console.log('Opening messages');
    // Add logic to navigate to messages page if needed
  }

  openTrends() {
    this.router.navigate(['/wholesaler/trends']);
}
}