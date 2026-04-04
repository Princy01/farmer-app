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
  businessOutline, arrowBackOutline, create, saveOutline,
  closeOutline, cameraOutline, imageOutline, checkmarkCircleOutline,
  mapOutline, locateOutline, calendarOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { WholesalerProfileService, WholesalerProfile, UpdateUserProfileRequest } from './profile.service';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule]
})
export class ProfilePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  profile: WholesalerProfile = {
    id: 0,
    name: '',
    email: null,
    mobile: null,
    address: null,
    location: null,
    location_id: null,
    city_id: null,
    city_name: null,
    state_id: null,
    state_name: null,
    pincode: null,
    status: '',
    profile_image: null,
    total_branches: 0,
    member_since: null
  };

  isEditing = false;
  isLoading = false;
  profileImage: string | null = null;
  editableLocation: number = 0;
  hasUnsavedChanges = false;
  originalProfile: WholesalerProfile | null = null;

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private wholesalerService: WholesalerProfileService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private translate: TranslateService
  ) {
    addIcons({
      personOutline, mailOutline, callOutline, locationOutline,
      businessOutline, arrowBackOutline, create, saveOutline,
      closeOutline, cameraOutline, imageOutline, checkmarkCircleOutline,
      mapOutline, locateOutline, calendarOutline
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

    this.wholesalerService.getProfile().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (backendProfile: any) => {
        this.profile = {
          id: backendProfile.id,
          name: backendProfile.name,
          email: backendProfile.email,
          mobile: backendProfile.mobile,
          address: backendProfile.address,
          location: backendProfile.location,
          location_id: backendProfile.location_id,
          city_id: backendProfile.city_id,
          city_name: backendProfile.city_name,
          state_id: backendProfile.state_id,
          state_name: backendProfile.state_name,
          pincode: backendProfile.pincode,
          status: backendProfile.status,
          profile_image: backendProfile.profile_image,
          total_branches: backendProfile.total_branches,
          member_since: backendProfile.member_since
        };
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        const errorMessage = error?.message || 'PROFILE.LOAD_FAILED';
        if (errorMessage === 'PROFILE.SESSION_EXPIRED') {
          this.showAuthError();
        } else {
          this.showErrorAlert(
            this.translate.instant('PROFILE.ERROR'),
            this.translate.instant(errorMessage)
          );
        }
      }
    });
  }

  toggleEdit() {
    if (this.isEditing && this.hasUnsavedChanges) {
      this.showConfirmCancelDialog();
    } else {
      this.isEditing = !this.isEditing;
      if (this.isEditing) {
        // Snapshot profile data when entering edit mode
        this.originalProfile = JSON.parse(JSON.stringify(this.profile));
        this.hasUnsavedChanges = false;
      } else {
        this.hasUnsavedChanges = false;
      }
    }
  }

  async saveProfile() {
    if (!this.validateProfile()) {
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PROFILE.SAVING')
    });
    await loading.present();
    this.isLoading = true;

    const updateData: UpdateUserProfileRequest = {
      name: this.profile.name || '',
      email: this.profile.email || '',
      mobile: this.profile.mobile || '',
      address: this.profile.address || '',
      state_name: this.profile.state_name || '',
      city_name: this.profile.city_name || '',
      location_name: this.profile.location || '',
      pincode: this.profile.pincode || ''
    };

    this.wholesalerService.updateProfile(updateData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: async (response: any) => {
        this.isLoading = false;
        await loading.dismiss();
        this.isEditing = false;
        this.hasUnsavedChanges = false;
        this.originalProfile = null;
        const toast = await this.toastCtrl.create({
          message: response.message || this.translate.instant('PROFILE.SAVE_SUCCESS'),
          duration: 2000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
      },
      error: async (error: any) => {
        this.isLoading = false;
        await loading.dismiss();
        const errorMessage = error?.message || 'PROFILE.SAVE_FAILED';
        if (errorMessage === 'PROFILE.SESSION_EXPIRED') {
          this.showAuthError();
        } else {
          this.showErrorAlert(
            this.translate.instant('PROFILE.ERROR'),
            this.translate.instant(errorMessage)
          );
        }
      }
    });
  }

  validateProfile(): boolean {
    if (!this.profile.name || !this.profile.email || !this.profile.mobile) {
      this.showErrorAlert(
        this.translate.instant('PROFILE.VALIDATION_ERROR'),
        this.translate.instant('PROFILE.REQUIRED_FIELDS')
      );
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.profile.email)) {
      this.showErrorAlert(
        this.translate.instant('PROFILE.VALIDATION_ERROR'),
        this.translate.instant('PROFILE.INVALID_EMAIL')
      );
      return false;
    }

    // Validate mobile number (10-15 digits, Indian format typically 10)
    const mobileRegex = /^\d{10,15}$/;
    if (!mobileRegex.test(this.profile.mobile.replace(/\D/g, ''))) {
      this.showErrorAlert(
        this.translate.instant('PROFILE.VALIDATION_ERROR'),
        this.translate.instant('PROFILE.INVALID_MOBILE')
      );
      return false;
    }

    // Validate pincode if provided
    if (this.profile.pincode && !/^\d{6}$/.test(this.profile.pincode)) {
      this.showErrorAlert(
        this.translate.instant('PROFILE.VALIDATION_ERROR'),
        this.translate.instant('PROFILE.INVALID_PINCODE')
      );
      return false;
    }

    return true;
  }

  async changeProfileImage() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PROFILE.CHANGE_IMAGE'),
      message: this.translate.instant('PROFILE.IMAGE_SOURCE'),
      buttons: [
        {
          text: this.translate.instant('PROFILE.CAMERA'),
          handler: () => {
            this.captureImage();
          }
        },
        {
          text: this.translate.instant('PROFILE.GALLERY'),
          handler: () => {
            this.selectImage();
          }
        },
        {
          text: this.translate.instant('PROFILE.CANCEL'),
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
        this.uploadImage(image.base64String);
      }
    } catch (error: any) {
      if (error?.message?.includes('User cancelled')) {
        return;
      }
      this.showErrorAlert(
        this.translate.instant('PROFILE.ERROR'),
        this.translate.instant('PROFILE.CAMERA_FAILED')
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
        this.uploadImage(image.base64String);
      }
    } catch (error: any) {
      if (error?.message?.includes('User cancelled')) {
        return;
      }
      this.showErrorAlert(
        this.translate.instant('PROFILE.ERROR'),
        this.translate.instant('PROFILE.GALLERY_FAILED')
      );
    }
  }

  async uploadImage(base64: string) {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PROFILE.UPLOADING')
    });
    await loading.present();
    this.isLoading = true;

    this.wholesalerService.uploadProfileImage(base64).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: async (response: any) => {
        this.isLoading = false;
        await loading.dismiss();
        this.loadProfile();
        const toast = await this.toastCtrl.create({
          message: response.message || this.translate.instant('PROFILE.IMAGE_UPDATED'),
          duration: 2000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
      },
      error: async (error: any) => {
        this.isLoading = false;
        await loading.dismiss();
        const errorMessage = error?.message || 'PROFILE.UPLOAD_FAILED';
        this.showErrorAlert(
          this.translate.instant('PROFILE.ERROR'),
          this.translate.instant(errorMessage)
        );
      }
    });
  }

  getImageSrc(image: string | null): string {
    if (!image) return '';
    if (image.startsWith('data:')) return image;
    return `data:image/jpeg;base64,${image}`;
  }

  goBack() {
    if (this.isEditing && this.hasUnsavedChanges) {
      this.showConfirmCancelDialog();
    } else {
      this.navCtrl.back();
    }
  }

  onProfileFieldChange() {
    if (this.isEditing && this.originalProfile) {
      // Check if any field has changed
      const fieldsChanged =
        this.profile.name !== this.originalProfile.name ||
        this.profile.email !== this.originalProfile.email ||
        this.profile.mobile !== this.originalProfile.mobile ||
        this.profile.address !== this.originalProfile.address ||
        this.profile.state_name !== this.originalProfile.state_name ||
        this.profile.city_name !== this.originalProfile.city_name ||
        this.profile.location !== this.originalProfile.location ||
        this.profile.pincode !== this.originalProfile.pincode;

      this.hasUnsavedChanges = fieldsChanged;
    }
  }

  private async showConfirmCancelDialog() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PROFILE.CONFIRM_CANCEL'),
      message: this.translate.instant('PROFILE.UNSAVED_CHANGES'),
      buttons: [
        {
          text: this.translate.instant('PROFILE.DISCARD'),
          role: 'destructive',
          handler: () => {
            this.profile = JSON.parse(JSON.stringify(this.originalProfile));
            this.isEditing = false;
            this.hasUnsavedChanges = false;
            this.originalProfile = null;
            this.navCtrl.back();
          }
        },
        {
          text: this.translate.instant('PROFILE.KEEP_EDITING'),
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PROFILE.AUTH_ERROR'),
      message: this.translate.instant('PROFILE.SESSION_EXPIRED'),
      buttons: [{
        text: this.translate.instant('PROFILE.OK'),
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
      buttons: [this.translate.instant('PROFILE.OK')]
    });
    await alert.present();
  }
}