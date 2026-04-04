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
import { HttpErrorResponse } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  personOutline, mailOutline, callOutline, locationOutline,
  businessOutline, arrowBackOutline, createOutline, saveOutline,
  closeOutline, cameraOutline, imageOutline, checkmarkCircleOutline,
  storefrontOutline, cardOutline, locateOutline, calendarOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { AuthService } from 'src/app/auth/auth.service';
import { RetailerProfile, RetailerProfileService, UpdateUserProfileRequest } from './profile.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class ProfilePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  profile: RetailerProfile = {
    id: 0,
    name: '',
    email: '',
    mobile: '',
    address: '',
    location_id: null,
    location: '',
    state_id: null,
    state_name: '',
    city_id: null,
    city_name: '',
    pincode: '',
    status: 'inactive',
    member_since: '',
    total_branches: 0
  };

  isEditing = false;
  isLoading = false;
  profileImage: string | null = null;

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private translate: TranslateService,
    private retailerProfileService: RetailerProfileService
  ) {
    addIcons({
      personOutline, mailOutline, callOutline, locationOutline,
      businessOutline, arrowBackOutline, createOutline, saveOutline,
      closeOutline, cameraOutline, imageOutline, checkmarkCircleOutline,
      storefrontOutline, cardOutline, locateOutline, calendarOutline
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

    this.retailerProfileService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile: RetailerProfile) => {
          this.profile = {
            ...profile,
            email: profile.email ?? '',
            mobile: profile.mobile ?? '',
            address: profile.address ?? '',
            location: profile.location ?? '',
            state_name: profile.state_name ?? '',
            city_name: profile.city_name ?? '',
            pincode: profile.pincode ?? '',
            status: profile.status ?? 'inactive',
            member_since: profile.member_since ?? ''
          };
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.handleProfileLoadError(error);
        }
      });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  async saveProfile() {
    if (!this.validateProfile()) {
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_PROFILE.SAVING')
    });
    await loading.present();

    const profileData: UpdateUserProfileRequest = {
      name: this.profile.name,
      email: this.profile.email ?? '',
      mobile: this.profile.mobile ?? '',
      address: this.profile.address ?? '',
      state_name: this.profile.state_name ?? '',
      city_name: this.profile.city_name ?? '',
      location_name: this.profile.location ?? '',
      pincode: this.profile.pincode ?? ''
    };

    this.retailerProfileService.updateProfile(profileData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          await loading.dismiss();
          this.isEditing = false;
          const toast = await this.toastCtrl.create({
            message: this.translate.instant('RETAILER_PROFILE.SAVE_SUCCESS'),
            duration: 2000,
            color: 'success',
            position: 'top'
          });
          await toast.present();
        },
        error: async (error: HttpErrorResponse) => {
          await loading.dismiss();
          this.handleProfileSaveError(error);
        }
      });
  }

  validateProfile(): boolean {
    if (!this.profile.name || !this.profile.email || !this.profile.mobile) {
      const alert = this.alertCtrl.create({
        header: this.translate.instant('RETAILER_PROFILE.VALIDATION_ERROR'),
        message: this.translate.instant('RETAILER_PROFILE.REQUIRED_FIELDS'),
        buttons: [this.translate.instant('RETAILER_PROFILE.OK')]
      });
      alert.then(a => a.present());
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.profile.email)) {
      const alert = this.alertCtrl.create({
        header: this.translate.instant('RETAILER_PROFILE.VALIDATION_ERROR'),
        message: this.translate.instant('RETAILER_PROFILE.INVALID_EMAIL'),
        buttons: [this.translate.instant('RETAILER_PROFILE.OK')]
      });
      alert.then(a => a.present());
      return false;
    }

    return true;
  }

  isProfileActive(): boolean {
    return this.profile.status?.toLowerCase?.() === 'active';
  }

  async changeProfileImage() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_PROFILE.CHANGE_IMAGE'),
      message: this.translate.instant('RETAILER_PROFILE.IMAGE_SOURCE'),
      buttons: [
        {
          text: this.translate.instant('RETAILER_PROFILE.CAMERA'),
          handler: () => {
            this.captureImage();
          }
        },
        {
          text: this.translate.instant('RETAILER_PROFILE.GALLERY'),
          handler: () => {
            this.selectImage();
          }
        },
        {
          text: this.translate.instant('RETAILER_PROFILE.CANCEL'),
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  async captureImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      if (image.base64String) {
        await this.uploadImage(image.base64String);
      }
    } catch (error: any) {
      if (error?.message?.includes('User cancelled')) {
        return;
      }
      this.showErrorAlert(
        this.translate.instant('RETAILER_PROFILE.ERROR'),
        this.translate.instant('RETAILER_PROFILE.CAMERA_FAILED')
      );
    }
  }

  async selectImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });
      if (image.base64String) {
        await this.uploadImage(image.base64String);
      }
    } catch (error: any) {
      if (error?.message?.includes('User cancelled')) {
        return;
      }
      this.showErrorAlert(
        this.translate.instant('RETAILER_PROFILE.ERROR'),
        this.translate.instant('RETAILER_PROFILE.GALLERY_FAILED')
      );
    }
  }

  async uploadImage(base64: string) {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_PROFILE.UPLOADING')
    });
    await loading.present();
    this.isLoading = true;

    this.retailerProfileService.uploadProfileImage(base64)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response: any) => {
          this.isLoading = false;
          await loading.dismiss();
          this.loadProfile();
          const toast = await this.toastCtrl.create({
            message: response.message || this.translate.instant('RETAILER_PROFILE.IMAGE_UPDATED'),
            duration: 2000,
            color: 'success',
            position: 'top'
          });
          await toast.present();
        },
        error: async (error: any) => {
          this.isLoading = false;
          await loading.dismiss();
          const errorMessage = error?.message || 'RETAILER_PROFILE.UPLOAD_FAILED';
          this.showErrorAlert(
            this.translate.instant('RETAILER_PROFILE.ERROR'),
            this.translate.instant(errorMessage)
          );
        }
      });
  }

  getImageSrc(image: string | null | undefined): string {
    if (!image) return '';
    if (image.startsWith('data:')) return image;
    return `data:image/jpeg;base64,${image}`;
  }

  goBack() {
    this.navCtrl.back();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_PROFILE.AUTH_ERROR'),
      message: this.translate.instant('RETAILER_PROFILE.SESSION_EXPIRED'),
      buttons: [{
        text: this.translate.instant('RETAILER_PROFILE.OK'),
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
      buttons: [this.translate.instant('RETAILER_PROFILE.OK')]
    });
    await alert.present();
  }

  private async handleProfileLoadError(error: HttpErrorResponse) {
    let errorKey = 'RETAILER_PROFILE.LOAD_ERROR';

    if (!error) {
      // Network error
      errorKey = 'RETAILER_PROFILE.NETWORK_ERROR';
    } else if (error.status === 0) {
      // Network connectivity issue
      errorKey = 'RETAILER_PROFILE.NETWORK_ERROR';
    } else if (error.status === 401) {
      // Unauthorized - session expired
      this.showAuthError();
      return;
    } else if (error.status === 403) {
      // Forbidden
      errorKey = 'RETAILER_PROFILE.PERMISSION_DENIED';
    } else if (error.status === 404) {
      // Not found
      errorKey = 'RETAILER_PROFILE.NOT_FOUND';
    } else if (error.status === 408 || error.status === 504) {
      // Timeout
      errorKey = 'RETAILER_PROFILE.REQUEST_TIMEOUT_ERROR';
    } else if (error.status >= 500) {
      // Server error
      errorKey = 'RETAILER_PROFILE.SERVER_ERROR';
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_PROFILE.ERROR'),
      message: this.translate.instant(errorKey),
      buttons: [{
        text: this.translate.instant('RETAILER_PROFILE.OK'),
        handler: () => {
          // Optionally retry loading
        }
      }]
    });
    await alert.present();
  }

  private async handleProfileSaveError(error: HttpErrorResponse) {
    let errorKey = 'RETAILER_PROFILE.SAVE_ERROR_MESSAGE';

    if (!error) {
      // Network error
      errorKey = 'RETAILER_PROFILE.NETWORK_ERROR';
    } else if (error.status === 0) {
      // Network connectivity issue
      errorKey = 'RETAILER_PROFILE.NETWORK_ERROR';
    } else if (error.status === 401) {
      // Unauthorized - session expired
      this.showAuthError();
      return;
    } else if (error.status === 403) {
      // Forbidden
      errorKey = 'RETAILER_PROFILE.PERMISSION_DENIED';
    } else if (error.status === 404) {
      // Not found
      errorKey = 'RETAILER_PROFILE.NOT_FOUND';
    } else if (error.status === 408 || error.status === 504) {
      // Timeout
      errorKey = 'RETAILER_PROFILE.REQUEST_TIMEOUT_ERROR';
    } else if (error.status >= 500) {
      // Server error
      errorKey = 'RETAILER_PROFILE.SERVER_ERROR';
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_PROFILE.ERROR'),
      message: this.translate.instant(errorKey),
      buttons: [this.translate.instant('RETAILER_PROFILE.OK')]
    });
    await alert.present();
  }
}
