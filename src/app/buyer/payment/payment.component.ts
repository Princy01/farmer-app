import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {
  orderData: any;
  selectedPaymentMethod: string = ''; // No default selection
  isProcessingPayment: boolean = false;
  loadingPaymentMethods: boolean = true;

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
    private loadingCtrl: LoadingController
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
    // Simulate loading time for payment methods
    setTimeout(() => {
      this.loadingPaymentMethods = false;
    }, 1000);
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

    const loading = await this.loadingCtrl.create({
      message: this.getProcessingMessage(),
      spinner: 'dots'
    });
    await loading.present();

    this.isProcessingPayment = true;

    try {
      // Simulate payment processing based on method
      await this.simulatePaymentProcessing();

      await loading.dismiss();

      // Navigate to order confirmation
      this.router.navigate(['/buyer/order-confirmation'], {
        state: {
          orderData: {
            ...this.orderData,
            orderId: 'ORD' + Date.now(),
            paymentMethod: this.selectedPaymentMethod,
            paymentStatus: this.selectedPaymentMethod === 'COD' ? 'pending' : 'completed',
            orderDate: new Date()
          }
        }
      });
    } catch (error) {
      await loading.dismiss();
      this.isProcessingPayment = false;
      this.showPaymentError();
    }
  }

  private simulatePaymentProcessing(): Promise<void> {
    return new Promise((resolve, reject) => {
      const processingTime = this.selectedPaymentMethod === 'COD' ? 1500 : 3000;

      setTimeout(() => {
        // Higher success rate for COD, 90% for others
        const successRate = this.selectedPaymentMethod === 'COD' ? 0.98 : 0.9;
        if (Math.random() < successRate) {
          resolve();
        } else {
          reject(new Error('Payment failed'));
        }
      }, processingTime);
    });
  }

  private async showPaymentError() {
    const methodName = this.getPaymentMethodName();
    const alert = await this.alertCtrl.create({
      header: `${methodName} Failed`,
      message: `There was an error processing your ${methodName.toLowerCase()}. Please try again or choose a different payment method.`,
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