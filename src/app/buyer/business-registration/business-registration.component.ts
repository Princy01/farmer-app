import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save } from 'ionicons/icons';
import { State, City, Location, BusinessType, BusinessCategory, BusinessRegistrationService } from './business-registration.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-business-registration',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './business-registration.component.html',
  styleUrls: ['./business-registration.component.scss'],
})
export class BusinessRegistrationComponent implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private businessRegistrationService: BusinessRegistrationService,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {
    this.form = this.fb.group({
      bid: [null],
      b_registration_num: ['', Validators.required],
      b_owner_name: ['', Validators.required],
      b_category_id: [null, Validators.required],
      b_type_id: [null, Validators.required],
      is_active: [true], // Default true
      state_id: [null, Validators.required],
      city_id: [null, Validators.required],
      location_id: [null, Validators.required],
      address: ['', Validators.required],
      mobile_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      established_year: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      user_id: [null, Validators.required],
      gst_number: ['', Validators.required],
      pan_number: ['', [Validators.required, Validators.pattern(/[A-Z]{5}[0-9]{4}[A-Z]{1}/)]],
      privileged_user: [false], // Default false
      latitude: [null, Validators.required], // Required by backend
      longitude: [null, Validators.required], // Required by backend
    });

    addIcons({ save });
  }

  ngOnInit() {
    this.checkBusinessExistence();
  }

  private checkBusinessExistence() {
    this.businessRegistrationService.getBusinessExistsOrNot().subscribe({
      next: (exists: boolean) => {
        console.log('Business existence check result:', exists);
        if (exists) {
          this.router.navigate(['/buyer/buyer-home']);
        } else {
          this.initializeRegistrationForm();
        }
      },
      error: (err: any) => {
        console.error('Error checking business existence:', err);
        this.initializeRegistrationForm();
      }
    });
  }

  private initializeRegistrationForm() {
    this.fetchBusinessCategories();
    this.fetchBusinessTypes();
    this.fetchStates();
    this.setUserId();
    this.setupFormListeners();
  }

  private setUserId() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.form.get('user_id')?.setValue(userId);
    } else {
      console.warn('User ID not found');
    }
  }

  private setupFormListeners() {
    this.form.get('state_id')?.valueChanges.subscribe((stateId) => {
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

    this.form.get('city_id')?.valueChanges.subscribe((cityId) => {
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

  fetchBusinessCategories() {
    this.businessRegistrationService.getBusinessCategories().subscribe({
      next: (data) => (this.businessCategories = data),
      error: (err) => {
        console.error('Error loading business categories:', err);
        this.showErrorToast('BUSINESS_REGISTRATION.ERROR_LOAD_CATEGORIES');
      },
    });
  }

  fetchBusinessTypes() {
    this.businessRegistrationService.getBusinessTypes().subscribe({
      next: (data) => (this.businessTypes = data),
      error: (err) => {
        console.error('Error loading business types:', err);
        this.showErrorToast('BUSINESS_REGISTRATION.ERROR_LOAD_TYPES');
      },
    });
  }

  fetchStates() {
    this.businessRegistrationService.getStates().subscribe({
      next: (data) => (this.states = data),
      error: (err) => {
        console.error('Error loading states:', err);
        this.showErrorToast('BUSINESS_REGISTRATION.ERROR_LOAD_STATES');
      },
    });
  }

  fetchCities(stateId: number) {
    this.businessRegistrationService.getCitiesOfState(stateId).subscribe({
      next: (data) => {
        this.cities = data;
        this.filteredCities = [...data];
      },
      error: (err) => {
        console.error('Error loading cities:', err);
        this.showErrorToast('BUSINESS_REGISTRATION.ERROR_LOAD_CITIES');
      },
    });
  }

  fetchLocations(cityId: number) {
    this.businessRegistrationService.getLocationsByCity(cityId).subscribe({
      next: (data) => {
        this.locations = data;
        this.filteredLocations = [...data];
      },
      error: (err) => {
        console.error('Error loading locations:', err);
        this.showErrorToast('BUSINESS_REGISTRATION.ERROR_LOAD_LOCATIONS');
      },
    });
  }

  // Get current location using Capacitor Geolocation
  async getCurrentLocation() {
    this.isGettingLocation = true;
    try {
      // Check permissions first
      const permission = await Geolocation.checkPermissions();

      if (permission.location !== 'granted') {
        const requestPermission = await Geolocation.requestPermissions();
        if (requestPermission.location !== 'granted') {
          await this.showErrorToast('BUSINESS_REGISTRATION.ERROR_LOCATION_PERMISSION');
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
      await this.showSuccessToast('BUSINESS_REGISTRATION.LOCATION_SUCCESS');
    } catch {
      await this.showErrorToast('BUSINESS_REGISTRATION.ERROR_LOCATION');
    } finally {
      this.isGettingLocation = false;
    }
  }

  async onSubmit() {
    if (this.form.valid) {
      if (this.citySearchTerm.trim() && !this.form.get('city_id')?.value) {
        this.form.get('city_id')?.markAsTouched();
        await this.showErrorToast('BUSINESS_REGISTRATION.SELECT_CITY_FROM_LIST');
        return;
      }

      if (this.locationSearchTerm.trim() && !this.form.get('location_id')?.value) {
        this.form.get('location_id')?.markAsTouched();
        await this.showErrorToast('BUSINESS_REGISTRATION.SELECT_LOCATION_FROM_LIST');
        return;
      }

      const payload = {
        ...this.form.value,
        city_id: this.form.value.city_id,
        latitude: parseFloat(this.form.value.latitude),
        longitude: parseFloat(this.form.value.longitude)
      };

      this.businessRegistrationService.addNewBusiness(payload).subscribe({
        next: async () => {
          await this.showSuccessToast('BUSINESS_REGISTRATION.SUCCESS_MESSAGE');
          this.form.reset();
          this.router.navigate(['/buyer/buyer-home']);
        },
        error: async (err) => {
          console.error('Error registering business:', err);
          const message = err?.error?.error || 'BUSINESS_REGISTRATION.ERROR_REGISTER';
          await this.showErrorToast(message);
        }
      });
    } else {
      this.form.markAllAsTouched();
      await this.showErrorToast('BUSINESS_REGISTRATION.ERROR_FORM_INVALID');
    }
  }

  private async showErrorToast(messageKey: string) {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 2000,
      color: 'danger',
    });
    await toast.present();
  }

  private async showSuccessToast(messageKey: string) {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 2000,
      color: 'success',
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