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
import { Geolocation } from '@capacitor/geolocation';

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
  filteredCities: City[] = [];
  filteredLocations: Location[] = [];
  citySearchTerm = '';
  locationSearchTerm = '';
  showCitySuggestions = false;
  showLocationSuggestions = false;
  businessTypes: BusinessType[] = [];
  isGettingLocation = false;
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
      latitude: [null, Validators.required],
      longitude: [null, Validators.required],
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
        this.form.patchValue({ city_id: null, location_id: null }, { emitEvent: false });
        this.cities = [];
        this.locations = [];
        this.filteredCities = [];
        this.filteredLocations = [];
        this.citySearchTerm = '';
        this.locationSearchTerm = '';
        this.showCitySuggestions = false;
        this.showLocationSuggestions = false;

        if (stateId) {
          this.fetchCities(stateId);
        }
      });

    this.form.get('city_id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((cityId) => {
        this.form.get('location_id')?.setValue(null, { emitEvent: false });
        this.locations = [];
        this.filteredLocations = [];
        this.locationSearchTerm = '';
        this.showLocationSuggestions = false;

        if (cityId) {
          this.fetchLocations(cityId);
        }
      });
  }

  onCitySearchChange(event: Event | CustomEvent): void {
    const rawValue = (event as CustomEvent)?.detail?.value ?? (event.target as HTMLInputElement)?.value ?? '';
    this.citySearchTerm = String(rawValue);

    const selectedCityId = this.form.get('city_id')?.value;
    if (selectedCityId) {
      const selectedCity = this.cities.find((city) => city.id === Number(selectedCityId));
      if (selectedCity && selectedCity.city_name.toLowerCase() !== this.citySearchTerm.trim().toLowerCase()) {
        this.form.patchValue({ city_id: null, location_id: null }, { emitEvent: false });
        this.locations = [];
        this.filteredLocations = [];
        this.locationSearchTerm = '';
      }
    }

    this.filterCities();
    this.showCitySuggestions = !!this.form.get('state_id')?.value;
  }

  onLocationSearchChange(event: Event | CustomEvent): void {
    const rawValue = (event as CustomEvent)?.detail?.value ?? (event.target as HTMLInputElement)?.value ?? '';
    this.locationSearchTerm = String(rawValue);

    const selectedLocationId = this.form.get('location_id')?.value;
    if (selectedLocationId) {
      const selectedLocation = this.locations.find((location) => location.id === Number(selectedLocationId));
      if (selectedLocation && (selectedLocation.location_name ?? '').toLowerCase() !== this.locationSearchTerm.trim().toLowerCase()) {
        this.form.get('location_id')?.setValue(null, { emitEvent: false });
      }
    }

    this.filterLocations();
    this.showLocationSuggestions = !!this.form.get('city_id')?.value;
  }

  onCityInputFocus(): void {
    if (!this.form.get('state_id')?.value) {
      return;
    }
    this.filteredCities = [...this.cities];
    this.showCitySuggestions = true;
  }

  onCityInputBlur(): void {
    this.form.get('city_id')?.markAsTouched();
    setTimeout(() => {
      this.showCitySuggestions = false;
    }, 150);
  }

  onLocationInputFocus(): void {
    if (!this.form.get('city_id')?.value) {
      return;
    }
    this.filteredLocations = [...this.locations];
    this.showLocationSuggestions = true;
  }

  onLocationInputBlur(): void {
    this.form.get('location_id')?.markAsTouched();
    setTimeout(() => {
      this.showLocationSuggestions = false;
    }, 150);
  }

  selectCity(city: City, event?: Event): void {
    event?.preventDefault();
    this.form.patchValue({ city_id: city.id, location_id: null }, { emitEvent: false });
    this.citySearchTerm = city.city_name;
    this.locationSearchTerm = '';
    this.showCitySuggestions = false;
    this.locations = [];
    this.filteredLocations = [];
    this.fetchLocations(city.id);
  }

  selectLocation(location: Location, event?: Event): void {
    event?.preventDefault();
    this.form.get('location_id')?.setValue(location.id, { emitEvent: false });
    this.locationSearchTerm = location.location_name ?? '';
    this.showLocationSuggestions = false;
  }

  clearSelectedCity(): void {
    this.form.patchValue({ city_id: null, location_id: null }, { emitEvent: false });
    this.citySearchTerm = '';
    this.locationSearchTerm = '';
    this.locations = [];
    this.filteredLocations = [];
    this.filteredCities = [...this.cities];
    this.showCitySuggestions = false;
    this.showLocationSuggestions = false;
  }

  clearSelectedLocation(): void {
    this.form.get('location_id')?.setValue(null, { emitEvent: false });
    this.locationSearchTerm = '';
    this.filteredLocations = [...this.locations];
    this.showLocationSuggestions = false;
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
          this.filteredCities = [...this.cities];
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
          this.filteredLocations = [...this.locations];
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

    if (this.citySearchTerm.trim() && !this.form.get('city_id')?.value) {
      this.form.get('city_id')?.markAsTouched();
      await this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.SELECT_CITY_FROM_LIST');
      return;
    }

    if (this.locationSearchTerm.trim() && !this.form.get('location_id')?.value) {
      this.form.get('location_id')?.markAsTouched();
      await this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.SELECT_LOCATION_FROM_LIST');
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

    const payload = {
      ...this.form.value,
      city_id: this.form.value.city_id,
      latitude: parseFloat(this.form.value.latitude),
      longitude: parseFloat(this.form.value.longitude)
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

  async getCurrentLocation(): Promise<void> {
    this.isGettingLocation = true;
    try {
      // Check permissions first
      const permission = await Geolocation.checkPermissions();

      if (permission.location !== 'granted') {
        const requestPermission = await Geolocation.requestPermissions();
        if (requestPermission.location !== 'granted') {
          await this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.ERROR_LOCATION_PERMISSION');
          return;
        }
      }

      // Get current position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      this.form.patchValue({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });

      this.form.get('latitude')?.markAsTouched();
      this.form.get('longitude')?.markAsTouched();
      await this.showSuccessToast('WHOLESALER_BUSINESS_REGISTRATION.LOCATION_SUCCESS');
    } catch {
      await this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.ERROR_LOCATION');
    } finally {
      this.isGettingLocation = false;
    }
  }

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
}