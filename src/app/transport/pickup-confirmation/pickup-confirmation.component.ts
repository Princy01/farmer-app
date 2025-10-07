import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { IonicModule, AlertController, ToastController, IonContent } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  chevronBack, helpCircleOutline, checkmarkDoneCircle, location,
  checkmarkCircle, receipt, storefront, call, cube,
  documentText, checkmarkDone, warning, arrowForward, refresh,
  qrCodeOutline, scanOutline, checkmark, close,
  ellipseOutline, business, time, send, alertCircle,
  warningOutline, removeCircleOutline, camera, images,
  informationCircle, removeCircle, closeCircle
} from 'ionicons/icons';

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
  isScanning: boolean = false;
  pickupConfirmed: boolean = false;
  driverNotes: string = '';

  // Modal Controls
  showSuccessModal: boolean = false;
  showQueryModal: boolean = false;
  showScanResultsModal: boolean = false;

  // Query Properties
  selectedQueryType: QueryType | null = null;
  queryDescription: string = '';

  // Scan Results
  scanResult: ScanResult | null = null;

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
      chevronBack, helpCircleOutline, checkmarkDoneCircle, location,
      checkmarkCircle, receipt, storefront, call, cube,
      documentText, checkmarkDone, warning, arrowForward, refresh,
      qrCodeOutline, scanOutline, checkmark, close,
      ellipseOutline, business, time, send, alertCircle,
      warningOutline, removeCircleOutline, camera, images,
      informationCircle, removeCircle, closeCircle
    });
  }

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '123456';
    this.loadQRLibrary();
  }

  ngOnDestroy() { }

  // QR Library Setup
  async loadQRLibrary() {
    if (!Capacitor.isNativePlatform()) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      document.head.appendChild(script);
    }
  }

  // QR Scanning Methods
  async scanQRCode() {
    try {
      this.isScanning = true;

      if (Capacitor.isNativePlatform()) {
        await this.scanWithNativeCamera();
      } else {
        await this.scanWithWebCamera();
      }
    } catch (error) {
      console.error('QR Scanner error:', error);
      await this.showScannerError();
    } finally {
      this.isScanning = false;
    }
  }

  async scanWithNativeCamera() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        await this.processScannedImage(image.dataUrl);
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        throw error;
      }
    }
  }

  async scanWithWebCamera() {
    const alert = await this.alertCtrl.create({
      header: 'Scan QR Code',
      message: 'Choose scanning method:',
      buttons: [
        {
          text: 'Take Photo',
          handler: async () => { await this.takePhotoWeb(); }
        },
        {
          text: 'Upload Image',
          handler: async () => { await this.uploadImageWeb(); }
        },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await alert.present();
  }

  async takePhotoWeb() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        await this.processScannedImage(image.dataUrl);
      }
    } catch (error) {
      await this.showScannerError();
    }
  }

  async uploadImageWeb() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e: any) => {
          await this.processScannedImage(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  async processScannedImage(dataUrl: string) {
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
            this.handleScannedCode(code.data);
          } else {
            this.handleScanFailure('NO_QR_FOUND');
          }
        } else {
          // Simulate detection for testing - use first unscanned item
          const firstUnscannedItem = this.orderItems.find(item => !item.pickedUp);
          if (firstUnscannedItem) {
            this.handleScannedCode(firstUnscannedItem.qrCode);
          } else {
            this.handleScanFailure('NO_QR_FOUND');
          }
        }
      };

      img.onerror = () => {
        this.handleScanFailure('IMAGE_ERROR');
      };

      img.src = dataUrl;
    } catch (error) {
      this.handleScanFailure('PROCESSING_ERROR');
    }
  }

  handleScannedCode(scannedCode: string) {
    const matchedItem = this.orderItems.find(item => item.qrCode === scannedCode);

    if (matchedItem) {
      if (matchedItem.pickedUp) {
        this.scanResult = {
          success: false,
          scannedCode: scannedCode,
          item: matchedItem
        };
        this.showAlreadyScannedResult(matchedItem);
      } else {
        matchedItem.pickedUp = true;
        matchedItem.condition = 'good';
        this.scanResult = {
          success: true,
          scannedCode: scannedCode,
          item: matchedItem
        };
        this.showScanResultsModal = true;
      }
    } else {
      this.scanResult = {
        success: false,
        scannedCode: scannedCode
      };
      this.showScanResultsModal = true;
    }
  }

  handleScanFailure(reason: string) {
    this.scanResult = {
      success: false,
      scannedCode: 'No QR code detected'
    };
    this.showScanResultsModal = true;
  }

  async showAlreadyScannedResult(item: OrderItem) {
    const toast = await this.toastCtrl.create({
      message: `${item.name} has already been scanned and picked up.`,
      duration: 3000,
      color: 'warning',
      position: 'top',
      icon: 'warning'
    });
    await toast.present();
  }

  continueScanningAfterSuccess() {
    this.showScanResultsModal = false;
    this.scanResult = null;

    // Check if all items are scanned
    if (!this.areAllItemsPickedUp()) {
      // Continue scanning automatically
      setTimeout(() => {
        this.scanQRCode();
      }, 500);
    }
  }

  retryScan() {
    this.showScanResultsModal = false;
    this.scanResult = null;
    setTimeout(() => {
      this.scanQRCode();
    }, 500);
  }

  reportScanIssue() {
    this.showScanResultsModal = false;
    this.scanResult = null;
    this.raiseQuery();
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

  async confirmPickup() {
    if (!this.areAllItemsPickedUp()) {
      const alert = await this.alertCtrl.create({
        header: 'Incomplete Pickup',
        message: 'Please scan all items or report issues before confirming pickup.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const damagedItems = this.orderItems.filter(item => item.condition === 'damaged');
    const missingItems = this.orderItems.filter(item => item.condition === 'missing');

    let message = 'Confirm that you have completed the pickup process?';

    if (damagedItems.length > 0 || missingItems.length > 0) {
      message += '\n\n';
      if (damagedItems.length > 0) {
        message += `${damagedItems.length} item(s) reported with issues. `;
      }
      if (missingItems.length > 0) {
        message += `${missingItems.length} item(s) marked as missing.`;
      }
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirm Pickup',
      message: message,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm Pickup',
          handler: () => { this.submitPickup(); }
        }
      ]
    });
    await alert.present();
  }

  async submitPickup() {
    this.pickupConfirmed = true;
    this.showSuccessModal = true;
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