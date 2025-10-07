import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, IonContent } from '@ionic/angular';
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

interface DeliveryItem {
  id: string;
  name: string;
  quantity: number;
  weight: string;
  qrCode: string;
  unit: string;
  pickupCondition: 'good' | 'damaged' | 'not_checked';
}

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
  imports: [IonicModule, FormsModule, CommonModule]
})
export class DeliveryConfirmationComponent implements OnInit, OnDestroy {
  // Core Properties
  orderId: string = 'ORD-2024-001';
  retailerName: string = 'Green Valley Retail Store';
  retailerPhone: string = '+91 98765 43210';
  deliveryAddress: string = 'Shop No. 15, Green Market\nSector 21, Navi Mumbai - 400709';

  // OTP Properties
  otpGenerated: boolean = false;
  otpDigits: string[] = ['', '', '', ''];
  otpTimer: number = 600; // 10 minutes in seconds
  otpResendTimer: number = 30;
  isOtpResendDisabled: boolean = true;
  isGeneratingOTP: boolean = false;
  isVerifyingOTP: boolean = false;
  generatedOTP: string = '';

  // Delivery Properties
  deliveryConfirmed: boolean = false;
  deliveryNotes: string = '';
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

  // Sample delivery items - removed deliveryCondition and deliveryNotes
  deliveryItems: DeliveryItem[] = [
    {
      id: '1',
      name: 'Fresh Tomatoes',
      quantity: 10,
      weight: '10 kg',
      qrCode: 'TOM001_BATCH_20241003',
      unit: 'kg',
      pickupCondition: 'good'
    },
    {
      id: '2',
      name: 'Organic Potatoes',
      quantity: 15,
      weight: '15 kg',
      qrCode: 'POT002_BATCH_20241003',
      unit: 'kg',
      pickupCondition: 'good'
    },
    {
      id: '3',
      name: 'Fresh Onions',
      quantity: 8,
      weight: '8 kg',
      qrCode: 'ONI003_BATCH_20241003',
      unit: 'kg',
      pickupCondition: 'good'
    }
  ];

  deliveryIssueTypes: DeliveryIssueType[] = [
    { id: 'customer_absent', label: 'Customer Not Available', icon: 'person-outline' },
    { id: 'wrong_address', label: 'Wrong/Unclear Address', icon: 'location-outline' },
    { id: 'customer_refuses', label: 'Customer Refuses Delivery', icon: 'close-circle-outline' },
    { id: 'vehicle_breakdown', label: 'Vehicle Breakdown', icon: 'car-outline' },
    { id: 'goods_damaged', label: 'Goods Damaged in Transit', icon: 'warning-outline' },
    { id: 'other', label: 'Other Issue', icon: 'help-circle-outline' }
  ];

  constructor(private router: Router) {
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

  ngOnInit() {
    // Initialize component
  }

  ngOnDestroy() {
    this.clearTimers();
  }

  // OTP Methods
  async generateOTP() {
    this.isGeneratingOTP = true;

    try {
      // Simulate API call to generate OTP
      await this.delay(1500);

      // Generate 4-digit OTP
      this.generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
      this.otpGenerated = true;

      // Start OTP timer
      this.startOtpTimer();
      this.startResendTimer();

      console.log('Generated OTP:', this.generatedOTP); // For testing

    } catch (error) {
      console.error('Error generating OTP:', error);
    } finally {
      this.isGeneratingOTP = false;
    }
  }

  async regenerateOTP() {
    this.isGeneratingOTP = true;
    this.clearTimers();

    try {
      await this.delay(1000);

      // Generate new OTP
      this.generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
      this.otpTimer = 600; // Reset to 10 minutes
      this.otpDigits = ['', '', '', ''];

      // Restart timers
      this.startOtpTimer();
      this.startResendTimer();

      console.log('New OTP:', this.generatedOTP); // For testing

    } catch (error) {
      console.error('Error regenerating OTP:', error);
    } finally {
      this.isGeneratingOTP = false;
    }
  }

  async verifyOTP() {
    this.isVerifyingOTP = true;
    const enteredOTP = this.otpDigits.join('');

    try {
      await this.delay(1500);

      if (enteredOTP === this.generatedOTP) {
        // OTP is correct
        this.deliveryConfirmed = true;
        this.deliveryCompletedTime = new Date();
        this.clearTimers();
        this.showSuccessModal = true;
      } else {
        // OTP is incorrect
        this.showOTPError();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
    } finally {
      this.isVerifyingOTP = false;
    }
  }

  showOTPError() {
    // Reset OTP digits
    this.otpDigits = ['', '', '', ''];

    // You can show a toast or alert here
    console.log('Invalid OTP entered');
  }

  // OTP Input Handlers
  onOtpInput(event: any, index: number) {
    const value = event.target.value;

    if (value && value.length === 1 && /^\d$/.test(value)) {
      this.otpDigits[index] = value;

      // Move to next input
      if (index < 3) {
        const nextInput = document.querySelectorAll('.otp-digit')[index + 1] as HTMLElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  }

  onOtpKeydown(event: any, index: number) {
    // Handle backspace
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.querySelectorAll('.otp-digit')[index - 1] as HTMLElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every(digit => digit !== '');
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

  otpExpired() {
    this.clearTimers();
    this.otpGenerated = false;
    this.otpDigits = ['', '', '', ''];
    console.log('OTP expired');
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

  // Helper Methods - removed getTotalItems() and getTotalWeight()
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
}