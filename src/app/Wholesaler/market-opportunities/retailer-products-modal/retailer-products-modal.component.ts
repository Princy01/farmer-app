import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ModalController, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopRetailer, WholesalerApiService, CreateOfferRequest } from '../../services/wholesaler-api.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { close, cube, trendingUp, calendar, checkmarkCircle, cashOutline, chatboxOutline, chevronUp, chevronDown, refreshOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-retailer-products-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe, FormsModule],
  templateUrl: './retailer-products-modal.component.html',
  styleUrls: ['./retailer-products-modal.component.scss']
})
export class RetailerProductsModalComponent implements OnInit, OnDestroy {
  @Input() retailer!: TopRetailer;

  offerPrice: number = 0;
  message: string = '';
  proposedDeliveryDate: string = '';
  isSubmitting = false;
  showOfferSection = false;
  hasOfferError = false;
  lastOfferErrorType: string | null = null;
  retryCount = 0;
  maxRetries = 3;

  private destroy$ = new Subject<void>();
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
    addIcons({ close, cube, trendingUp, calendar, checkmarkCircle, cashOutline, chatboxOutline, chevronUp, chevronDown, refreshOutline, alertCircleOutline });
  }

  ngOnInit() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.proposedDeliveryDate = tomorrow.toISOString().split('T')[0];

    if (this.retailer.total_order_value) {
      this.offerPrice = Math.floor(this.retailer.total_order_value * 0.95);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription.unsubscribe();
  }

  toggleOfferSection() {
    this.showOfferSection = !this.showOfferSection;
  }

  retryOffer() {
    this.hasOfferError = false;
    this.lastOfferErrorType = null;
    this.retryCount = 0;
    this.submitOffer();
  }

  async submitOffer() {
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }

    if (this.offerPrice <= 0) {
      const message = await this.translate.get('RETAILER_DETAILS.INVALID_PRICE').toPromise();
      await this.showValidationError(message || '');
      return;
    }

    if (!this.proposedDeliveryDate) {
      const message = await this.translate.get('RETAILER_DETAILS.INVALID_DATE').toPromise();
      await this.showValidationError(message || '');
      return;
    }

    this.hasOfferError = false;
    this.lastOfferErrorType = null;

    const headerText = await this.translate.get('RETAILER_DETAILS.CONFIRM_OFFER').toPromise();
    const messageText = await this.translate.get('RETAILER_DETAILS.CONFIRM_OFFER_MESSAGE', {
      retailer: this.retailer.retailer_name,
      price: this.offerPrice
    }).toPromise();
    const cancelText = await this.translate.get('RETAILER_DETAILS.CANCEL').toPromise();
    const confirmText = await this.translate.get('RETAILER_DETAILS.CONFIRM').toPromise();

    const confirmAlert = await this.alertCtrl.create({
      header: headerText,
      message: messageText,
      buttons: [
        {
          text: cancelText,
          role: 'cancel'
        },
        {
          text: confirmText,
          handler: async () => {
            await this.processOffer();
          }
        }
      ]
    });

    await confirmAlert.present();
  }

  private async processOffer() {
    let loading: HTMLIonLoadingElement | null = null;
    const submittingText = await this.translate.get('RETAILER_DETAILS.SUBMITTING').toPromise();

    try {
      loading = await this.loadingCtrl.create({
        message: submittingText,
        spinner: 'circular',
      });

      await loading.present();
      this.isSubmitting = true;

      const offerData: CreateOfferRequest = {
        order_id: this.retailer.retailer_id,
        wholeseller_id: this.authService.getUserId() || 0,
        offered_price: this.offerPrice,
        proposed_delivery_date: this.proposedDeliveryDate,
        message: this.message
      };

      const offerSubscription = this.wholesalerService.createOffer(offerData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (response) => {
            this.isSubmitting = false;
            this.retryCount = 0;
            await this.dismissLoading(loading);

            const successMessage = await this.translate.get('RETAILER_DETAILS.OFFER_SUCCESS', { id: response.offer_id }).toPromise();
            const toast = await this.toastCtrl.create({
              message: successMessage,
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

            if (this.isRetryableError(error) && this.retryCount < this.maxRetries) {
              this.retryCount++;
              const delayMs = Math.pow(2, this.retryCount - 1) * 1000;
              await this.handleRetryableError(error, delayMs);
              return;
            }

            this.hasOfferError = true;
            this.handleErrorDisplay(error);
          }
        });

      this.subscription.add(offerSubscription);
    } catch (err) {
      this.isSubmitting = false;
      await this.dismissLoading(loading);
      this.hasOfferError = true;
      const errorMessage = await this.translate.get('RETAILER_DETAILS.UNEXPECTED_ERROR').toPromise();
      await this.showErrorAlert(errorMessage || '');
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error) return false;
    const status = error.status;
    return status === 0 || status === 408 || status === 429 || (status >= 500 && status < 600);
  }

  private async handleRetryableError(error: any, delayMs: number) {
    this.lastOfferErrorType = 'retrying';
    const retryMessage = await this.translate.get('RETAILER_DETAILS.RETRYING_OFFER', {
      attempt: this.retryCount,
      max: this.maxRetries
    }).toPromise();

    const toast = await this.toastCtrl.create({
      message: retryMessage,
      duration: 2000,
      color: 'warning',
      position: 'bottom'
    });
    await toast.present();

    await new Promise(resolve => setTimeout(resolve, delayMs));
    await this.processOffer();
  }

  private handleErrorDisplay(error: any) {
    let errorType = 'RETAILER_DETAILS.OFFER_ERROR_UNKNOWN';

    if (error.status === 0 || error.message?.toLowerCase().includes('network')) {
      errorType = 'RETAILER_DETAILS.OFFER_ERROR_NETWORK';
      this.lastOfferErrorType = 'network';
    } else if (error.status === 408 || error.name === 'TimeoutError') {
      errorType = 'RETAILER_DETAILS.OFFER_ERROR_TIMEOUT';
      this.lastOfferErrorType = 'timeout';
    } else if (error.status === 403) {
      errorType = 'RETAILER_DETAILS.OFFER_ERROR_PERMISSION';
      this.lastOfferErrorType = 'permission';
    } else if (error.status === 429) {
      errorType = 'RETAILER_DETAILS.OFFER_ERROR_RATE_LIMIT';
      this.lastOfferErrorType = 'rate_limit';
    } else if (error.status >= 500) {
      errorType = 'RETAILER_DETAILS.OFFER_ERROR_SERVER';
      this.lastOfferErrorType = 'server';
    } else if (error.status >= 400) {
      errorType = 'RETAILER_DETAILS.OFFER_ERROR_VALIDATION';
      this.lastOfferErrorType = 'validation';
    }

    this.showErrorAlert(errorType);
  }

  private async showAuthError() {
    const headerText = await this.translate.get('RETAILER_DETAILS.AUTH_ERROR').toPromise();
    const messageText = await this.translate.get('RETAILER_DETAILS.SESSION_EXPIRED').toPromise();
    const okText = await this.translate.get('RETAILER_DETAILS.OK').toPromise();

    const alert = await this.alertCtrl.create({
      header: headerText,
      message: messageText,
      buttons: [
        {
          text: okText,
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
    const headerText = await this.translate.get('RETAILER_DETAILS.VALIDATION_ERROR').toPromise();
    const okText = await this.translate.get('RETAILER_DETAILS.OK').toPromise();

    const alert = await this.alertCtrl.create({
      header: headerText,
      message: message,
      buttons: [okText]
    });
    await alert.present();
  }

  private async showErrorAlert(messageOrKey: string) {
    let message = messageOrKey;

    if (messageOrKey.includes('RETAILER_DETAILS.')) {
      message = await this.translate.get(messageOrKey).toPromise() || messageOrKey;
    }

    const headerText = await this.translate.get('RETAILER_DETAILS.ERROR').toPromise();
    const okText = await this.translate.get('RETAILER_DETAILS.OK').toPromise();

    const alert = await this.alertCtrl.create({
      header: headerText,
      message: message,
      buttons: [okText]
    });
    await alert.present();
  }

  private async dismissLoading(loading: HTMLIonLoadingElement | null): Promise<void> {
    if (!loading) return;
    try {
      await loading.dismiss();
    } catch (error) {
      // Loading already dismissed or destroyed, ignore
    }
  }

  dismiss() {
    if (this.isSubmitting) {
      return;
    }
    this.modalCtrl.dismiss();
  }
}