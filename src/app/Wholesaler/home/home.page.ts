import { Component } from '@angular/core';
import { IonicModule, NavController, MenuController, ActionSheetController, LoadingController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  chatbubblesSharp, notificationsCircleSharp, logoAndroid, personCircleSharp, arrowForwardCircleSharp,
  chevronForwardOutline, listCircleOutline, addCircleOutline, timeOutline, statsChartOutline, personOutline,
  trendingUpOutline, reloadOutline, settingsOutline, closeOutline, locationOutline
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
  private allDummyData: any[] = []; // Store all dummy data
  private currentPage = 0;
  private itemsPerPage = 5; // Show 5 items per page
  isInfiniteScrollEnabled = true;

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
      trendingUpOutline, reloadOutline, settingsOutline, closeOutline, locationOutline
    });
  }

  ngOnInit() {
    this.setItemsPerPage();
    this.checkAuthAndLoadData();
  }

  private setItemsPerPage() {
    if (window.innerWidth >= 768) {
      this.itemsPerPage = 8; // Load more items on desktop
    } else {
      this.itemsPerPage = 5; // Keep 5 for mobile
    }
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

  //THIS FUNCTION IS BEING USED FOR NOW AS WE ARE USING DUMMY DATA, OTHERWISE THE LOAD ORDER SUMMARY FUNCTION WRITTEN NEXT WILL BE USED IN REAL APPLICATION
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
          if (data && data.length > 0) {
            // Use real data if available
            this.allDummyData = data.map(item => ({
              name: item.product_name,
              qty: item.stock_left,
              orders: item.stock_in,
              wholeseller_id: item.wholeseller_id,
              mandi_id: item.mandi_id,
              product_id: item.product_id
            }));
          } else {
            // Use dummy data if no real data
            this.allDummyData = this.getDummyData();
          }

          // Reset pagination and load initial items
          this.currentPage = 0;
          this.items = [];
          this.loadMoreItems();
          loading.dismiss();
        },
        error: async (error) => {
          loading.dismiss();

          // Handle authentication errors
          if (error.status === 401) {
            this.showAuthError();
            return;
          }

          // Show dummy data on error as fallback
          this.allDummyData = this.getDummyData();
          this.currentPage = 0;
          this.items = [];
          this.loadMoreItems();

          const alert = await this.alertCtrl.create({
            header: 'Notice',
            message: 'Unable to connect to server. Showing sample data.',
            buttons: ['OK']
          });
          await alert.present();
        }
      });
    } catch (err) {
      loading.dismiss();

      // Show dummy data on exception
      this.allDummyData = this.getDummyData();
      this.currentPage = 0;
      this.items = [];
      this.loadMoreItems();

      const alert = await this.alertCtrl.create({
        header: 'Notice',
        message: 'Showing sample data for demonstration.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  private getDummyData() {
    return [
      {
        name: 'Tomatoes',
        qty: 150,
        orders: 75,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 1
      },
      {
        name: 'Onions',
        qty: 200,
        orders: 120,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 2
      },
      {
        name: 'Potatoes',
        qty: 300,
        orders: 180,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 3
      },
      {
        name: 'Carrots',
        qty: 100,
        orders: 60,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 4
      },
      {
        name: 'Cabbage',
        qty: 80,
        orders: 45,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 5
      },
      {
        name: 'Cauliflower',
        qty: 120,
        orders: 70,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 6
      },
      {
        name: 'Green Beans',
        qty: 90,
        orders: 50,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 7
      },
      {
        name: 'Bell Peppers',
        qty: 60,
        orders: 35,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 8
      },
      {
        name: 'Spinach',
        qty: 75,
        orders: 40,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 9
      },
      {
        name: 'Broccoli',
        qty: 85,
        orders: 55,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 10
      },
      {
        name: 'Lettuce',
        qty: 65,
        orders: 30,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 11
      },
      {
        name: 'Cucumber',
        qty: 110,
        orders: 85,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 12
      },
      {
        name: 'Radish',
        qty: 45,
        orders: 25,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 13
      },
      {
        name: 'Sweet Corn',
        qty: 95,
        orders: 60,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 14
      },
      {
        name: 'Peas',
        qty: 70,
        orders: 45,
        wholeseller_id: 1,
        mandi_id: 1,
        product_id: 15
      }
    ];
  }

  // THIS FUNCTION IS THE ACTUAL ONE FOR BACKEND
  // use JWT token
  // async loadOrderSummary() {
  //   if (!this.authService.isAuthenticated()) {
  //     this.showAuthError();
  //     return;
  //   }

  //   const loading = await this.loadingCtrl.create({
  //     message: 'Loading order summary...',
  //     spinner: 'circular',
  //   });

  //   try {
  //     await loading.present();

  //     // Call service without wholesaler ID - backend will get user_id from JWT
  //     this.wholesalerService.getOrderSummary().subscribe({
  //       next: (data) => {
  //         // Store all data for infinite scroll
  //         this.allDummyData = data.map(item => ({
  //           name: item.product_name,
  //           qty: item.stock_left,
  //           orders: item.stock_in,
  //           wholeseller_id: item.wholeseller_id,
  //           mandi_id: item.mandi_id,
  //           product_id: item.product_id
  //         }));

  //         // Reset pagination and load initial items
  //         this.currentPage = 0;
  //         this.items = [];
  //         this.loadMoreItems();
  //         loading.dismiss();
  //       },
  //       error: async (error) => {
  //         loading.dismiss();

  //         // Handle authentication errors
  //         if (error.status === 401) {
  //           this.showAuthError();
  //           return;
  //         }

  //         const alert = await this.alertCtrl.create({
  //           header: 'Error',
  //           message: 'Failed to load inventory. Please try again later.',
  //           buttons: [
  //             {
  //               text: 'Dismiss',
  //               role: 'cancel'
  //             },
  //             {
  //               text: 'Retry',
  //               handler: () => {
  //                 this.loadOrderSummary();
  //               }
  //             }
  //           ]
  //         });
  //         await alert.present();
  //       }
  //     });
  //   } catch (err) {
  //     loading.dismiss();
  //     const alert = await this.alertCtrl.create({
  //       header: 'Error',
  //       message: 'An unexpected error occurred.',
  //       buttons: ['OK']
  //     });
  //     await alert.present();
  //   }
  // }

  // Load more items for infinite scroll
  loadMoreItems() {
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const newItems = this.allDummyData.slice(startIndex, endIndex);

    if (newItems.length > 0) {
      this.items = [...this.items, ...newItems];
      this.filteredItems = [...this.items];
      this.currentPage++;
    }

    // Disable infinite scroll if no more items
    this.isInfiniteScrollEnabled = endIndex < this.allDummyData.length;
  }

  // Handle infinite scroll event
  onInfiniteScroll(event: any) {
    setTimeout(() => {
      this.loadMoreItems();
      event.target.complete();

      // Disable the infinite scroll if no more data
      if (!this.isInfiniteScrollEnabled) {
        event.target.disabled = true;
      }
    }, 500); // Add slight delay to show loading
  }

  async handleRefresh(event: any) {
    try {
      // Reset pagination
      this.currentPage = 0;
      this.items = [];
      this.isInfiniteScrollEnabled = true;

      await this.loadOrderSummary();

      // Re-enable infinite scroll
      const infiniteScroll = event.target.parentElement?.querySelector('ion-infinite-scroll');
      if (infiniteScroll) {
        infiniteScroll.disabled = false;
      }
    } finally {
      event.target.complete();
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
          text: 'Business Locations',
          icon: 'location-outline',
          cssClass: 'custom-action-sheet-btn',
          handler: () => {
            this.router.navigate(['/wholesaler/business-locations']);
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

    if (searchTerm.trim() === '') {
      // If search is empty, show current loaded items
      this.filteredItems = [...this.items];
    } else {
      // Search in all available data, not just loaded items
      this.filteredItems = this.allDummyData.filter(item =>
        item.name.toLowerCase().includes(searchTerm)
      );
    }
  }

  async toggleMenu() {
    await this.menuCtrl.toggle();
  }

  viewDetails(item: any) {
    // Navigate to product details page with product data
    this.router.navigate(['/wholesaler/product-details'], {
      queryParams: {
        productId: item.product_id,
        wholesellerId: item.wholeseller_id,
        mandiId: item.mandi_id
      },
      state: {
        productData: item
      }
    });
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