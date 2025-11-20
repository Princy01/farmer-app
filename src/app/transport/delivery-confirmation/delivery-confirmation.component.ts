import { Component, OnInit, OnDestroy, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, IonContent, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  checkmarkDoneCircle,
  helpCircleOutline,
  location,
  key,
  checkmarkCircle,
  receiptOutline,
  time,
  storefront,
  call,
  listOutline,
  informationCircle,
  checkmarkDone,
  refresh,
  helpCircle,
  documentText,
  headset,
  warning,
  arrowForward,
  home,
  close,
  send,
  personOutline,
  locationOutline,
  closeCircleOutline,
  carOutline,
  warningOutline
} from 'ionicons/icons';
import { AuthService } from 'src/app/auth/auth.service';
import { DeliveryService, DeliveryDetails, DeliveryItem } from './delivery-confirmation.service';

interface DeliveryIssueType {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-delivery-confirmation',
  standalone: true,
  templateUrl: './delivery-confirmation.component.html',
  styleUrls: ['./delivery-confirmation.component.scss'],
  imports: [IonicModule, FormsModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DeliveryConfirmationComponent implements OnInit, OnDestroy {
  // Core Properties
  jobId: number | null = null;
  orderId: number | null = null;
  driverId: number | null = null;
  retailerName: string = '';
  retailerPhone: string = '';
  deliveryAddress: string = '';

  // OTP Properties
  otpGenerated: boolean = false;
  otpDigits: string = '';
  otpError: string = '';
  otpTimer: number = 600;
  otpResendTimer: number = 30;
  isOtpResendDisabled: boolean = true;
  isGeneratingOTP: boolean = false;
  isVerifyingOTP: boolean = false;
  generatedOTP: string = ''; // For testing/debugging from backend response

  // Delivery Properties
  deliveryConfirmed: boolean = false;
  deliveryNotes: string = '';
  deliveryCompletedTime: Date = new Date();
  deliveryItems: DeliveryItem[] = [];

  // Modal Controls
  showSuccessModal: boolean = false;
  showIssueModal: boolean = false;

  // Issue Reporting
  selectedIssueType: DeliveryIssueType | null = null;
  issueDescription: string = '';

  // Timers
  timerInterval: any;
  resendTimerInterval: any;

  deliveryIssueTypes: DeliveryIssueType[] = [
    { id: 'customer_absent', label: 'Customer Not Available', icon: 'person-outline' },
    { id: 'wrong_address', label: 'Wrong/Unclear Address', icon: 'location-outline' },
    { id: 'customer_refuses', label: 'Customer Refuses Delivery', icon: 'close-circle-outline' },
    { id: 'vehicle_breakdown', label: 'Vehicle Breakdown', icon: 'car-outline' },
    { id: 'goods_damaged', label: 'Goods Damaged in Transit', icon: 'warning-outline' },
    { id: 'other', label: 'Other Issue', icon: 'help-circle-outline' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private deliveryService: DeliveryService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      'chevron-back': chevronBack,
      'checkmark-done-circle': checkmarkDoneCircle,
      'help-circle-outline': helpCircleOutline,
      'location': location,
      'key': key,
      'checkmark-circle': checkmarkCircle,
      'receipt-outline': receiptOutline,
      'time': time,
      'storefront': storefront,
      'call': call,
      'list-outline': listOutline,
      'information-circle': informationCircle,
      'checkmark-done': checkmarkDone,
      'refresh': refresh,
      'help-circle': helpCircle,
      'document-text': documentText,
      'headset': headset,
      'warning': warning,
      'arrow-forward': arrowForward,
      'home': home,
      'close': close,
      'send': send,
      'person-outline': personOutline,
      'location-outline': locationOutline,
      'close-circle-outline': closeCircleOutline,
      'car-outline': carOutline,
      'warning-outline': warningOutline
    });
  }

  async ngOnInit() {
    // Check authentication
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }
    this.driverId = this.authService.getUserId();

    // Get job_id and order_id from route params
    this.jobId = +this.route.snapshot.paramMap.get('jobId')! || null;
    this.orderId = +this.route.snapshot.paramMap.get('orderId')! || null;

    if (!this.jobId || !this.orderId) {
      await this.showToast('Invalid delivery details. Redirecting...', 'danger');
      this.router.navigate(['/transport/transport-dashboard']);
      return;
    }

    // Load delivery details and validate assignment
    await this.loadDeliveryDetails();
  }

  ngOnDestroy() {
    this.clearTimers();
  }

  private async loadDeliveryDetails() {
    const loading = await this.loadingCtrl.create({ message: 'Loading delivery details...' });
    await loading.present();

    try {
      const details: DeliveryDetails = await this.deliveryService.getDeliveryDetails(this.jobId!, this.orderId!).toPromise();

      // Validate assignment to logged-in driver
      if (details.assigned_driver_id !== this.driverId) {
        await loading.dismiss();
        await this.showToast('This delivery is not assigned to you.', 'danger');
        this.router.navigate(['/transport/transport-dashboard']);
        return;
      }

      // Populate component properties
      this.retailerName = details.retailer_name;
      this.retailerPhone = details.retailer_phone;
      this.deliveryAddress = details.delivery_address;
      this.deliveryItems = details.items;
      this.orderId = details.order_id; // Update if needed

    } catch (error) {
      console.error('Error loading delivery details:', error);
      await this.showToast('Failed to load delivery details.', 'danger');
      this.router.navigate(['/transport/transport-dashboard']);
    } finally {
      await loading.dismiss();
    }
  }

  // OTP Methods
  async generateOTP() {
    if (!this.jobId || !this.orderId) return;

    this.isGeneratingOTP = true;
    const loading = await this.loadingCtrl.create({ message: 'Generating OTP...' });
    await loading.present();

    try {
      const response = await this.deliveryService.generateOTP({ job_id: this.jobId, order_id: this.orderId }).toPromise();
      this.generatedOTP = response.otp_code; // For testing/debugging
      this.otpGenerated = true;
      this.startOtpTimer();
      this.startResendTimer();
      await this.showToast('OTP sent to retailer.', 'success');
    } catch (error) {
      console.error('Error generating OTP:', error);
      await this.showToast('Failed to generate OTP.', 'danger');
    } finally {
      this.isGeneratingOTP = false;
      await loading.dismiss();
    }
  }

  async regenerateOTP() {
    this.clearTimers();
    this.otpDigits = '';
    this.otpError = '';
    await this.generateOTP();
  }

  async verifyOTP() {
    if (!this.isOtpComplete() || !this.jobId || !this.orderId) return;

    this.isVerifyingOTP = true;
    const loading = await this.loadingCtrl.create({ message: 'Verifying delivery...' });
    await loading.present();

    try {
      await this.deliveryService.confirmDelivery({
        job_id: this.jobId,
        order_id: this.orderId,
        otp: this.otpDigits,
        notes: this.deliveryNotes
      }).toPromise();

      this.deliveryConfirmed = true;
      this.deliveryCompletedTime = new Date();
      this.clearTimers();
      this.showSuccessModal = true;
      await this.showToast('Delivery confirmed successfully!', 'success');
    } catch (error) {
      console.error('Error confirming delivery:', error);
      this.showOTPError();
    } finally {
      this.isVerifyingOTP = false;
      await loading.dismiss();
    }
  }

  onOtpBoxInput(event: any, index: number) {
    const inputEl = event.target as HTMLInputElement;
    const sanitized = inputEl.value.replace(/\D/g, '').slice(0, 1);
    inputEl.value = sanitized;
    // Clear any existing error when user starts typing
    if (this.otpError) this.otpError = '';
    // Update the otpDigits string
    const digits = this.otpDigits.split('');
    digits[index] = sanitized;
    this.otpDigits = digits.join('');
    // Move focus to next box if filled
    if (sanitized && index < 5) {
      const nextInput = document.querySelectorAll('.otp-box')[index + 1] as HTMLElement;
      if (nextInput) nextInput.focus();
    }
  }

  onOtpBoxKeydown(event: KeyboardEvent, index: number) {
    // Handle backspace
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.querySelectorAll('.otp-box')[index - 1] as HTMLElement;
      if (prevInput) prevInput.focus();
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits.length === 6 && /^\d{6}$/.test(this.otpDigits);
  }

  showOTPError() {
    this.otpDigits = '';  // Reset the string
    this.otpError = 'Invalid OTP entered. Please check and try again.';  // Set error message
    console.log('Invalid OTP entered');
    setTimeout(() => {
      const firstInput = document.querySelector('.otp-box') as HTMLElement;
      if (firstInput) firstInput.focus();
    }, 0);
  }

  otpExpired() {
    this.clearTimers();
    this.otpGenerated = false;
    this.otpDigits = '';  // Reset the string
    console.log('OTP expired');
  }

  // Timer Methods
  startOtpTimer() {
    this.timerInterval = setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        this.otpExpired();
      }
    }, 1000);
  }

  startResendTimer() {
    this.isOtpResendDisabled = true;
    this.otpResendTimer = 30;

    this.resendTimerInterval = setInterval(() => {
      this.otpResendTimer--;
      if (this.otpResendTimer <= 0) {
        this.isOtpResendDisabled = false;
        clearInterval(this.resendTimerInterval);
      }
    }, 1000);
  }

  clearTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.resendTimerInterval) {
      clearInterval(this.resendTimerInterval);
    }
  }

  onOtpBoxPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6) || '';
    this.otpDigits = pasted.padEnd(6, '');  // Pad to 6 characters
    // Optionally, move focus to last filled box
    const lastFilled = pasted.length > 0 ? pasted.length - 1 : 0;
    setTimeout(() => {
      const input = document.querySelectorAll('.otp-box')[lastFilled] as HTMLElement;
      if (input) input.focus();
    }, 0);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getResendButtonText(): string {
    return this.isOtpResendDisabled ?
      `Resend in ${this.otpResendTimer}s` :
      'Generate New OTP';
  }

  getConditionText(condition: string): string {
    switch (condition) {
      case 'good': return 'Good Condition';
      case 'damaged': return 'Damaged';
      default: return 'Not Checked';
    }
  }

  // Action Methods - ORIGINAL FUNCTIONALITY RESTORED
  contactCustomer() {
    // Original functionality: Open customer chat
    this.router.navigate(['/transport/customer-chat'], {
      state: {
        orderId: this.orderId,
        customerName: this.retailerName,
        customerPhone: this.retailerPhone
      }
    });
  }

  callSupport() {
    window.open('tel:+911800123456');
  }

  reportDeliveryIssue() {
    this.showIssueModal = true;
    this.selectedIssueType = null;
    this.issueDescription = '';
  }

  selectIssueType(issue: DeliveryIssueType) {
    this.selectedIssueType = issue;
  }

  async submitDeliveryIssue() {
    try {
      // Simulate API call
      await this.delay(1000);

      console.log('Issue submitted:', {
        type: this.selectedIssueType,
        description: this.issueDescription,
        orderId: this.orderId
      });

      this.showIssueModal = false;
      // Show success message or navigate

    } catch (error) {
      console.error('Error submitting issue:', error);
    }
  }

  goToNextDelivery() {
    this.showSuccessModal = false;
    // Navigate to next delivery or dashboard
    this.router.navigate(['/transport/active-deliveries']);
  }

  goToDashboard() {
    this.showSuccessModal = false;
    this.router.navigate(['/transport/transport-dashboard']);
  }

  goBack() {
    this.router.navigate(['/transport/active-deliveries']);
  }

  hasMoreDeliveries(): boolean {
    // Check if driver has more deliveries
    return true; // This would come from your delivery service
  }

  // Utility Methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: 'Authentication Required',
      message: 'Please log in to access this page.',
      buttons: ['OK']
    });
    await alert.present();
    this.router.navigate(['/auth/login']);
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}