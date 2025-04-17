import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { InsightsService } from '../services/insights.service';
import { OfferModalComponent } from '../offer-modal/offer-modal.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-market-opportunities',
  templateUrl: './market-opportunities.component.html',
  styleUrls: ['./market-opportunities.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule ]
})
export class MarketOpportunitiesComponent {
  isPremium: boolean;
  bulkOrders: any[] = [];
  topRetailers: any[] = [];

  constructor(
    private insightsService: InsightsService,
    private modalCtrl: ModalController
  ) {
    this.isPremium = this.insightsService.isPremium();
    this.bulkOrders = this.insightsService.getBulkOrders();
    this.topRetailers = this.insightsService.getTopRetailers();
  }

  async openOfferModal(order: any) {
    const modal = await this.modalCtrl.create({
      component: OfferModalComponent,
      componentProps: { order }
    });
    await modal.present();
  }
}
