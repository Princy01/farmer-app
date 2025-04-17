import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-offer-modal',
  templateUrl: './offer-modal.component.html',
  styleUrls: ['./offer-modal.component.scss'],
  standalone: true,
  imports: [FormsModule, IonicModule]
})
export class OfferModalComponent {
  @Input() order: any;
  offerPrice: number = 0;
message: string = '';


  constructor(private modalCtrl: ModalController) {}

  submitOffer() {
    console.log('Offer submitted:', {
      product: this.order.product,
      to: this.order.retailer,
      price: this.offerPrice,
      message: this.message
    });
    this.modalCtrl.dismiss();
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
