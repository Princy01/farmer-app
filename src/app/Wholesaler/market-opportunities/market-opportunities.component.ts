import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ModalController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { WholesalerApiService, BulkOrder, TopRetailer } from '../services/wholesaler-api.service';
import { OfferModalComponent } from '../offer-modal/offer-modal.component';
// import { RetailerProductsModalComponent } from '../market-opportunities/retailer-products-modal/retailer-products-modal.component';
import { addIcons } from 'ionicons';
import { add, listOutline } from 'ionicons/icons';
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

  constructor(
    private wholesalerService: WholesalerApiService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {
    addIcons({listOutline});
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = null;

    try {
      // Load bulk orders
      this.wholesalerService.getBulkOrders().subscribe({
        next: (data) => {
          this.bulkOrders = data;
        },
        error: (error) => {
          console.error('Failed to load bulk orders:', error);
          this.error = 'Failed to load bulk orders. Please try again.';
        }
      });

      // Load top retailers
      this.wholesalerService.getTopRetailers().subscribe({
        next: (data) => {
          this.topRetailers = data;
          console.log('Top retailers:', this.topRetailers);
        },
        error: (error) => {
          console.error('Failed to load top retailers:', error);
          this.error = 'Failed to load top retailers. Please try again.';
        }
      });
    } catch (err) {
      console.error('Failed to load data:', err);
      this.error = 'Failed to load market opportunities. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async openOfferModal(order: BulkOrder) {
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
          message: `Offer #${data.offer_id} submitted successfully!`,
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error presenting modal:', error);
    }
  }

  getTopRetailersTitle(): string {
    return 'Top 5 Retailers by Order Volume';
  }

}