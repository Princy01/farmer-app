import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  phonePortraitOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  receiptOutline,
  cardOutline,
  checkmarkCircle,
  walletOutline,
  cashOutline,
  businessOutline
} from 'ionicons/icons';
import { PaymentService } from './payment.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit, OnDestroy {
  orderData: any;
  selectedPaymentMethod: string = '';
  isProcessingPayment: boolean = false;
  loadingPaymentMethods: boolean = true;
  pollingInterval: any = null;
  pollingTimeout: any = null;

  paymentMethods = [
    {
      id: 'UPI',
      name: 'PAYMENT.UPI_NAME',
      description: 'PAYMENT.UPI_DESC',
      icon: 'phone-portrait-outline',
      available: true
    },
    {
      id: 'CARD',
      name: 'PAYMENT.CARD_NAME',
      description: 'PAYMENT.CARD_DESC',
      icon: 'card-outline',
      available: true
    },
    {
      id: 'NETBANKING',
      name: 'PAYMENT.NETBANKING_NAME',
      description: 'PAYMENT.NETBANKING_DESC',
      icon: 'business-outline',
      available: true
    },
    {
      id: 'WALLET',
      name: 'PAYMENT.WALLET_NAME',
      description: 'PAYMENT.WALLET_DESC',
      icon: 'wallet-outline',
      available: true
    },
    {
      id: 'COD',
      name: 'PAYMENT.COD_NAME',
      description: 'PAYMENT.COD_DESC',
      icon: 'cash-outline',
      available: true
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private paymentService: PaymentService,
    private translate: TranslateService
  ) {
    addIcons({
      chevronBack,
      phonePortraitOutline,
      shieldCheckmarkOutline,
      lockClosedOutline,
      receiptOutline,
      cardOutline,
      checkmarkCircle,
      walletOutline,
      cashOutline,
      businessOutline
    });

    const navigation = this.router.getCurrentNavigation();
    this.orderData = navigation?.extras?.state?.['orderData'];

    if (!this.orderData) {
      this.router.navigate(['/buyer/cart']);
    }
  }

  ngOnInit() {
    setTimeout(() => {
      this.loadingPaymentMethods = false;
    }, 1000);
  }

  ngOnDestroy() {
    this.clearPolling();
  }

  selectPaymentMethod(method: string) {
    this.selectedPaymentMethod = method;
  }

  getPaymentMethodName(): string {
    const method = this.paymentMethods.find(m => m.id === this.selectedPaymentMethod);
    return method ? this.translate.instant(method.name) : this.selectedPaymentMethod;
  }

  getProcessingMessage(): string {
    switch (this.selectedPaymentMethod) {
      case 'UPI':
        return this.translate.instant('PAYMENT.PROCESSING_UPI');
      case 'CARD':
        return this.translate.instant('PAYMENT.PROCESSING_CARD');
      case 'NETBANKING':
        return this.translate.instant('PAYMENT.PROCESSING_NETBANKING');
      case 'WALLET':
        return this.translate.instant('PAYMENT.PROCESSING_WALLET');
      case 'COD':
        return this.translate.instant('PAYMENT.PROCESSING_COD');
      default:
        return this.translate.instant('PAYMENT.PROCESSING_DEFAULT');
    }
  }

  getPayButtonText(): string {
    if (this.isProcessingPayment) {
      return this.translate.instant('PAYMENT.PROCESSING');
    }

    switch (this.selectedPaymentMethod) {
      case 'UPI':
        return this.translate.instant('PAYMENT.PAY_UPI');
      case 'CARD':
        return this.translate.instant('PAYMENT.PAY_CARD');
      case 'NETBANKING':
        return this.translate.instant('PAYMENT.PAY_NETBANKING');
      case 'WALLET':
        return this.translate.instant('PAYMENT.PAY_WALLET');
      case 'COD':
        return this.translate.instant('PAYMENT.PLACE_ORDER_COD');
      default:
        return this.translate.instant('PAYMENT.SELECT_METHOD');
    }
  }

  async processPayment() {
    if (!this.selectedPaymentMethod) {
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('PAYMENT.METHOD_REQUIRED'),
        message: this.translate.instant('PAYMENT.SELECT_METHOD_MSG'),
        buttons: [this.translate.instant('PAYMENT.OK')]
      });
      await alert.present();
      return;
    }

    this.isProcessingPayment = true;

    if (this.selectedPaymentMethod === 'COD') {
      const loading = await this.loadingCtrl.create({
        message: this.getProcessingMessage(),
        spinner: 'dots'
      });
      await loading.present();

      try {
        await this.simulatePaymentProcessing();
        await loading.dismiss();
        this.router.navigate(['/buyer/order-confirmation'], {
          state: {
            orderData: {
              ...this.orderData,
              orderId: 'ORD' + Date.now(),
              paymentMethod: this.selectedPaymentMethod,
              paymentStatus: 'pending',
              orderDate: new Date()
            }
          }
        });
      } catch (error) {
        await loading.dismiss();
        this.isProcessingPayment = false;
        this.showPaymentError();
      }
      return;
    }

    // Online payment logic
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PAYMENT.REDIRECTING'),
      spinner: 'dots'
    });
    await loading.present();

    try {
      const amount = this.orderData?.grandTotal;
      const description = this.translate.instant('PAYMENT.ORDER_DESC', { count: this.orderData?.items?.length || 1 });
      const currency = 'inr';

      const response = await this.paymentService.initiatePayment(amount, currency, description).toPromise();
      await loading.dismiss();

      if (response?.data?.payment_url && response?.data?.order_id) {
        const paymentUrl = response.data.payment_url;
        const orderId = response.data.order_id;
        window.open(paymentUrl, '_blank');

        // Show loading while polling
        const pollingLoader = await this.loadingCtrl.create({
          message: this.translate.instant('PAYMENT.WAITING_CONFIRMATION'),
          spinner: 'dots'
        });
        await pollingLoader.present();

        let elapsed = 0;
        const pollIntervalMs = 3000;
        const maxWaitMs = 5 * 60 * 1000; // 5 minutes

        this.pollingInterval = setInterval(async () => {
          elapsed += pollIntervalMs;
          try {
            const statusResponse = await this.paymentService.checkPaymentStatus(orderId).toPromise();
            const paymentStatus = statusResponse?.data?.status || 'unknown';

            if (paymentStatus === 'success') {
              await pollingLoader.dismiss();
              this.clearPolling();
              this.router.navigate(['/buyer/order-confirmation'], {
                state: {
                  orderData: {
                    ...this.orderData,
                    orderId: statusResponse.data.order_id,
                    paymentId: statusResponse.data.payment_id,
                    transactionId: statusResponse.data.transaction_id,
                    paymentMethod: this.selectedPaymentMethod,
                    paymentStatus: 'completed',
                    paidAt: statusResponse.data.paid_at,
                    orderDate: statusResponse.data.created_at,
                    amount: statusResponse.data.amount
                  }
                }
              });
            } else if (paymentStatus === 'failed') {
              await pollingLoader.dismiss();
              this.clearPolling();
              this.showPaymentError(this.translate.instant('PAYMENT.PAYMENT_FAILED'));
            }
            // If status is 'initiated' or 'pending', keep polling
          } catch (err) {
            // Ignore errors during polling, will retry
          }
        }, pollIntervalMs);

        // Set timeout to stop polling after maxWaitMs
        this.pollingTimeout = setTimeout(async () => {
          this.clearPolling();
          await pollingLoader.dismiss();
          this.showPaymentError(this.translate.instant('PAYMENT.TIMEOUT_ERROR'));
        }, maxWaitMs);

      } else {
        throw new Error('Payment URL or Order ID not received');
      }
    } catch (error) {
      await loading.dismiss();
      this.isProcessingPayment = false;
      this.showPaymentError();
    }
  }

  private clearPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
      this.pollingTimeout = null;
    }
    this.isProcessingPayment = false;
  }

  private simulatePaymentProcessing(): Promise<void> {
    return new Promise((resolve, reject) => {
      const processingTime = this.selectedPaymentMethod === 'COD' ? 1500 : 3000;
      setTimeout(() => {
        const successRate = this.selectedPaymentMethod === 'COD' ? 0.98 : 0.9;
        if (Math.random() < successRate) {
          resolve();
        } else {
          reject(new Error('Payment failed'));
        }
      }, processingTime);
    });
  }

  private async showPaymentError(message?: string) {
    const methodName = this.getPaymentMethodName();
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PAYMENT.PAYMENT_FAILED_HEADER', { method: methodName }),
      message: message || this.translate.instant('PAYMENT.PAYMENT_ERROR_MSG', { method: methodName.toLowerCase() }),
      buttons: [
        {
          text: this.translate.instant('PAYMENT.CANCEL'),
          role: 'cancel',
          handler: () => {
            this.goBack();
          }
        },
        {
          text: this.translate.instant('PAYMENT.RETRY'),
          handler: () => {
            // User can retry payment
          }
        }
      ]
    });
    await alert.present();
  }

  goBack() {
    this.router.navigate(['/buyer/checkout']);
  }
}