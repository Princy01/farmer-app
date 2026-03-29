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
  warningOutline,
  chevronBackOutline
} from 'ionicons/icons';
import { AuthService } from 'src/app/auth/auth.service';
import { DeliveryService, DeliveryDetails, DeliveryItem, ActiveJob, JobOrder } from './delivery-confirmation.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

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
  imports: [IonicModule, FormsModule, CommonModule, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DeliveryConfirmationComponent implements OnInit, OnDestroy {
  // Core Properties
  jobId: number | null = null;
  driverId: number | null = null;

  // properties for list view
  showList: boolean = true; // Toggle between list and details view
  activeJobs: ActiveJob[] = [];

  // properties for job details (orders for display, but OTP/confirmation per job)
  orders: JobOrder[] = [];

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
  deliveryCompletedTime: Date = new Date();

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
    { id: 'customer_absent', label: 'DELIVERY_CONFIRMATION.CUSTOMER_NOT_AVAILABLE', icon: 'person-outline' },
    { id: 'wrong_address', label: 'DELIVERY_CONFIRMATION.WRONG_UNCLEAR_ADDRESS', icon: 'location-outline' },
    { id: 'customer_refuses', label: 'DELIVERY_CONFIRMATION.CUSTOMER_REFUSES_DELIVERY', icon: 'close-circle-outline' },
    { id: 'vehicle_breakdown', label: 'DELIVERY_CONFIRMATION.VEHICLE_BREAKDOWN', icon: 'car-outline' },
    { id: 'goods_damaged', label: 'DELIVERY_CONFIRMATION.GOODS_DAMAGED_TRANSIT', icon: 'warning-outline' },
    { id: 'other', label: 'DELIVERY_CONFIRMATION.OTHER_ISSUE', icon: 'help-circle-outline' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private deliveryService: DeliveryService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private translate: TranslateService
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
      'warning-outline': warningOutline,
      'chevron-back-outline': chevronBackOutline
    });
  }

  async ngOnInit() {
    // Check authentication
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }
    this.driverId = this.authService.getUserId();

    // Get job_id from route params
    this.jobId = +this.route.snapshot.paramMap.get('jobId')! || null;

    if (this.jobId) {
      // Details view: Load orders for the job
      this.showList = false;
      await this.loadOrdersForJob();
    } else {
      // List view: Load active jobs
      this.showList = true;
      await this.loadActiveJobs();
    }
  }

  ngOnDestroy() {
    this.clearTimers();
  }

  private async loadActiveJobs() {
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('DELIVERY_CONFIRMATION.LOADING_ACTIVE_JOBS') });
    await loading.present();

    try {
      this.activeJobs = await this.deliveryService.getActiveDeliveryJobs().toPromise() || [];
    } catch (error) {
      await this.showToast(this.translate.instant('DELIVERY_CONFIRMATION.FAILED_LOAD_ACTIVE_JOBS'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async loadOrdersForJob() {
    if (!this.jobId) return;

    const loading = await this.loadingCtrl.create({ message: this.translate.instant('DELIVERY_CONFIRMATION.LOADING_JOB_ORDERS') });
    await loading.present();

    try {
      this.orders = await this.deliveryService.getOrdersInJob(this.jobId).toPromise() || [];
    } catch (error) {
      await this.showToast(this.translate.instant('DELIVERY_CONFIRMATION.FAILED_LOAD_JOB_ORDERS'), 'danger');
      this.router.navigate(['/transport/transport-dashboard']);
    } finally {
      await loading.dismiss();
    }
  }

  selectJob(job: ActiveJob) {
    this.jobId = job.job_id;
    this.showList = false;
    this.router.navigate(['/transport/delivery-confirmation', this.jobId]); // Update URL
    this.loadOrdersForJob();
  }

  async generateOTP() {
    if (!this.jobId) return;

    this.isGeneratingOTP = true;
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('DELIVERY_CONFIRMATION.GENERATING_OTP') });
    await loading.present();

    try {
      const response = await this.deliveryService.generateOTP({ job_id: this.jobId }).toPromise();
      if (response) {
        this.generatedOTP = response.otp_code; // For testing/debugging
        this.otpGenerated = true;
        this.startOtpTimer();
        this.startResendTimer();
        await this.showToast(this.translate.instant('DELIVERY_CONFIRMATION.OTP_SENT_RETAILER'), 'success');
      } else {
        await this.showToast(this.translate.instant('DELIVERY_CONFIRMATION.FAILED_GENERATE_OTP'), 'danger');
      }
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
    if (!this.isOtpComplete() || !this.jobId) return;

    if (this.otpDigits === this.generatedOTP) {
      await this.confirmDelivery(); // Automatically run confirm delivery
    } else {
      this.showOTPError();
    }
  }

  private async confirmDelivery() {
    this.isVerifyingOTP = true;
    const loading = await this.loadingCtrl.create({ message: this.translate.instant('DELIVERY_CONFIRMATION.CONFIRMING_DELIVERY') });
    await loading.present();

    try {
      await this.deliveryService.confirmDelivery({
        job_id: this.jobId!,
        otp: this.otpDigits,
      }).toPromise();

      this.deliveryConfirmed = true;
      this.deliveryCompletedTime = new Date();
      this.clearTimers();
      this.showSuccessModal = true;
      await this.showToast(this.translate.instant('DELIVERY_CONFIRMATION.DELIVERY_CONFIRMED_SUCCESS'), 'success');
    } catch (error) {
      await this.showToast(this.translate.instant('DELIVERY_CONFIRMATION.FAILED_CONFIRM_DELIVERY'), 'danger');
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
      const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  onOtpBoxKeydown(event: KeyboardEvent, index: number) {
    // Handle backspace
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits.length === 6 && /^\d{6}$/.test(this.otpDigits);
  }

  showOTPError() {
    this.otpDigits = '';  // Reset the string
    this.otpError = this.translate.instant('DELIVERY_CONFIRMATION.INVALID_OTP');  // Set error message
    setTimeout(() => {
      const firstInput = document.querySelector('input[name="otp-0"]') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }, 0);
  }

  otpExpired() {
    this.clearTimers();
    this.otpGenerated = false;
    this.otpDigits = '';  // Reset the string
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
      this.timerInterval = null;
    }
    if (this.resendTimerInterval) {
      clearInterval(this.resendTimerInterval);
      this.resendTimerInterval = null;
    }
  }

  onOtpBoxPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6) || '';
    this.otpDigits = pasted.padEnd(6, '');  // Pad to 6 characters
    // Optionally, move focus to last filled box
    const lastFilled = pasted.length > 0 ? pasted.length - 1 : 0;
    setTimeout(() => {
      const input = document.querySelector(`input[name="otp-${lastFilled}"]`) as HTMLInputElement;
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
      `${this.translate.instant('DELIVERY_CONFIRMATION.RESEND_IN')} ${this.otpResendTimer}s` :
      this.translate.instant('DELIVERY_CONFIRMATION.GENERATE_NEW_OTP');
  }

  getConditionText(condition: string): string {
    switch (condition) {
      default:
        return condition;
    }
  }

  contactCustomer() {
    this.router.navigate(['/transport/customer-chat'], {
      state: {
        orderId: this.orders.length > 0 ? this.orders[0].order_id : null, // Use first order for context
        customerName: this.orders.length > 0 ? this.orders[0].retailer_owner || 'Retailer' : '',
        customerPhone: this.orders.length > 0 ? this.orders[0].retailer_contact || '' : ''
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
      // Implement issue submission logic here (e.g., call a service)
      await this.showToast(this.translate.instant('DELIVERY_CONFIRMATION.ISSUE_REPORTED_SUCCESS'), 'success');
      this.showIssueModal = false;
    } catch (error) {
      await this.showToast(this.translate.instant('DELIVERY_CONFIRMATION.FAILED_REPORT_ISSUE'), 'danger');
    }
  }

  goToNextDelivery() {
    this.showSuccessModal = false;
    this.router.navigate(['/transport/active-deliveries']);
  }

  goToDashboard() {
    this.showSuccessModal = false;
    this.router.navigate(['/transport/transport-dashboard']);
  }

  goBack() {
    if (this.showList) {
      this.router.navigate(['/transport/active-deliveries']);
    } else {
      this.showList = true;
      this.jobId = null;
      this.orders = [];
      this.router.navigate(['/transport/delivery-confirmation']);
    }
  }

  hasMoreDeliveries(): boolean {
    // Check if driver has more deliveries
    return true; // This would come from delivery service
  }

  // Utility Methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('DELIVERY_CONFIRMATION.AUTH_REQUIRED'),
      message: this.translate.instant('DELIVERY_CONFIRMATION.LOGIN_ACCESS_PAGE'),
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

  // Public helper: Parse products JSON to DeliveryItem[]
  parseProducts(products: any): any[] {
  if (typeof products === 'string') {
    return JSON.parse(products);
  }
  return products || [];
}
}