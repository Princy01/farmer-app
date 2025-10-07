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
  documentText, checkmarkDone, star, warning, headset, arrowForward, refresh,
  chatbubbles, qrCodeOutline, scanOutline, checkmark, close, createOutline,
  ellipseOutline, checkmarkDoneCircle as checkmarkDone2
} from 'ionicons/icons';

// Cross-platform QR Scanner imports
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

// QR Code detection library for web
declare var jsQR: any;

interface DeliveryItem {
  id: string;
  name: string;
  quantity: number;
  weight: string;
  qrCode: string;
  scanned: boolean;
  unit: string;
  pickupCondition: 'good' | 'damaged' | 'not_checked';
  deliveryCondition: 'good' | 'damaged' | 'not_checked';
  pickupNotes?: string;
  deliveryNotes?: string;
}

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

  // QR Scanner properties
  isScanning: boolean = false;
  showScanner: boolean = false;
  scannedItems: string[] = [];
  deliveryItems: DeliveryItem[] = [
    {
      id: '1',
      name: 'Fresh Tomatoes',
      quantity: 10,
      weight: '5.2 kg',
      qrCode: 'TOM001_BATCH_20241003',
      scanned: false,
      unit: 'kg',
      pickupCondition: 'good', // From pickup stage
      deliveryCondition: 'not_checked',
      pickupNotes: ''
    },
    {
      id: '2',
      name: 'Organic Potatoes',
      quantity: 15,
      weight: '12.5 kg',
      qrCode: 'POT002_BATCH_20241003',
      scanned: false,
      unit: 'kg',
      pickupCondition: 'good', // From pickup stage
      deliveryCondition: 'not_checked',
      pickupNotes: ''
    },
    {
      id: '3',
      name: 'Fresh Onions',
      quantity: 8,
      weight: '7.8 kg',
      qrCode: 'ONI003_BATCH_20241003',
      scanned: false,
      unit: 'kg',
      pickupCondition: 'good', // From pickup stage
      deliveryCondition: 'not_checked',
      pickupNotes: ''
    }
  ];

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
      documentText, checkmarkDone, star, warning, headset, arrowForward, refresh,
      chatbubbles, qrCodeOutline, scanOutline, checkmark, close, createOutline,
      ellipseOutline, checkmarkDone2
    });
  }

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '123456';
    this.getOrderDetails();
    this.loadQRLibrary();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // Load QR detection library for web platform
  async loadQRLibrary() {
    if (!Capacitor.isNativePlatform()) {
      // Load jsQR library for web
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.onload = () => {
        console.log('QR library loaded for web platform');
      };
      script.onerror = () => {
        console.warn('Could not load QR library, using fallback');
      };
      document.head.appendChild(script);
    }
  }

  // Start QR Scanner - Cross Platform
  async startQRScanner() {
    try {
      this.isScanning = true;

      if (Capacitor.isNativePlatform()) {
        // Native platform - use camera
        await this.scanWithNativeCamera();
      } else {
        // Web platform - use file input or web camera
        await this.scanWithWebCamera();
      }
    } catch (error) {
      console.error('QR Scanner error:', error);
      await this.showScannerError();
    } finally {
      this.isScanning = false;
    }
  }

  // Native camera scanning
  async scanWithNativeCamera() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        promptLabelHeader: 'Scan QR Code',
        promptLabelCancel: 'Cancel',
        promptLabelPhoto: 'Take Photo'
      });

      if (image.dataUrl) {
        await this.processImageForQR(image.dataUrl);
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        throw error;
      }
    }
  }

  // Web camera scanning
  async scanWithWebCamera() {
    const alert = await this.alertCtrl.create({
      header: 'Scan QR Code',
      message: 'Choose scanning method:',
      buttons: [
        {
          text: 'Take Photo',
          handler: async () => {
            await this.takePhotoWeb();
          }
        },
        {
          text: 'Upload Image',
          handler: async () => {
            await this.uploadImageWeb();
          }
        },
        {
          text: 'Manual Entry',
          handler: () => {
            this.enterQRManually();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  // Take photo on web
  async takePhotoWeb() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        await this.processImageForQR(image.dataUrl);
      }
    } catch (error) {
      console.error('Web camera error:', error);
      this.enterQRManually();
    }
  }

  // Upload image on web
  async uploadImageWeb() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e: any) => {
          await this.processImageForQR(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  // Process image to detect QR code
  async processImageForQR(dataUrl: string) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

        if (imageData && typeof jsQR !== 'undefined') {
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            this.processScannedCode(code.data);
          } else {
            this.showNoQRFoundAlert();
          }
        } else {
          // Fallback for native or if jsQR not loaded
          this.simulateQRDetection();
        }
      };

      img.onerror = () => {
        this.showNoQRFoundAlert();
      };

      img.src = dataUrl;
    } catch (error) {
      console.error('QR processing error:', error);
      this.showNoQRFoundAlert();
    }
  }

  // Simulate QR detection (fallback for testing)
  simulateQRDetection() {
    const unscannedItems = this.deliveryItems.filter(item => !item.scanned);
    if (unscannedItems.length > 0) {
      const randomItem = unscannedItems[Math.floor(Math.random() * unscannedItems.length)];
      this.processScannedCode(randomItem.qrCode);
    } else {
      this.showNoQRFoundAlert();
    }
  }

  // Process scanned QR code
  async processScannedCode(scannedCode: string) {
    const item = this.deliveryItems.find(item => item.qrCode === scannedCode);

    if (item) {
      if (item.scanned) {
        await this.showAlreadyScannedAlert(item);
      } else {
        // Show delivery condition check
        await this.showDeliveryConditionCheckAlert(item);
      }
    } else {
      await this.showInvalidQRAlert(scannedCode);
    }
  }

  async showDeliveryConditionCheckAlert(item: DeliveryItem) {
    let message = `Verify condition of ${item.name} for delivery:`;

    if (item.pickupCondition === 'damaged') {
      message += `\n\n⚠️ Note: This item was reported as damaged during pickup.`;
    }

    const alert = await this.alertCtrl.create({
      header: `Delivery Check: ${item.name}`,
      message: message,
      inputs: [
        {
          name: 'condition',
          type: 'radio',
          label: 'Good Condition',
          value: 'good',
          checked: true
        },
        {
          name: 'condition',
          type: 'radio',
          label: 'Damaged/Issues',
          value: 'damaged'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm Delivery',
          handler: async (data) => {
            item.deliveryCondition = data;
            item.scanned = true;

            if (data === 'damaged') {
              await this.addDeliveryDamageNotes(item);
            } else {
              await this.showSuccessfulScanToast(item);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async addDeliveryDamageNotes(item: DeliveryItem) {
    const alert = await this.alertCtrl.create({
      header: 'Report Delivery Damage',
      message: `Describe the issues with ${item.name} at delivery:`,
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Describe the damage or issues...'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            item.scanned = false;
            item.deliveryCondition = 'not_checked';
          }
        },
        {
          text: 'Report & Continue',
          handler: async (data) => {
            item.deliveryNotes = data.notes;
            await this.showDeliveryDamageReportedToast(item);
          }
        }
      ]
    });
    await alert.present();
  }

  async showDeliveryDamageReportedToast(item: DeliveryItem) {
    const toast = await this.toastCtrl.create({
      message: `⚠️ ${item.name} delivery damage reported`,
      duration: 3000,
      color: 'warning',
      position: 'top',
      icon: 'warning'
    });
    await toast.present();
  }

  getDeliveryDamagedItemsCount(): number {
    return this.deliveryItems.filter(item => item.deliveryCondition === 'damaged').length;
  }

  // Manual QR code entry
  async enterQRManually() {
    const alert = await this.alertCtrl.create({
      header: 'Enter QR Code',
      message: 'Manually enter the QR code from the package:',
      inputs: [
        {
          name: 'qrCode',
          type: 'text',
          placeholder: 'Enter QR code...',
          attributes: {
            maxlength: 50
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Verify',
          handler: (data) => {
            if (data.qrCode?.trim()) {
              this.processScannedCode(data.qrCode.trim());
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // Alert handlers
  async showSuccessfulScanToast(item: DeliveryItem) {
    const toast = await this.toastCtrl.create({
      message: `✓ ${item.name} verified successfully!`,
      duration: 2000,
      color: 'success',
      position: 'top',
      icon: 'checkmark-circle'
    });
    await toast.present();
  }

  async showAlreadyScannedAlert(item: DeliveryItem) {
    const alert = await this.alertCtrl.create({
      header: 'Already Scanned',
      message: `${item.name} has already been verified.`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showInvalidQRAlert(scannedCode: string) {
    const alert = await this.alertCtrl.create({
      header: 'Invalid QR Code',
      message: `The scanned QR code "${scannedCode}" does not match any items in this delivery.`,
      buttons: [
        {
          text: 'Scan Again',
          handler: () => {
            this.startQRScanner();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  async showNoQRFoundAlert() {
    const alert = await this.alertCtrl.create({
      header: 'No QR Code Found',
      message: 'Could not detect a QR code in the image. Please try again or enter manually.',
      buttons: [
        {
          text: 'Try Again',
          handler: () => {
            this.startQRScanner();
          }
        },
        {
          text: 'Manual Entry',
          handler: () => {
            this.enterQRManually();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  async showScannerError() {
    const alert = await this.alertCtrl.create({
      header: 'Scanner Error',
      message: 'Unable to access camera. Please try manual entry.',
      buttons: [
        {
          text: 'Manual Entry',
          handler: () => {
            this.enterQRManually();
          }
        },
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  // Get scanning progress
  getScanProgress(): number {
    const scannedCount = this.deliveryItems.filter(item => item.scanned).length;
    return Math.round((scannedCount / this.deliveryItems.length) * 100);
  }

  // Check if all items are scanned
  areAllItemsScanned(): boolean {
    return this.deliveryItems.every(item => item.scanned);
  }

  // Reset scanned items (for testing)
  resetScannedItems() {
    this.deliveryItems.forEach(item => item.scanned = false);
    this.scannedItems = [];
  }

  // Existing methods
  goBack() {
    this.router.navigate(['/transport/dashboard']);
  }

  getOrderDetails() {
    this.phoneNumber = '+91 98765 43210';
  }

  async sendOtpToCustomer() {
    if (this.otpSent) return;

    if (!this.areAllItemsScanned()) {
      const alert = await this.alertCtrl.create({
        header: 'Incomplete Verification',
        message: 'Please scan all delivery items before sending OTP to customer.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

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

      if (value && index < 3) {
        const nextInput = document.querySelectorAll('.otp-digit')[index + 1] as HTMLElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  }

  canConfirmDelivery(): boolean {
    return this.areAllItemsScanned() && this.otpSent && this.otp.length === 4;
  }

  async submitDelivery() {
    if (!this.areAllItemsScanned()) {
      const alert = await this.alertCtrl.create({
        header: 'Incomplete Verification',
        message: 'Please scan all delivery items before confirming delivery.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (!this.canConfirmDelivery()) {
      const alert = await this.alertCtrl.create({
        header: 'Invalid OTP',
        message: 'Please enter the complete 4-digit OTP received from customer.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

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