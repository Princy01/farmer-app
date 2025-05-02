import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BulkOrder } from '../services/wholesaler-api.service';

@Component({
  selector: 'app-offer-modal',
  templateUrl: './offer-modal.component.html',
  styleUrls: ['./offer-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class OfferModalComponent implements OnInit {
  @Input() order!: BulkOrder;
  offerPrice: number = 0;
  message: string = '';

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    console.log('Modal opened with order:', this.order);
  }

  submitOffer() {
    if (this.offerPrice <= 0) {
      console.log('Invalid offer price');
      return;
    }

    console.log('Submitting offer:', {
      orderId: this.order.order_id,
      price: this.offerPrice,
      message: this.message
    });

    this.modalCtrl.dismiss({
      success: true,
      offer_id: Math.floor(Math.random() * 1000), // Temporary ID generation
      offerPrice: this.offerPrice,
      message: this.message
    });
  }

  close() {
    this.modalCtrl.dismiss();
  }
}