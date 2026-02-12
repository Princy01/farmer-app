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
  closeOutline, cameraOutline, imageOutline, checkmarkCircleOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { WholesalerProfileService, WholesalerProfile, UpdateUserProfileRequest } from './profile.service';
import { AuthService } from 'src/app/auth/auth.service';
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

  profile: WholesalerProfile = {
    id: 0,
    name: '',
    email: null,
    mobile: null,
    address: null,
    location: null,
    location_id: null,
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
      closeOutline, cameraOutline, imageOutline, checkmarkCircleOutline
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
        if (error.includes('401')) {
          this.showAuthError();
        } else {
          this.showErrorAlert(
            this.translate.instant('PROFILE.ERROR'),
            this.translate.instant('PROFILE.LOAD_FAILED')
          );
        }
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
      message: this.translate.instant('PROFILE.SAVING')
    });
    await loading.present();

    const updateData: UpdateUserProfileRequest = {
      name: this.profile.name,
      email: this.profile.email || '',
      mobile: this.profile.mobile || '',
      address: this.profile.address || '',
      location: this.profile.location_id || 0,
      state: this.profile.state_id || 0,
      pincode: this.profile.pincode || ''
    };

    this.wholesalerService.updateProfile(updateData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: async (response: any) => {
        await loading.dismiss();
        this.isEditing = false;
        const toast = await this.toastCtrl.create({
          message: response.message || this.translate.instant('PROFILE.SAVE_SUCCESS'),
          duration: 2000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
      },
      error: async (error: any) => {
        await loading.dismiss();
        if (error.includes('401')) {
          this.showAuthError();
        } else {
          this.showErrorAlert(
            this.translate.instant('PROFILE.ERROR'),
            this.translate.instant('PROFILE.SAVE_FAILED')
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.profile.email)) {
      this.showErrorAlert(
        this.translate.instant('PROFILE.VALIDATION_ERROR'),
        this.translate.instant('PROFILE.INVALID_EMAIL')
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
    } catch (error) {
      console.error('Camera error:', error);
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
    } catch (error) {
      console.error('Gallery error:', error);
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

    this.wholesalerService.uploadProfileImage(base64).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: async (response: any) => {
        await loading.dismiss();
        // Reload profile to get updated image
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
        await loading.dismiss();
        this.showErrorAlert(
          this.translate.instant('PROFILE.ERROR'),
          this.translate.instant('PROFILE.UPLOAD_FAILED')
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
    this.navCtrl.back();
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