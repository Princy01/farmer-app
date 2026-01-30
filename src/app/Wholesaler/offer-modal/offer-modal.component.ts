import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BulkOrder, WholesalerApiService, CreateOfferRequest } from '../services/wholesaler-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offer-modal',
  templateUrl: './offer-modal.component.html',
  styleUrls: ['./offer-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe]
})
export class OfferModalComponent implements OnInit, OnDestroy {
  @Input() order!: BulkOrder;
  offerPrice: number = 0;
  message: string = '';
  proposedDeliveryDate: string = '';
  isSubmitting = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private modalCtrl: ModalController,
    private wholesalerService: WholesalerApiService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    // Validate required input
    if (!this.order) {
      this.close();
      return;
    }

    // Set default delivery date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.proposedDeliveryDate = tomorrow.toISOString().split('T')[0];
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async submitOffer() {
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }

    if (this.offerPrice <= 0) {
      await this.showValidationError(this.translate.instant('MAKE_OFFER.INVALID_PRICE'));
      return;
    }

    if (!this.proposedDeliveryDate) {
      await this.showValidationError(this.translate.instant('MAKE_OFFER.INVALID_DATE'));
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('MAKE_OFFER.SUBMITTING'),
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

      const offerSubscription = this.wholesalerService.createOffer(offerData).subscribe({
        next: async (response) => {
          this.isSubmitting = false;
          await this.dismissLoading(loading);

          this.modalCtrl.dismiss({
            success: true,
            offer_id: response.offer_id,
            offerPrice: this.offerPrice,
            message: this.message
          });
        },
        error: async (error) => {
          this.isSubmitting = false;
          await this.dismissLoading(loading);

          if (error.status === 401) {
            await this.showAuthError();
            return;
          }

          const errorMessage = error.error?.message || this.translate.instant('MAKE_OFFER.SUBMIT_ERROR');
          await this.showErrorAlert(errorMessage);
        }
      });

      this.subscription.add(offerSubscription);
    } catch (err) {
      this.isSubmitting = false;
      await this.dismissLoading(loading);
      await this.showErrorAlert(this.translate.instant('MAKE_OFFER.UNEXPECTED_ERROR'));
    }
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('MAKE_OFFER.AUTH_ERROR'),
      message: this.translate.instant('MAKE_OFFER.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('MAKE_OFFER.OK'),
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
      header: this.translate.instant('MAKE_OFFER.VALIDATION_ERROR'),
      message: message,
      buttons: [this.translate.instant('MAKE_OFFER.OK')]
    });
    await alert.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('MAKE_OFFER.ERROR'),
      message: message,
      buttons: [this.translate.instant('MAKE_OFFER.OK')]
    });
    await alert.present();
  }

  private async dismissLoading(loading: HTMLIonLoadingElement): Promise<void> {
    try {
      await loading.dismiss();
    } catch (error) {
      // Loading already dismissed, ignore
    }
  }

  close() {
    if (this.isSubmitting) {
      return;
    }
    this.modalCtrl.dismiss();
  }
}