import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ModalController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { WholesalerApiService, BulkOrder, TopRetailer } from '../services/wholesaler-api.service';
import { OfferModalComponent } from '../offer-modal/offer-modal.component';

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
  ) { }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = null;

    try {
      // Use firstValueFrom instead of deprecated toPromise
      const orders = await this.wholesalerService.getBulkOrders().subscribe({
        next: (data) => {
          this.bulkOrders = data;
        },
        error: (error) => {
          console.error('Failed to load bulk orders:', error);
          this.error = 'Failed to load market opportunities. Please try again.';
        }
      });

      const retailers = await this.wholesalerService.getTopRetailers().subscribe({
        next: (data) => {
          this.topRetailers = data;
        },
        error: (error) => {
          console.error('Failed to load top retailers:', error);
          this.error = 'Failed to load market opportunities. Please try again.';
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
    const modal = await this.modalCtrl.create({
      component: OfferModalComponent,
      componentProps: { order }
    });

    const { data } = await modal.onWillDismiss();

    if (data?.success) {
      const toast = await this.toastCtrl.create({
        message: `Offer #${data.offer_id} submitted successfully!`,
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    }
  }

  getTopRetailersTitle(): string {
    return `Top ${this.topRetailers.length} Retailers`;
  }
}