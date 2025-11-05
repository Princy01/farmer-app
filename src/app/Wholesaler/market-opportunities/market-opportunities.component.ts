import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { ModalController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { WholesalerApiService, BulkOrder, TopRetailer } from '../services/wholesaler-api.service';
import { OfferModalComponent } from '../offer-modal/offer-modal.component';
import { addIcons } from 'ionicons';
import { add, listOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe } from '@ngx-translate/core';

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
  topRetailers: TopRetailer[] = [];

  constructor(
    private wholesalerService: WholesalerApiService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ listOutline });
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
    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadData();
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
      message: 'Loading market opportunities...',
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

          this.error = 'Failed to load bulk orders. Please try again.';
          this.showErrorToast('Failed to load bulk orders');
        }
      });

      // Load top retailers using JWT
      this.wholesalerService.getTopRetailers().subscribe({
        next: (data) => {
          this.topRetailers = data;
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

          this.error = 'Failed to load top retailers. Please try again.';
          this.showErrorToast('Failed to load top retailers');
        }
      });
    } catch (err) {
      this.isLoading = false;
      loading.dismiss();
      console.error('Failed to load data:', err);
      this.error = 'Failed to load market opportunities. Please try again.';
      this.showErrorToast('Failed to load market opportunities');
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
        componentProps: { order }, // Removed wholesalerId as it will use JWT
        breakpoints: [0, 0.5, 0.8],
        initialBreakpoint: 0.8
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      console.log('Modal dismissed with data:', data);

      if (data?.success) {
        const toast = await this.toastCtrl.create({
          message: `Offer #${data.offer_id} submitted successfully!`,
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error presenting modal:', error);
      this.showErrorToast('Error opening offer modal');
    }
  }

  getTopRetailersTitle(): string {
    return 'Top 5 Retailers by Order Volume';
  }

  async handleRefresh(event: any) {
    try {
      await this.loadData();
    } finally {
      event.target.complete();
    }
  }

  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }
}