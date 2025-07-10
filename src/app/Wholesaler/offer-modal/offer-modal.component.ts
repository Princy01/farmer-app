import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BulkOrder, WholesalerApiService, CreateOfferRequest } from '../services/wholesaler-api.service';
import { AuthService } from 'src/app/auth/auth.service';

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
  proposedDeliveryDate: string = '';
  isSubmitting = false;

  constructor(
    private modalCtrl: ModalController,
    private wholesalerService: WholesalerApiService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    console.log('Modal opened with order:', this.order);
    // Set default delivery date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.proposedDeliveryDate = tomorrow.toISOString().split('T')[0];
  }

  async submitOffer() {
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }

    if (this.offerPrice <= 0) {
      await this.showValidationError('Please enter a valid offer price');
      return;
    }

    if (!this.proposedDeliveryDate) {
      await this.showValidationError('Please select a delivery date');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Submitting offer...',
      spinner: 'circular',
    });

    try {
      await loading.present();
      this.isSubmitting = true;

      const offerData: CreateOfferRequest = {
        order_id: this.order.order_id,
        wholeseller_id: this.authService.getUserId() || 0,
        offered_price: this.offerPrice,
        proposed_delivery_date: this.proposedDeliveryDate,
        message: this.message
      };

      this.wholesalerService.createOffer(offerData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          loading.dismiss();

          this.modalCtrl.dismiss({
            success: true,
            offer_id: response.offer_id,
            offerPrice: this.offerPrice,
            message: this.message
          });
        },
        error: async (error) => {
          this.isSubmitting = false;
          loading.dismiss();

          console.error('Failed to submit offer:', error);

          if (error.status === 401) {
            await this.showAuthError();
            return;
          }

          await this.showErrorAlert('Failed to submit offer. Please try again.');
        }
      });
    } catch (err) {
      this.isSubmitting = false;
      loading.dismiss();
      console.error('Unexpected error:', err);
      await this.showErrorAlert('An unexpected error occurred.');
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
            this.modalCtrl.dismiss();
          }
        }
      ]
    });
    await alert.present();
  }

  private async showValidationError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Validation Error',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  close() {
    this.modalCtrl.dismiss();
  }
}