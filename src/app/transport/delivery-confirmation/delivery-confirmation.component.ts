import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
  notes: string = '';
  otpTimer: number = 30;
  timerInterval: any;
  isOtpResendDisabled: boolean = true; // Controls OTP resend button
  otpSent: boolean = false;
  phoneNumber: string = ''; // Customer's phone number
  apiUrl: string = 'http://127.0.0.1:3000/api'; // Your API Base URL

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || 'Unknown';
    this.getOrderDetails();
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval); // Clean up timer when component is destroyed
  }

  /**
   * Fetches order details, including customer phone number.
   */
  getOrderDetails() {
    this.http.get<any>(`${this.apiUrl}/orders/${this.orderId}`).subscribe({
      next: (data) => {
        this.phoneNumber = data.customerPhone; // Get customer phone number
      },
      error: () => {
        console.error('Failed to fetch order details.');
      }
    });
  }

  /**
   * Sends OTP to customer and starts timer.
   */
  async sendOtpToCustomer() {
    if (this.otpSent) {
      return;
    }

    this.http.get(`${this.apiUrl}/send-otp?phone=${this.phoneNumber}`).subscribe({
      next: async () => {
        this.otpSent = true;
        this.otpTimer = 30;
        this.isOtpResendDisabled = true;
        this.startOtpTimer();

        const toast = await this.toastCtrl.create({
          message: 'OTP Sent to Customer!',
          duration: 2000,
          color: 'primary'
        });
        await toast.present();
      },
      error: async () => {
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'Failed to send OTP. Try again!',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  /**
   * Starts the OTP countdown timer.
   */
  startOtpTimer() {
    this.timerInterval = setInterval(() => {
      if (this.otpTimer > 0) {
        this.otpTimer--;
      } else {
        this.isOtpResendDisabled = false; // Enable resend OTP button
        this.otpSent = false;
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  /**
   * Resends OTP and restarts the timer.
   */
  async resendOtp() {
    if (this.otpTimer > 0) {
      return;
    }

    this.otpTimer = 30;
    this.isOtpResendDisabled = true; // Disable button after resend
    this.startOtpTimer();

    const toast = await this.toastCtrl.create({
      message: 'OTP Resent Successfully!',
      duration: 2000,
      color: 'primary'
    });
    await toast.present();

    this.sendOtpToCustomer(); // Resend OTP API call
  }

  /**
   * Submits the delivery confirmation with OTP validation.
   */
  async submitDelivery() {
    if (!this.otp || this.otp.length !== 4) {
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Please enter a valid 4-digit OTP.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const toast = await this.toastCtrl.create({
      message: 'Delivery Confirmed Successfully!',
      duration: 2000,
      color: 'success'
    });
    await toast.present();

    // TODO: Send confirmation to backend API
  }

  /**
   * Requests feedback from the customer.
   */
  async requestFeedback() {
    const toast = await this.toastCtrl.create({
      message: 'Feedback request sent to customer!',
      duration: 2000,
      color: 'tertiary'
    });
    await toast.present();

    // TODO: Implement feedback request logic
  }
}
