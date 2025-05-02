import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TopRetailer } from '../../services/wholesaler-api.service';

@Component({
  selector: 'app-retailer-products-modal',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ retailer.retailer_name }}'s Products</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-item *ngFor="let product of retailer.products">
          <!-- <ion-thumbnail slot="start">
            <img [src]="'assets/products/' + product.product_id + '.jpg'"
                 [alt]="product.product_name"
                 onError="this.src='assets/default-product.jpg'">
          </ion-thumbnail> -->
          <ion-label>
            <h2>{{ product.product_name }}</h2>
            <p>Quantity: {{ product.quantity | number:'1.0-2' }} kg</p>
            <p>Value: ₹{{ product.order_value | number:'1.2-2' }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `
})
export class RetailerProductsModalComponent implements OnInit {
  @Input() retailer!: TopRetailer;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    console.log('Retailer data:', this.retailer);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}