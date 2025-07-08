import { Component } from '@angular/core';
import { IonicModule, NavController, MenuController, ActionSheetController, LoadingController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  chatbubblesSharp, notificationsCircleSharp, logoAndroid, personCircleSharp, arrowForwardCircleSharp,
  chevronForwardOutline, listCircleOutline, addCircleOutline, timeOutline, statsChartOutline, personOutline,
  trendingUpOutline, reloadOutline, settingsOutline, closeOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { WholesalerApiService } from '../services/wholesaler-api.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HomePage {
  items: any[] = [];
  filteredItems: any[] = [];
  notifications = 5;
  messages = 3;

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
    addIcons({
      chatbubblesSharp, notificationsCircleSharp, logoAndroid, personCircleSharp, arrowForwardCircleSharp,
      chevronForwardOutline, listCircleOutline, addCircleOutline, timeOutline, statsChartOutline, personOutline,
      trendingUpOutline, reloadOutline, settingsOutline, closeOutline
    });
  }

  ngOnInit() {
    this.checkAuthAndLoadData();
  }

  // authentication check
  private checkAuthAndLoadData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    // Check if user has wholesaler role
    const userRole = this.authService.getUserRole();
    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadOrderSummary();
  }

  // use JWT token
  async loadOrderSummary() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Loading inventory...',
      spinner: 'circular',
    });

    try {
      await loading.present();

      // Call service without wholesaler ID - backend will get user_id from JWT
      this.wholesalerService.getOrderSummary().subscribe({
        next: (data) => {
          this.items = data.map(item => ({
            name: item.product_name,
            qty: item.stock_left,
            orders: item.stock_in,
            wholeseller_id: item.wholeseller_id,
            mandi_id: item.mandi_id,
            product_id: item.product_id
          }));
          this.filteredItems = [...this.items];
          loading.dismiss();
        },
        error: async (error) => {
          loading.dismiss();

          // Handle authentication errors
          if (error.status === 401) {
            this.showAuthError();
            return;
          }

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

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: 'Authentication Error',
      message: 'Your session has expired. Please login again.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  // unauthorized error handler
  private async showUnauthorizedError() {
    const alert = await this.alertCtrl.create({
      header: 'Access Denied',
      message: 'You do not have permission to access this page.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.router.navigate(['/login']); // Or appropriate page
          }
        }
      ]
    });
    await alert.present();
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
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        },
      ]
    });
    await actionSheet.present();
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
  }

  openMessages() {
    console.log('Opening messages');
  }

  openTrends() {
    this.router.navigate(['/wholesaler/trends']);
  }
}