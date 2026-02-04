import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ModalController, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopRetailer, WholesalerApiService, CreateOfferRequest } from '../../services/wholesaler-api.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { close, cube, trendingUp, calendar, checkmarkCircle, cashOutline, chatboxOutline, chevronUp, chevronDown } from 'ionicons/icons';

@Component({
  selector: 'app-retailer-products-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe, FormsModule],
  templateUrl: './retailer-products-modal.component.html',
  styleUrls: ['./retailer-products-modal.component.scss']
})
export class RetailerProductsModalComponent implements OnInit, OnDestroy {
  @Input() retailer!: TopRetailer;

  // Offer form fields
  offerPrice: number = 0;
  message: string = '';
  proposedDeliveryDate: string = '';
  isSubmitting = false;
  showOfferSection = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private modalCtrl: ModalController,
    private translate: TranslateService,
    private wholesalerService: WholesalerApiService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({ close, cube, trendingUp, calendar, checkmarkCircle, cashOutline, chatboxOutline, chevronUp, chevronDown });
  }

  ngOnInit() {
    console.log('Retailer data:', this.retailer);

    // Set default delivery date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.proposedDeliveryDate = tomorrow.toISOString().split('T')[0];

    // Set suggested offer price (slightly below total order value)
    if (this.retailer.total_order_value) {
      this.offerPrice = Math.floor(this.retailer.total_order_value * 0.95);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleOfferSection() {
    this.showOfferSection = !this.showOfferSection;
  }

  async submitOffer() {
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }

    if (this.offerPrice <= 0) {
      await this.showValidationError(this.translate.instant('RETAILER_DETAILS.INVALID_PRICE'));
      return;
    }

    if (!this.proposedDeliveryDate) {
      await this.showValidationError(this.translate.instant('RETAILER_DETAILS.INVALID_DATE'));
      return;
    }

    // Note: We need retailer_id as order_id for the offer
    // This might need adjustment based on your backend API
    const confirmAlert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_DETAILS.CONFIRM_OFFER'),
      message: this.translate.instant('RETAILER_DETAILS.CONFIRM_OFFER_MESSAGE', {
        retailer: this.retailer.retailer_name,
        price: this.offerPrice
      }),
      buttons: [
        {
          text: this.translate.instant('RETAILER_DETAILS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('RETAILER_DETAILS.CONFIRM'),
          handler: async () => {
            await this.processOffer();
          }
        }
      ]
    });

    await confirmAlert.present();
  }

  private async processOffer() {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_DETAILS.SUBMITTING'),
      spinner: 'circular',
    });

    try {
      await loading.present();
      this.isSubmitting = true;

      const offerData: CreateOfferRequest = {
        order_id: this.retailer.retailer_id,
        wholeseller_id: this.authService.getUserId() || 0,
        offered_price: this.offerPrice,
        proposed_delivery_date: this.proposedDeliveryDate,
        message: this.message
      };

      const offerSubscription = this.wholesalerService.createOffer(offerData).subscribe({
        next: async (response) => {
          this.isSubmitting = false;
          await this.dismissLoading(loading);

          const toast = await this.toastCtrl.create({
            message: this.translate.instant('RETAILER_DETAILS.OFFER_SUCCESS', { id: response.offer_id }),
            duration: 3000,
            color: 'success',
            position: 'bottom',
            icon: 'checkmark-circle'
          });
          await toast.present();

          this.modalCtrl.dismiss({
            success: true,
            offer_id: response.offer_id
          });
        },
        error: async (error) => {
          this.isSubmitting = false;
          await this.dismissLoading(loading);

          if (error.status === 401) {
            await this.showAuthError();
            return;
          }

          const errorMessage = error.error?.message || this.translate.instant('RETAILER_DETAILS.SUBMIT_ERROR');
          await this.showErrorAlert(errorMessage);
        }
      });

      this.subscription.add(offerSubscription);
    } catch (err) {
      this.isSubmitting = false;
      await this.dismissLoading(loading);
      await this.showErrorAlert(this.translate.instant('RETAILER_DETAILS.UNEXPECTED_ERROR'));
    }
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_DETAILS.AUTH_ERROR'),
      message: this.translate.instant('RETAILER_DETAILS.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('RETAILER_DETAILS.OK'),
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
      header: this.translate.instant('RETAILER_DETAILS.VALIDATION_ERROR'),
      message: message,
      buttons: [this.translate.instant('RETAILER_DETAILS.OK')]
    });
    await alert.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_DETAILS.ERROR'),
      message: message,
      buttons: [this.translate.instant('RETAILER_DETAILS.OK')]
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

  dismiss() {
    if (this.isSubmitting) {
      return;
    }
    this.modalCtrl.dismiss();
  }
}