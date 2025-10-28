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

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
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
      name: 'UPI Payment',
      description: 'Pay using any UPI app (GPay, PhonePe, Paytm, etc.)',
      icon: 'phone-portrait-outline',
      available: true
    },
    {
      id: 'CARD',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, Rupay cards accepted',
      icon: 'card-outline',
      available: true
    },
    {
      id: 'NETBANKING',
      name: 'Net Banking',
      description: 'Pay directly from your bank account',
      icon: 'business-outline',
      available: true
    },
    {
      id: 'WALLET',
      name: 'Digital Wallet',
      description: 'Paytm, PhonePe, Amazon Pay, etc.',
      icon: 'wallet-outline',
      available: true
    },
    {
      id: 'COD',
      name: 'Cash on Delivery',
      description: 'Pay when your order is delivered',
      icon: 'cash-outline',
      available: true
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private paymentService: PaymentService
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
    return method?.name || this.selectedPaymentMethod;
  }

  getProcessingMessage(): string {
    switch (this.selectedPaymentMethod) {
      case 'UPI':
        return 'Processing UPI payment...';
      case 'CARD':
        return 'Processing card payment...';
      case 'NETBANKING':
        return 'Redirecting to bank...';
      case 'WALLET':
        return 'Processing wallet payment...';
      case 'COD':
        return 'Confirming your order...';
      default:
        return 'Processing payment...';
    }
  }

  getPayButtonText(): string {
    if (this.isProcessingPayment) {
      return 'Processing...';
    }

    switch (this.selectedPaymentMethod) {
      case 'UPI':
        return 'Pay with UPI';
      case 'CARD':
        return 'Pay with Card';
      case 'NETBANKING':
        return 'Pay with Net Banking';
      case 'WALLET':
        return 'Pay with Wallet';
      case 'COD':
        return 'Place Order (COD)';
      default:
        return 'Select Payment Method';
    }
  }

  async processPayment() {
    if (!this.selectedPaymentMethod) {
      const alert = await this.alertCtrl.create({
        header: 'Payment Method Required',
        message: 'Please select a payment method to continue.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    this.isProcessingPayment = true;

    // COD logic remains unchanged
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
      message: 'Redirecting to payment gateway...',
      spinner: 'dots'
    });
    await loading.present();

    try {
      const amount = this.orderData?.grandTotal;
      const description = `Order for ${this.orderData?.items?.length || 1} item(s)`;
      const currency = 'inr';

      const response = await this.paymentService.initiatePayment(amount, currency, description).toPromise();
      await loading.dismiss();

      if (response?.data?.payment_url && response?.data?.order_id) {
        const paymentUrl = response.data.payment_url;
        const orderId = response.data.order_id;
        window.open(paymentUrl, '_blank');

        // Show loading while polling
        const pollingLoader = await this.loadingCtrl.create({
          message: 'Waiting for payment confirmation...',
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
              this.showPaymentError('Payment failed or cancelled. Please try again.');
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
          this.showPaymentError('Payment not completed within 5 minutes. Please try again.');
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
      header: `${methodName} Failed`,
      message: message || `There was an error processing your ${methodName.toLowerCase()}. Please try again or choose a different payment method.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.goBack();
          }
        },
        {
          text: 'Retry',
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