import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { ModalController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { WholesalerApiService, BulkOrder, TopRetailer } from '../services/wholesaler-api.service';
import { OfferModalComponent } from '../offer-modal/offer-modal.component';
// import { RetailerProductsModalComponent } from '../market-opportunities/retailer-products-modal/retailer-products-modal.component';
import { addIcons } from 'ionicons';
import { add, listOutline } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-market-opportunities',
  templateUrl: './market-opportunities.component.html',
  styleUrls: ['./market-opportunities.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MarketOpportunitiesComponent implements OnInit {
  isLoading = false;
  error: string | null = null;
  bulkOrders: BulkOrder[] = [];
  topRetailers: TopRetailer[] = [];

  private wholesalerId: number | null = null;

  constructor(
    private wholesalerService: WholesalerApiService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private router: Router
  ) {
    addIcons({ listOutline });
  }

  ngOnInit() {
    this.initializeWholesaler();
    this.loadData();
  }

  private initializeWholesaler() {
    const storedWholesalerId = localStorage.getItem('wholesalerId');
    if (storedWholesalerId) {
      this.wholesalerId = Number(storedWholesalerId);
      this.loadData();
    } else {
      // Redirect to login if no wholesaler ID found
      this.showAuthError();
    }
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: 'Authentication Error',
      message: 'Please login again.',
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
    if (!this.wholesalerId) {
      this.showAuthError();
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      // Load bulk orders
      this.wholesalerService.getBulkOrders(this.wholesalerId).subscribe({
        next: (data) => {
          this.bulkOrders = data;
        },
        error: (error) => {
          console.error('Failed to load bulk orders:', error);
          this.error = 'Failed to load bulk orders. Please try again.';
          this.showErrorToast('Failed to load bulk orders');
        }
      });

      // Load top retailers
      this.wholesalerService.getTopRetailers(this.wholesalerId).subscribe({
        next: (data) => {
          this.topRetailers = data;
          console.log('Top retailers:', this.topRetailers);
        },
        error: (error) => {
          console.error('Failed to load top retailers:', error);
          this.error = 'Failed to load top retailers. Please try again.';
          this.showErrorToast('Failed to load top retailers');
        }
      });
    } catch (err) {
      console.error('Failed to load data:', err);
      this.error = 'Failed to load market opportunities. Please try again.';
      this.showErrorToast('Failed to load market opportunities');
    } finally {
      this.isLoading = false;
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
    if (!this.wholesalerId) {
      this.showAuthError();
      return;
    }

    try {
      const modal = await this.modalCtrl.create({
        component: OfferModalComponent,
        componentProps: { order, wholesalerId: this.wholesalerId },
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