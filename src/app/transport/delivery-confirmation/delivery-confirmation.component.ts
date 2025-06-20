import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  chevronBack, helpCircleOutline, checkmarkDoneCircle, location, mail,
  checkmarkCircle, receipt, flash, storefront, call, cube, shieldCheckmark,
  documentText, checkmarkDone, star, warning, headset, arrowForward, refresh, chatbubbles
} from 'ionicons/icons';

@Component({
  selector: 'app-delivery-confirmation',
  standalone: true,
  templateUrl: './delivery-confirmation.component.html',
  styleUrls: ['./delivery-confirmation.component.scss'],
  imports: [IonicModule, FormsModule, CommonModule]
})
export class DeliveryConfirmationComponent implements OnInit, OnDestroy {
  orderId: string = '';
  otp: string = '';
  otpDigits: string[] = ['', '', '', ''];
  notes: string = '';
  otpTimer: number = 30;
  timerInterval: any;
  isOtpResendDisabled: boolean = true;
  otpSent: boolean = false;
  deliveryConfirmed: boolean = false;
  showSuccessModal: boolean = false;
  phoneNumber: string = '';
  apiUrl: string = 'http://127.0.0.1:3000/api';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      chevronBack, helpCircleOutline, checkmarkDoneCircle, location, mail,
      checkmarkCircle, receipt, flash, storefront, call, cube, shieldCheckmark,
      documentText, checkmarkDone, star, warning, headset, arrowForward, refresh, chatbubbles
    });
  }

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '123456';
    this.getOrderDetails();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  goBack() {
    this.router.navigate(['/transport/dashboard']);
  }

  getOrderDetails() {
    // Simulate API call
    this.phoneNumber = '+91 98765 43210';
  }

  async sendOtpToCustomer() {
    if (this.otpSent) return;

    // Simulate API call
    this.otpSent = true;
    this.otpTimer = 30;
    this.isOtpResendDisabled = true;
    this.startOtpTimer();

    const toast = await this.toastCtrl.create({
      message: 'OTP sent to customer successfully!',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  startOtpTimer() {
    this.timerInterval = setInterval(() => {
      if (this.otpTimer > 0) {
        this.otpTimer--;
      } else {
        this.isOtpResendDisabled = false;
        this.otpSent = false;
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  async resendOtp() {
    if (this.otpTimer > 0) return;

    this.sendOtpToCustomer();

    const toast = await this.toastCtrl.create({
      message: 'OTP resent successfully!',
      duration: 2000,
      color: 'primary',
      position: 'top'
    });
    await toast.present();
  }

  onOtpInput(index: number, event: any) {
    const value = event.target.value;
    if (value.length <= 1) {
      this.otpDigits[index] = value;
      this.otp = this.otpDigits.join('');

      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.querySelectorAll('.otp-digit')[index + 1] as HTMLElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  }

  canConfirmDelivery(): boolean {
    return this.otpSent && this.otp.length === 4;
  }

  async submitDelivery() {
    if (!this.canConfirmDelivery()) {
      const alert = await this.alertCtrl.create({
        header: 'Invalid OTP',
        message: 'Please enter the complete 4-digit OTP received from customer.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Simulate delivery confirmation
    this.deliveryConfirmed = true;
    this.showSuccessModal = true;
  }

  async requestFeedback() {
    const toast = await this.toastCtrl.create({
      message: 'Feedback request sent to customer!',
      duration: 2000,
      color: 'tertiary',
      position: 'top'
    });
    await toast.present();
  }

  async reportIssue() {
    const alert = await this.alertCtrl.create({
      header: 'Report Issue',
      message: 'Describe the issue you encountered during delivery:',
      inputs: [
        {
          name: 'issue',
          type: 'textarea',
          placeholder: 'Enter issue description...'
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Submit Report',
          handler: async (data) => {
            const toast = await this.toastCtrl.create({
              message: 'Issue reported successfully!',
              duration: 2000,
              color: 'warning',
              position: 'top'
            });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }

  callSupport() {
    window.open('tel:+911800123456', '_system');
  }

  contactCustomer() {
    window.open(`tel:${this.phoneNumber}`, '_system');
  }

  addQuickNote(note: string) {
    if (this.notes) {
      this.notes += ', ' + note;
    } else {
      this.notes = note;
    }
  }

  goToNextDelivery() {
    this.showSuccessModal = false;
    this.router.navigate(['/transport/active-deliveries']);
  }

  goHome() {
    this.showSuccessModal = false;
    this.router.navigate(['/transport/dashboard']);
  }

  openCustomerChat() {
  this.router.navigate(['/transport/customer-chat'], {
    state: {
      orderId: this.orderId,
      customerName: 'ABC Fresh Mart',
      customerPhone: this.phoneNumber
    }
  });
}
}