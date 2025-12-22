import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { IonicModule, AlertController, ToastController, IonContent } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  location,
  checkmarkCircle,
  receipt,
  time,
  business,
  cube,
  key,
  documentText,
  arrowForward
} from 'ionicons/icons';

import { addIcons } from 'ionicons';


import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

declare var jsQR: any;

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  weight: string;
  qrCode: string;
  pickedUp: boolean;
  unit: string;
  condition: 'good' | 'damaged' | 'missing' | 'not_checked';
  notes?: string;
}

interface QueryType {
  id: string;
  label: string;
  icon: string;
  requiresPhoto: boolean;
}

interface QueryImage {
  id: string;
  dataUrl: string;
  fileName: string;
}

interface ScanResult {
  success: boolean;
  scannedCode: string;
  item?: OrderItem;
}

@Component({
  selector: 'app-pickup-confirmation',
  standalone: true,
  templateUrl: './pickup-confirmation.component.html',
  styleUrls: ['./pickup-confirmation.component.scss'],
  imports: [IonicModule, FormsModule, CommonModule]
})
export class PickupConfirmationComponent implements OnInit, OnDestroy {
  // Core Properties
  orderId: string = '';
  pickupConfirmed: boolean = false;
  driverNotes: string = '';

  // OTP Properties
  otp: string = '';
  otpError: string = '';
  otpVerifying: boolean = false;
  otpVerified: boolean = false;

  // Modal Controls
  showSuccessModal: boolean = false;
  showQueryModal: boolean = false;

  // Query Properties
  selectedQueryType: QueryType | null = null;
  queryDescription: string = '';

  // ViewChild References
  @ViewChild('queryModalContent') queryModalContent!: IonContent;
  @ViewChild('queryDetailsSection') queryDetailsSection!: any;
  @ViewChild('queryTextarea') queryTextarea!: any;

  // Image Arrays
  queryImages: QueryImage[] = [];

  // Data Arrays
  queryTypes: QueryType[] = [
    { id: 'packaging', label: 'Broken/Damaged Packaging', icon: 'warning-outline', requiresPhoto: true },
    { id: 'quantity', label: 'Quantity Mismatch', icon: 'warning-outline', requiresPhoto: true },
    { id: 'missing', label: 'Missing Items', icon: 'warning-outline', requiresPhoto: false },
    { id: 'damaged', label: 'Damaged Items', icon: 'warning-outline', requiresPhoto: true },
    { id: 'quality', label: 'Quality Issues', icon: 'warning-outline', requiresPhoto: true },
    { id: 'other', label: 'Other Concerns', icon: 'warning-outline', requiresPhoto: true }
  ];

  orderItems: OrderItem[] = [
    {
      id: '1', name: 'Fresh Tomatoes', quantity: 10, weight: '10 kg',
      qrCode: 'TOM001_BATCH_20241003', pickedUp: false, unit: 'kg', condition: 'not_checked'
    },
    {
      id: '2', name: 'Organic Potatoes', quantity: 15, weight: '15.5 kg',
      qrCode: 'POT002_BATCH_20241003', pickedUp: false, unit: 'kg', condition: 'not_checked'
    },
    {
      id: '3', name: 'Fresh Onions', quantity: 8, weight: '6.8 kg',
      qrCode: 'ONI003_BATCH_20241003', pickedUp: false, unit: 'kg', condition: 'not_checked'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
  location,
  checkmarkCircle,
  receipt,
  time,
  business,
  cube,
  key,
  documentText,
  arrowForward
});

  }

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '123456';
  }

  ngOnDestroy() { }

  // OTP Verification Logic
  async verifyOtp() {
    this.otpError = '';
    this.otpVerifying = true;

    // Simulate API call delay
    setTimeout(async () => {
      // For demo, assume OTP "123456" is valid
      if (this.otp === '123456') {
        this.otpVerified = true;
        this.pickupConfirmed = true;
        this.showSuccessModal = true;
      } else {
        this.otpError = 'Invalid OTP. Please check and try again.';
        this.otpVerified = false;
      }
      this.otpVerifying = false;
    }, 1200);
  }

  // General Query Methods
   raiseQuery() {
    this.reportIssue();
  }

  reportIssue() {
    this.showQueryModal = true;
    this.selectedQueryType = null;
    this.queryDescription = '';
    this.queryImages = [];
  }

  async selectQueryType(queryType: QueryType) {
    this.selectedQueryType = queryType;
    setTimeout(async () => {
      await this.scrollToDetails();
    }, 100);
  }

  async scrollToDetails() {
    if (this.queryModalContent && this.queryDetailsSection) {
      try {
        const element = this.queryDetailsSection.nativeElement;
        await this.queryModalContent.scrollToPoint(0, element.offsetTop - 20, 500);
        setTimeout(() => {
          if (this.queryTextarea && this.queryTextarea.nativeElement) {
            this.queryTextarea.nativeElement.setFocus();
          }
        }, 600);
      } catch (error) {
        console.log('Scroll error:', error);
      }
    }
  }

  onTextareaFocus() {
    setTimeout(async () => {
      if (this.queryModalContent && this.queryDetailsSection) {
        const element = this.queryDetailsSection.nativeElement;
        await this.queryModalContent.scrollToPoint(0, element.offsetTop - 50, 300);
      }
    }, 200);
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 800,
        height: 600
      });

      if (image.dataUrl) {
        this.addImageToQuery(image.dataUrl, 'camera-image');
      }
    } catch (error) {
      if (error !== 'User cancelled photos app') {
        await this.showImageError('Failed to take picture');
      }
    }
  }

  async selectFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 800,
        height: 600
      });

      if (image.dataUrl) {
        this.addImageToQuery(image.dataUrl, 'gallery-image');
      }
    } catch (error) {
      if (error !== 'User cancelled photos app') {
        await this.showImageError('Failed to select image');
      }
    }
  }

  addImageToQuery(dataUrl: string, type: string) {
    if (this.queryImages.length >= 5) {
      this.showImageLimitError();
      return;
    }

    const imageId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `query-${imageId}.jpg`;

    this.queryImages.push({
      id: imageId,
      dataUrl: dataUrl,
      fileName: fileName
    });

    this.showImageAddedToast();
  }

  removeImage(index: number) {
    this.queryImages.splice(index, 1);
  }

  async submitQuery() {
    if (!this.selectedQueryType || !this.queryDescription.trim()) {
      return;
    }

    // Check if photos are required for this query type
    if (this.selectedQueryType.requiresPhoto && this.queryImages.length === 0) {
      const toast = await this.toastCtrl.create({
        message: 'Please add at least one photo for this type of query',
        duration: 3000,
        color: 'warning',
        position: 'top',
        icon: 'warning'
      });
      await toast.present();
      return;
    }

    const queryData = {
      orderId: this.orderId,
      queryType: this.selectedQueryType.id,
      description: this.queryDescription,
      images: this.queryImages.map(img => ({
        fileName: img.fileName,
        dataUrl: img.dataUrl
      })),
      timestamp: new Date().toISOString()
    };

    console.log('Submitting query:', queryData);

    // Handle different query types
    if (this.selectedQueryType.id === 'missing' || this.selectedQueryType.id === 'damaged') {
      await this.handleItemIssueQuery();
    }

    const toast = await this.toastCtrl.create({
      message: `Query "${this.selectedQueryType.label}" submitted successfully${this.queryImages.length > 0 ? ` with ${this.queryImages.length} image(s)` : ''}`,
      duration: 3000,
      color: 'success',
      position: 'top',
      icon: 'checkmark-circle'
    });
    await toast.present();

    this.showQueryModal = false;
    this.selectedQueryType = null;
    this.queryDescription = '';
    this.queryImages = [];
  }

  async handleItemIssueQuery() {
    // For missing or damaged items, show item selection
    const alert = await this.alertCtrl.create({
      header: 'Select Affected Items',
      message: 'Which items are affected by this issue?',
      inputs: this.orderItems.map(item => ({
        name: item.id,
        type: 'checkbox',
        label: item.name,
        value: item.id,
        checked: false
      })),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Apply',
          handler: (selectedIds: string[]) => {
            selectedIds.forEach(itemId => {
              const item = this.orderItems.find(i => i.id === itemId);
              if (item) {
                item.pickedUp = true;
                item.condition = this.selectedQueryType?.id === 'missing' ? 'missing' : 'damaged';
                item.notes = `${this.selectedQueryType?.label}: ${this.queryDescription}`;
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // Toast Messages
  async showImageError(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: 'danger',
      position: 'top',
      icon: 'alert-circle'
    });
    await toast.present();
  }

  async showImageLimitError() {
    const toast = await this.toastCtrl.create({
      message: 'Maximum 5 images allowed per query',
      duration: 2000,
      color: 'warning',
      position: 'top',
      icon: 'warning'
    });
    await toast.present();
  }

  async showImageAddedToast() {
    const toast = await this.toastCtrl.create({
      message: 'Image added',
      duration: 1500,
      color: 'success',
      position: 'top',
      icon: 'checkmark'
    });
    await toast.present();
  }

  async showScannerError() {
    const alert = await this.alertCtrl.create({
      header: 'Scanner Error',
      message: 'Unable to access camera. Please try again.',
      buttons: ['OK']
    });
    await alert.present();
  }

  // Helper Methods
  getPickupProgress(): number {
    const pickedUpCount = this.orderItems.filter(item => item.pickedUp).length;
    return Math.round((pickedUpCount / this.orderItems.length) * 100);
  }

  areAllItemsPickedUp(): boolean {
    return this.orderItems.every(item => item.pickedUp);
  }

  resetPickedItems() {
    this.orderItems.forEach(item => {
      item.pickedUp = false;
      item.condition = 'not_checked';
      item.notes = undefined;
    });
  }

  getItemIconName(item: OrderItem): string {
    if (!item.pickedUp) return 'ellipse-outline';

    switch (item.condition) {
      case 'good': return 'checkmark-circle';
      case 'damaged': return 'warning';
      case 'missing': return 'remove-circle';
      default: return 'ellipse-outline';
    }
  }

  getStatusClass(condition: string): string {
    switch (condition) {
      case 'good': return 'status-good';
      case 'damaged': return 'status-damaged';
      case 'missing': return 'status-missing';
      default: return '';
    }
  }

  getStatusIcon(condition: string): string {
    switch (condition) {
      case 'good': return 'checkmark-circle';
      case 'damaged': return 'warning';
      case 'missing': return 'remove-circle';
      default: return 'ellipse-outline';
    }
  }

  getStatusText(condition: string): string {
    switch (condition) {
      case 'good': return 'Good';
      case 'damaged': return 'Issues';
      case 'missing': return 'Missing';
      default: return 'Pending';
    }
  }

  getIssueIcon(condition: string): string {
    switch (condition) {
      case 'damaged': return '⚠️';
      case 'missing': return '❌';
      default: return '';
    }
  }

  // Navigation Methods
  goBack() {
    this.router.navigate(['/transport/dashboard']);
  }

  goToDelivery() {
    this.showSuccessModal = false;
    this.router.navigate(['/transport/delivery-confirmation', this.orderId]);
  }

  goToDashboard() {
    this.showSuccessModal = false;
    this.router.navigate(['/transport/dashboard']);
  }

  addQuickNote(note: string) {
    if (this.driverNotes) {
      this.driverNotes += ', ' + note;
    } else {
      this.driverNotes = note;
    }
  }
}