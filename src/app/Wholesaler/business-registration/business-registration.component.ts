import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save } from 'ionicons/icons';
import { State, City, Location, BusinessType, BusinessCategory, BusinessRegistrationService } from './business-registration.service';
import { AuthService } from 'src/app/auth/auth.service';
import { WholesalerApiService } from '../services/wholesaler-api.service';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
// import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-business-registration',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './business-registration.component.html',
  styleUrls: ['./business-registration.component.scss'],
})
export class BusinessRegistrationComponent implements OnInit, OnDestroy {
  form: FormGroup;
  businessCategories: BusinessCategory[] = [];
  states: State[] = [];
  cities: City[] = [];
  locations: Location[] = [];
  businessTypes: BusinessType[] = [];
  // isGettingLocation = false;
  isSubmitting = false;
  isLoadingCities = false;
  isLoadingLocations = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private businessRegistrationService: BusinessRegistrationService,
    private authService: AuthService,
    private wholesalerApiService: WholesalerApiService,
    private router: Router,
    private translate: TranslateService
  ) {
    this.form = this.fb.group({
      bid: [null],
      b_registration_num: ['', Validators.required],
      b_owner_name: ['', Validators.required],
      b_category_id: [null, Validators.required],
      b_type_id: [null, Validators.required],
      is_active: [true],
      state_id: [null, Validators.required],
      city_id: [null, Validators.required],
      location_id: [null, Validators.required],
      address: ['', Validators.required],
      mobile_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      established_year: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      user_id: [null, Validators.required],
      gst_number: ['', Validators.required],
      pan_number: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      // latitude: ['', Validators.required],
      // longitude: ['', Validators.required],
      privileged_user: [false],
    });

    addIcons({ save });
  }

  ngOnInit(): void {
    this.checkBusinessExistence();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async checkBusinessExistence(): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('WHOLESALER_BUSINESS_REGISTRATION.LOADING'),
    });
    await loading.present();

    this.wholesalerApiService.getBusinessExistsOrNot()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (exists: boolean) => {
          await loading.dismiss();
          if (exists) {
            await this.showInfoToast('WHOLESALER_BUSINESS_REGISTRATION.BUSINESS_ALREADY_EXISTS');
            this.router.navigate(['/wholesaler/home']);
          } else {
            this.initializeRegistrationForm();
          }
        },
        error: async (err: any) => {
          await loading.dismiss();
          await this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.CHECK_BUSINESS_ERROR');
          this.initializeRegistrationForm();
        }
      });
  }

  private initializeRegistrationForm(): void {
    this.setUserId();
    this.setupFormListeners();
    this.fetchBusinessCategories();
    this.fetchBusinessTypes();
    this.fetchStates();
  }

  private setUserId(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.form.get('user_id')?.setValue(userId);
    } else {
      this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.USER_ID_NOT_FOUND');
    }
  }

  private setupFormListeners(): void {
    this.form.get('state_id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((stateId) => {
        if (stateId) {
          this.fetchCities(stateId);
          this.form.patchValue({ city_id: null, location_id: null });
          this.locations = [];
        } else {
          this.cities = [];
          this.locations = [];
          this.form.patchValue({ city_id: null, location_id: null });
        }
      });

    this.form.get('city_id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((cityId) => {
        if (cityId) {
          this.fetchLocations(cityId);
          this.form.get('location_id')?.setValue(null);
        } else {
          this.locations = [];
          this.form.get('location_id')?.setValue(null);
        }
      });
  }

  private fetchBusinessCategories(): void {
    this.businessRegistrationService.getBusinessCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.businessCategories = data;
        },
        error: (err) => {
          this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.LOAD_CATEGORIES_ERROR');
        },
      });
  }

  private fetchBusinessTypes(): void {
    this.businessRegistrationService.getBusinessTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.businessTypes = data;
        },
        error: (err) => {
          this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.LOAD_TYPES_ERROR');
        },
      });
  }

  private fetchStates(): void {
    this.businessRegistrationService.getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.states = data;
        },
        error: (err) => {
          this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.LOAD_STATES_ERROR');
        },
      });
  }

  private fetchCities(stateId: number): void {
    this.isLoadingCities = true;
    this.businessRegistrationService.getCitiesOfState(stateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.cities = data && data.length > 0 ? data : [];
          this.isLoadingCities = false;
        },
        error: (err) => {
          this.isLoadingCities = false;
          this.cities = [];
          this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.LOAD_CITIES_ERROR');
        },
      });
  }

  private fetchLocations(cityId: number): void {
    this.isLoadingLocations = true;
    this.businessRegistrationService.getLocationsByCity(cityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.locations = data && data.length > 0 ? data : [];
          this.isLoadingLocations = false;
        },
        error: (err) => {
          this.isLoadingLocations = false;
          this.locations = [];
          this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.LOAD_LOCATIONS_ERROR');
        },
      });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.FIX_ERRORS');
      return;
    }

    if (this.isSubmitting) {
      return; // Prevent double submission
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('WHOLESALER_BUSINESS_REGISTRATION.SUBMITTING'),
    });
    await loading.present();

    const fallbackLatitude = 28.6139;
    const fallbackLongitude = 77.2090;
    const payload = {
      ...this.form.value,
      city_id: this.form.value.city_id,
      latitude: fallbackLatitude,
      longitude: fallbackLongitude
    };

    this.businessRegistrationService.addNewBusiness(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          await loading.dismiss();
          this.isSubmitting = false;
          await this.showSuccessToast('WHOLESALER_BUSINESS_REGISTRATION.REGISTRATION_SUCCESS');
          this.form.reset();
          this.router.navigate(['/wholesaler/home']);
        },
        error: async (err) => {
          await loading.dismiss();
          this.isSubmitting = false;
          await this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.REGISTRATION_FAILED');
        }
      });
  }

  // async getCurrentLocation() {
  //   this.isGettingLocation = true;
  //   try {
  //     // Check permissions first
  //     const permission = await Geolocation.checkPermissions();

  //     if (permission.location !== 'granted') {
  //       const requestPermission = await Geolocation.requestPermissions();
  //       if (requestPermission.location !== 'granted') {
  //         await this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.ERROR_LOCATION_PERMISSION');
  //         this.isGettingLocation = false;
  //         return;
  //       }
  //     }

  //     // Get current position
  //     const position = await Geolocation.getCurrentPosition({
  //       enableHighAccuracy: true,
  //       timeout: 10000,
  //       maximumAge: 0
  //     });

  //     this.form.patchValue({
  //       latitude: position.coords.latitude,
  //       longitude: position.coords.longitude
  //     });

  //     await this.showSuccessToast('WHOLESALER_BUSINESS_REGISTRATION.LOCATION_SUCCESS');
  //   } catch (error) {
  //     await this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.ERROR_LOCATION');
  //   } finally {
  //     this.isGettingLocation = false;
  //   }
  // }

  private async showErrorToast(messageKey: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 3000,
      color: 'danger',
      position: 'bottom',
    });
    await toast.present();
  }

  private async showSuccessToast(messageKey: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 3000,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
  }

  private async showInfoToast(messageKey: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 3000,
      color: 'primary',
      position: 'bottom',
    });
    await toast.present();
  }
}