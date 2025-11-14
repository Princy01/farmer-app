import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { ModalController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { WholesalerApiService, BulkOrder, TopRetailer } from '../services/wholesaler-api.service';
import { OfferModalComponent } from '../offer-modal/offer-modal.component';
import { addIcons } from 'ionicons';
import { add, listOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { RetailerProductsModalComponent } from './retailer-products-modal/retailer-products-modal.component';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-market-opportunities',
  templateUrl: './market-opportunities.component.html',
  styleUrls: ['./market-opportunities.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe]
})
export class MarketOpportunitiesComponent implements OnInit {
  isLoading = false;
  error: string | null = null;
  bulkOrders: BulkOrder[] = [];
  // topRetailers: TopRetailer[] = [];

  // Example hardcoded TopRetailer[] data
topRetailers: TopRetailer[] = [
  {
    retailer_id: 1,
    retailer_name: 'FreshMart',
    total_quantity: 1200,
    total_order_value: 250000,
    products: [
      {
        product_id: 101,
        product_name: 'Tomato',
        unit_id: 1,
        quantity: 500,
        order_value: 60000
      },
      {
        product_id: 102,
        product_name: 'Potato',
        unit_id: 1,
        quantity: 700,
        order_value: 80000
      }
    ]
  },
  {
    retailer_id: 2,
    retailer_name: 'GreenGrocers',
    total_quantity: 900,
    total_order_value: 180000,
    products: [
      {
        product_id: 103,
        product_name: 'Onion',
        unit_id: 1,
        quantity: 400,
        order_value: 50000
      },
      {
        product_id: 104,
        product_name: 'Carrot',
        unit_id: 1,
        quantity: 500,
        order_value: 70000
      }
    ]
  }
];
  constructor(
    private wholesalerService: WholesalerApiService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {
    addIcons({ listOutline });
  }

  ngOnInit() {
    this.checkAuthAndLoadData();
  }

  private checkAuthAndLoadData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadData();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('MARKET_OPPORTUNITIES.AUTH_ERROR'),
      message: this.translate.instant('MARKET_OPPORTUNITIES.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('MARKET_OPPORTUNITIES.OK'),
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showUnauthorizedError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('MARKET_OPPORTUNITIES.ACCESS_DENIED'),
      message: this.translate.instant('MARKET_OPPORTUNITIES.NO_PERMISSION'),
      buttons: [
        {
          text: this.translate.instant('MARKET_OPPORTUNITIES.OK'),
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  async loadData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('MARKET_OPPORTUNITIES.LOADING'),
      spinner: 'circular',
    });

    try {
      await loading.present();
      this.isLoading = true;
      this.error = null;

      // Load bulk orders using JWT
      this.wholesalerService.getBulkOrders().subscribe({
        next: (data) => {
          this.bulkOrders = data;
        },
        error: async (error) => {
          console.error('Failed to load bulk orders:', error);

          if (error.status === 401) {
            await this.showAuthError();
            return;
          }

          this.error = this.translate.instant('MARKET_OPPORTUNITIES.LOAD_BULK_ORDERS_ERROR');
          this.showErrorToast(this.translate.instant('MARKET_OPPORTUNITIES.LOAD_BULK_ORDERS_ERROR'));
        }
      });

      // Load top retailers using JWT
      this.wholesalerService.getTopRetailers().subscribe({
        next: (data) => {
          // this.topRetailers = data;
          console.log('Top retailers:', this.topRetailers);
          this.isLoading = false;
          loading.dismiss();
        },
        error: async (error) => {
          console.error('Failed to load top retailers:', error);
          this.isLoading = false;
          loading.dismiss();

          if (error.status === 401) {
            await this.showAuthError();
            return;
          }

          this.error = this.translate.instant('MARKET_OPPORTUNITIES.LOAD_TOP_RETAILERS_ERROR');
          this.showErrorToast(this.translate.instant('MARKET_OPPORTUNITIES.LOAD_TOP_RETAILERS_ERROR'));
        }
      });
    } catch (err) {
      this.isLoading = false;
      loading.dismiss();
      console.error('Failed to load data:', err);
      this.error = this.translate.instant('MARKET_OPPORTUNITIES.LOAD_ERROR');
      this.showErrorToast(this.translate.instant('MARKET_OPPORTUNITIES.LOAD_ERROR'));
    }
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }

  async openOfferModal(order: BulkOrder) {
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }

    try {
      const modal = await this.modalCtrl.create({
        component: OfferModalComponent,
        componentProps: { order },
        breakpoints: [0, 0.5, 0.8],
        initialBreakpoint: 0.8
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      console.log('Modal dismissed with data:', data);

      if (data?.success) {
        const toast = await this.toastCtrl.create({
          message: `${this.translate.instant('MARKET_OPPORTUNITIES.OFFER_SUBMITTED')} #${data.offer_id}`,
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error presenting modal:', error);
      this.showErrorToast(this.translate.instant('MARKET_OPPORTUNITIES.OFFER_ERROR'));
    }
  }

  getTopRetailersTitle(): string {
    return this.translate.instant('MARKET_OPPORTUNITIES.TOP_RETAILERS_TITLE');
  }

  async handleRefresh(event: any) {
    try {
      await this.loadData();
    } finally {
      event.target.complete();
    }
  }

  async openRetailerProductsModal(retailer: TopRetailer) {
    console.log('Opening products modal for retailer:', retailer);
    const modal = await this.modalCtrl.create({
      component: RetailerProductsModalComponent,
      componentProps: { retailer },
      breakpoints: [0, 0.5, 0.8],
      initialBreakpoint: 0.8
    });
    await modal.present();
  }
console=console
  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }
}