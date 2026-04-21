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
  storefrontOutline, cardOutline, locateOutline, calendarOutline, starOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { AuthService, State, City, Location } from 'src/app/auth/auth.service';
import { RetailerProfile, RetailerProfileService, UpdateUserProfileRequest } from './profile.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { BuyerRatingsService, MyPeerRatingResponse } from '../ratings/buyer-ratings.service';

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
  states: State[] = [];
  cities: City[] = [];
  locations: Location[] = [];
  filteredCities: City[] = [];
  filteredLocations: Location[] = [];
  citySearchTerm = '';
  locationSearchTerm = '';
  showCitySuggestions = false;
  showLocationSuggestions = false;
  private profileLoaded = false;
  private statesLoaded = false;
  peerRatingLoading = false;
  peerRatingError: string | null = null;
  myPeerRating: MyPeerRatingResponse | null = null;

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private translate: TranslateService,
    private retailerProfileService: RetailerProfileService,
    private buyerRatingsService: BuyerRatingsService
  ) {
    addIcons({
      personOutline, mailOutline, callOutline, locationOutline,
      businessOutline, arrowBackOutline, createOutline, saveOutline,
      closeOutline, cameraOutline, imageOutline, checkmarkCircleOutline,
      storefrontOutline, cardOutline, locateOutline, calendarOutline,
      starOutline
    });
  }

  ngOnInit() {
    this.loadStates();
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
          this.citySearchTerm = this.profile.city_name ?? '';
          this.locationSearchTerm = this.profile.location ?? '';
          this.profileLoaded = true;
          this.initializeLocationMasterSelection();
          this.loadPeerRatingSummary();
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
    if (this.isEditing) {
      this.citySearchTerm = this.profile.city_name ?? '';
      this.locationSearchTerm = this.profile.location ?? '';
      this.filteredCities = [...this.cities];
      this.filteredLocations = [...this.locations];
    } else {
      this.showCitySuggestions = false;
      this.showLocationSuggestions = false;
    }
  }

  async saveProfile() {
    if (!this.validateProfile()) {
      return;
    }

    this.syncLocationNamesFromSelection();

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_PROFILE.SAVING')
    });
    await loading.present();

    const profileData: UpdateUserProfileRequest = {
      name: this.profile.name,
      email: this.profile.email ?? '',
      mobile: this.profile.mobile ?? '',
      address: this.profile.address ?? '',
      state_id: this.profile.state_id ?? null,
      state_name: this.profile.state_name ?? '',
      city_id: this.profile.city_id ?? null,
      city_name: this.profile.city_name ?? '',
      location_id: this.profile.location_id ?? null,
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

    if (this.citySearchTerm.trim() && !this.profile.city_id) {
      const alert = this.alertCtrl.create({
        header: this.translate.instant('RETAILER_PROFILE.VALIDATION_ERROR'),
        message: this.translate.instant('RETAILER_PROFILE.SELECT_CITY_FROM_LIST'),
        buttons: [this.translate.instant('RETAILER_PROFILE.OK')]
      });
      alert.then(a => a.present());
      return false;
    }

    if (this.locationSearchTerm.trim() && !this.profile.location_id) {
      const alert = this.alertCtrl.create({
        header: this.translate.instant('RETAILER_PROFILE.VALIDATION_ERROR'),
        message: this.translate.instant('RETAILER_PROFILE.SELECT_LOCATION_FROM_LIST'),
        buttons: [this.translate.instant('RETAILER_PROFILE.OK')]
      });
      alert.then(a => a.present());
      return false;
    }

    return true;
  }

  onStateSelected(stateId: number | string | null): void {
    const normalizedStateId = Number(stateId);
    if (!normalizedStateId) {
      this.profile.state_id = null;
      this.profile.state_name = '';
      this.clearCityAndLocationSelection();
      this.cities = [];
      this.locations = [];
      this.filteredCities = [];
      this.filteredLocations = [];
      return;
    }

    const selectedState = this.states.find((state) => state.id === normalizedStateId);
    this.profile.state_id = normalizedStateId;
    this.profile.state_name = selectedState?.state_name ?? '';
    this.clearCityAndLocationSelection();
    this.loadCities(normalizedStateId);
  }

  onCitySearchChange(searchTerm: string | null): void {
    this.citySearchTerm = searchTerm ?? '';
    this.filterCities();
    this.showCitySuggestions = !!this.profile.state_id;
  }

  onLocationSearchChange(searchTerm: string | null): void {
    this.locationSearchTerm = searchTerm ?? '';
    this.filterLocations();
    this.showLocationSuggestions = !!this.profile.city_id;
  }

  onCityInputFocus(): void {
    if (!this.profile.state_id) {
      return;
    }
    this.filteredCities = [...this.cities];
    this.showCitySuggestions = true;
  }

  onLocationInputFocus(): void {
    if (!this.profile.city_id) {
      return;
    }
    this.filteredLocations = [...this.locations];
    this.showLocationSuggestions = true;
  }

  onCityInputBlur(): void {
    setTimeout(() => {
      this.showCitySuggestions = false;
    }, 150);
  }

  onLocationInputBlur(): void {
    setTimeout(() => {
      this.showLocationSuggestions = false;
    }, 150);
  }

  selectCity(city: City, event?: Event): void {
    event?.preventDefault();
    this.profile.city_id = city.id;
    this.profile.city_name = city.city_name;
    this.citySearchTerm = city.city_name;
    this.profile.location_id = null;
    this.profile.location = '';
    this.locationSearchTerm = '';
    this.showCitySuggestions = false;
    this.locations = [];
    this.filteredLocations = [];
    this.loadLocations(city.id);
  }

  selectLocation(location: Location, event?: Event): void {
    event?.preventDefault();
    this.profile.location_id = location.id;
    this.profile.location = location.location_name ?? '';
    this.locationSearchTerm = this.profile.location;
    this.showLocationSuggestions = false;
  }

  clearSelectedCity(): void {
    this.clearCityAndLocationSelection();
    this.locations = [];
    this.filteredLocations = [];
  }

  clearSelectedLocation(): void {
    this.profile.location_id = null;
    this.profile.location = '';
    this.locationSearchTerm = '';
    this.filteredLocations = [...this.locations];
    this.showLocationSuggestions = false;
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

  private loadStates(): void {
    this.authService.getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => {
          this.states = states ?? [];
          this.statesLoaded = true;
          this.initializeLocationMasterSelection();
        },
        error: () => {
          this.states = [];
          this.statesLoaded = true;
        }
      });
  }

  private initializeLocationMasterSelection(): void {
    if (!this.profileLoaded || !this.statesLoaded) {
      return;
    }

    if (!this.profile.state_id && this.profile.state_name) {
      const matchedState = this.states.find(
        (state) => state.state_name.toLowerCase() === this.profile.state_name!.toLowerCase()
      );
      if (matchedState) {
        this.profile.state_id = matchedState.id;
        this.profile.state_name = matchedState.state_name;
      }
    }

    if (this.profile.state_id) {
      this.loadCities(this.profile.state_id, true);
    }
  }

  private loadCities(stateId: number, preserveSelection = false): void {
    this.authService.getCitiesOfState(stateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cities) => {
          this.cities = cities ?? [];
          this.filteredCities = [...this.cities];

          if (preserveSelection && !this.profile.city_id && this.profile.city_name) {
            const matchedCity = this.cities.find(
              (city) => city.city_name.toLowerCase() === this.profile.city_name!.toLowerCase()
            );
            if (matchedCity) {
              this.profile.city_id = matchedCity.id;
              this.profile.city_name = matchedCity.city_name;
            }
          }

          if (this.profile.city_id) {
            this.citySearchTerm = this.profile.city_name ?? '';
            this.loadLocations(this.profile.city_id, preserveSelection);
          } else {
            this.locations = [];
            this.filteredLocations = [];
          }
        },
        error: () => {
          this.cities = [];
          this.filteredCities = [];
          this.locations = [];
          this.filteredLocations = [];
        }
      });
  }

  private loadLocations(cityId: number, preserveSelection = false): void {
    this.authService.getLocationsByCity(cityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locations) => {
          this.locations = locations ?? [];
          this.filteredLocations = [...this.locations];

          if (preserveSelection && !this.profile.location_id && this.profile.location) {
            const matchedLocation = this.locations.find(
              (location) => (location.location_name ?? '').toLowerCase() === this.profile.location!.toLowerCase()
            );
            if (matchedLocation) {
              this.profile.location_id = matchedLocation.id;
              this.profile.location = matchedLocation.location_name ?? '';
            }
          }

          this.locationSearchTerm = this.profile.location ?? '';
        },
        error: () => {
          this.locations = [];
          this.filteredLocations = [];
        }
      });
  }

  private filterCities(): void {
    const searchTerm = this.citySearchTerm.trim().toLowerCase();
    if (!searchTerm) {
      this.filteredCities = [...this.cities];
      return;
    }

    this.filteredCities = this.cities.filter((city) =>
      city.city_name.toLowerCase().includes(searchTerm) ||
      city.city_shortname.toLowerCase().includes(searchTerm)
    );
  }

  private filterLocations(): void {
    const searchTerm = this.locationSearchTerm.trim().toLowerCase();
    if (!searchTerm) {
      this.filteredLocations = [...this.locations];
      return;
    }

    this.filteredLocations = this.locations.filter((location) =>
      (location.location_name ?? '').toLowerCase().includes(searchTerm)
    );
  }

  private clearCityAndLocationSelection(): void {
    this.profile.city_id = null;
    this.profile.city_name = '';
    this.citySearchTerm = '';
    this.profile.location_id = null;
    this.profile.location = '';
    this.locationSearchTerm = '';
    this.showCitySuggestions = false;
    this.showLocationSuggestions = false;
  }

  private syncLocationNamesFromSelection(): void {
    const selectedState = this.states.find((state) => state.id === this.profile.state_id);
    if (selectedState) {
      this.profile.state_name = selectedState.state_name;
    }

    const selectedCity = this.cities.find((city) => city.id === this.profile.city_id);
    if (selectedCity) {
      this.profile.city_name = selectedCity.city_name;
    }

    const selectedLocation = this.locations.find((location) => location.id === this.profile.location_id);
    if (selectedLocation) {
      this.profile.location = selectedLocation.location_name ?? '';
    }
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

  loadPeerRatingSummary(): void {
    this.peerRatingLoading = true;
    this.peerRatingError = null;

    this.buyerRatingsService
      .getMyPeerRating()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.myPeerRating = summary;
          this.peerRatingLoading = false;
        },
        error: (err: Error) => {
          this.peerRatingLoading = false;
          this.peerRatingError = err.message;
        },
      });
  }
}
