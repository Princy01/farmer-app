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
  businessOutline, arrowBackOutline, createOutline, saveOutline,
  closeOutline, cameraOutline, imageOutline, checkmarkCircleOutline,
  storefrontOutline, cardOutline
} from 'ionicons/icons';

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
    retailer_id: 0,
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
    total_orders: 0
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
      storefrontOutline, cardOutline
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

    this.retailerProfileService.getProfile().subscribe({
      next: (profile: RetailerProfile) => {
        this.profile = profile;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.isLoading = false;
        this.showErrorAlert('Error', 'Failed to load profile');
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
      email: this.profile.email,
      mobile_num: this.profile.mobile_num,
      address: this.profile.address,
      state_name: this.profile.state_name,
      location_name: this.profile.location_name,
      pincode: this.profile.pincode
    };

    this.retailerProfileService.updateProfile(profileData).subscribe({
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
      error: async (error) => {
        await loading.dismiss();
        console.error('Error saving profile:', error);
        this.showErrorAlert('Error', 'Failed to save profile');
      }
    });
  }

  validateProfile(): boolean {
    if (!this.profile.name || !this.profile.email || !this.profile.mobile_num) {
      this.showErrorAlert(
        this.translate.instant('RETAILER_PROFILE.VALIDATION_ERROR'),
        this.translate.instant('RETAILER_PROFILE.REQUIRED_FIELDS')
      );
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.profile.email)) {
      this.showErrorAlert(
        this.translate.instant('RETAILER_PROFILE.VALIDATION_ERROR'),
        this.translate.instant('RETAILER_PROFILE.INVALID_EMAIL')
      );
      return false;
    }

    return true;
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

  captureImage() {
    // Implement camera capture
    console.log('Capture image from camera');
  }

  selectImage() {
    // Implement image selection from gallery
    console.log('Select image from gallery');
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
}
