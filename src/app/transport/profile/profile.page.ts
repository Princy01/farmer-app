import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  IonicModule,
  NavController,
  AlertController,
  LoadingController,
  ToastController
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  personOutline, mailOutline, callOutline, locationOutline,
  carOutline, arrowBackOutline, createOutline, saveOutline,
  closeOutline, cameraOutline, imageOutline, checkmarkCircleOutline,
  cardOutline, calendarOutline
} from 'ionicons/icons';

import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

interface DriverProfile {
  driver_id: number;
  name: string;
  email: string;
  mobile_num: string;
  address: string;
  pincode: string;
  state_id: number;
  state_name: string;
  location_id: number;
  location_name: string;
  registration_date: string;
  active_status: boolean;
  license_number: string;
  vehicle_type: string;
  vehicle_number: string;
  total_deliveries: number;
  profile_image?: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class ProfilePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  profile: DriverProfile = {
    driver_id: 0,
    name: '',
    email: '',
    mobile_num: '',
    address: '',
    pincode: '',
    state_id: 0,
    state_name: '',
    location_id: 0,
    location_name: '',
    registration_date: '',
    active_status: true,
    license_number: '',
    vehicle_type: '',
    vehicle_number: '',
    total_deliveries: 0
  };

  isEditing = false;
  isLoading = false;

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private translate: TranslateService
  ) {
    addIcons({
      personOutline, mailOutline, callOutline, locationOutline,
      carOutline, arrowBackOutline, createOutline, saveOutline,
      closeOutline, cameraOutline, imageOutline, checkmarkCircleOutline,
      cardOutline, calendarOutline
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadProfile() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    this.isLoading = true;

    // Using dummy data - replace with actual API call
    setTimeout(() => {
      this.profile = {
        driver_id: 1,
        name: 'Ramesh Kumar',
        email: 'ramesh.driver@example.com',
        mobile_num: '+91 98765 43210',
        address: '123, Driver Colony, Mayur Vihar',
        pincode: '110091',
        state_id: 7,
        state_name: 'Delhi',
        location_id: 45,
        location_name: 'Mayur Vihar',
        registration_date: '2023-03-20',
        active_status: true,
        license_number: 'DL-1420110012345',
        vehicle_type: 'Truck',
        vehicle_number: 'DL-1CAA-1234',
        total_deliveries: 456,
        profile_image: undefined
      };
      this.isLoading = false;
    }, 500);
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  async saveProfile() {
    if (!this.validateProfile()) {
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('DRIVER_PROFILE.SAVING')
    });
    await loading.present();

    // Simulate API call
    setTimeout(async () => {
      await loading.dismiss();
      this.isEditing = false;

      const toast = await this.toastCtrl.create({
        message: this.translate.instant('DRIVER_PROFILE.SAVE_SUCCESS'),
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    }, 1000);
  }

  validateProfile(): boolean {
    if (!this.profile.name || !this.profile.email || !this.profile.mobile_num) {
      this.showErrorAlert(
        this.translate.instant('DRIVER_PROFILE.VALIDATION_ERROR'),
        this.translate.instant('DRIVER_PROFILE.REQUIRED_FIELDS')
      );
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.profile.email)) {
      this.showErrorAlert(
        this.translate.instant('DRIVER_PROFILE.VALIDATION_ERROR'),
        this.translate.instant('DRIVER_PROFILE.INVALID_EMAIL')
      );
      return false;
    }

    return true;
  }

  async changeProfileImage() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('DRIVER_PROFILE.CHANGE_IMAGE'),
      message: this.translate.instant('DRIVER_PROFILE.IMAGE_SOURCE'),
      buttons: [
        {
          text: this.translate.instant('DRIVER_PROFILE.CAMERA'),
          handler: () => {
            this.captureImage();
          }
        },
        {
          text: this.translate.instant('DRIVER_PROFILE.GALLERY'),
          handler: () => {
            this.selectImage();
          }
        },
        {
          text: this.translate.instant('DRIVER_PROFILE.CANCEL'),
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  captureImage() {
    console.log('Capture image from camera');
  }

  selectImage() {
    console.log('Select image from gallery');
  }

  goBack() {
    this.navCtrl.back();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('DRIVER_PROFILE.AUTH_ERROR'),
      message: this.translate.instant('DRIVER_PROFILE.SESSION_EXPIRED'),
      buttons: [{
        text: this.translate.instant('DRIVER_PROFILE.OK'),
        handler: () => {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }]
    });
    await alert.present();
  }

  private async showErrorAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [this.translate.instant('DRIVER_PROFILE.OK')]
    });
    await alert.present();
  }
}
