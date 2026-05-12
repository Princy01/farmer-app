import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  eye, eyeOff, eyeOutline, eyeOffOutline,
  mailOutline, lockClosedOutline, personOutline,
  businessOutline, storefrontOutline, storefront,
  carOutline, shieldCheckmarkOutline, logInOutline,
  personAddOutline, locationOutline, mapOutline,
  refreshOutline, arrowBackOutline,
  checkmarkCircleOutline, keyOutline,
  lockOpenOutline, alertCircleOutline, languageOutline
} from 'ionicons/icons';
import {
  AuthService,
  UserRegistration,
  LoginCredentials,
  Location,
  State,
  City
} from './auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TranslateApiService } from '@/services/translate-api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


enum UserRole {
  Admin = 1,
  Wholesaler = 2,
  Retailer = 3,
  Driver = 4
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, TranslatePipe],
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class LoginPage implements OnDestroy {
  loginForm: FormGroup;
  registerForm: FormGroup;
  forgotPasswordForm: FormGroup;
  authMode: 'login' | 'register' | 'verify-email' | 'forgot-password' = 'login';
  forgotPasswordMode: 'request' | 'reset' | 'success' = 'request';
  showLoginPassword = false;
  showRegisterPassword = false;
  showForgotNewPassword = false;
  showForgotConfirmPassword = false;
  isLoading = false;
  isForgotLoading = false;
  isResendResetCodeLoading = false;
  forgotPasswordEmail = '';
  forgotPasswordMaskedDestination = '';
  forgotPasswordExpirySeconds = 0;
  forgotPasswordResendCooldown = 0;
  forgotPasswordErrorKey = '';
  states: State[] = [];
  cities: City[] = [];
  locations: Location[] = [];
  filteredCities: City[] = [];
  filteredLocations: Location[] = [];
  citySearchTerm = '';
  locationSearchTerm = '';
  showCitySuggestions = false;
  showLocationSuggestions = false;
  isLoadingStates = false;
  isLoadingCities = false;
  isLoadingLocations = false;

  pendingVerificationEmail: string = '';
  isResending: boolean = false;
  resendCooldown: number = 0;
  private cooldownTimer: any;
  private forgotPasswordExpiryTimer: any;
  private forgotPasswordResendTimer: any;
  private destroy$ = new Subject<void>();

  // Language selection properties
  languages = [
    { id: 1, code: 'en', name: 'English' },
    { id: 2, code: 'hi', name: 'हिन्दी' }
  ];
  selectedLanguage: string = 'en';
  currentLanguageName: string = 'English';

  userRoles = [
    { id: UserRole.Wholesaler, name: 'AUTH.ROLE_WHOLESALER' },
    { id: UserRole.Retailer, name: 'AUTH.ROLE_RETAILER' },
    { id: UserRole.Driver, name: 'AUTH.ROLE_DRIVER' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastController: ToastController,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private translateApiService: TranslateApiService
  ) {
    addIcons({
      eye, eyeOff, eyeOutline, eyeOffOutline,
      mailOutline, lockClosedOutline, personOutline,
      businessOutline, storefrontOutline, storefront,
      carOutline, shieldCheckmarkOutline, logInOutline,
      personAddOutline, locationOutline, mapOutline,
      refreshOutline, arrowBackOutline,
      checkmarkCircleOutline, keyOutline,
      lockOpenOutline, alertCircleOutline, languageOutline
    });

    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required, this.emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      identifier: ['', [Validators.required, this.emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      state: [null, Validators.required],
      city: [null, Validators.required],
      location: [null, Validators.required],
      address: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      role_id: ['', Validators.required],
      active_status: [1]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.initUserLanguage();
    this.loadStates();
    this.setupFormValueChanges();
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.reloadReferenceDataForLanguage());
  }

  private initUserLanguage() {
    const legacy = localStorage.getItem('wholesaler_language')
      || localStorage.getItem('retailer_language');
    if (legacy) {
      const normalizedLegacy = this.normalizeLanguageCode(legacy);
      localStorage.setItem('preferred_language', normalizedLegacy);
      localStorage.setItem('appLang', normalizedLegacy);
      localStorage.removeItem('wholesaler_language');
      localStorage.removeItem('retailer_language');
    }

    const savedLang = this.normalizeLanguageCode(
      localStorage.getItem('preferred_language') ||
      localStorage.getItem('appLang') ||
      'en'
    );
    localStorage.setItem('preferred_language', savedLang);
    localStorage.setItem('appLang', savedLang);
    this.selectedLanguage = savedLang;
    const currentLang = this.languages.find(l => l.code === savedLang);
    this.currentLanguageName = currentLang ? currentLang.name : 'English';

    this.translate.use(savedLang);

    this.translateApiService.getUserPreference().subscribe({
      next: (pref) => {
        const code = this.normalizeLanguageCode(pref?.code || savedLang);
        this.translate.use(code);
        this.selectedLanguage = code;
        const lang = this.languages.find(l => l.code === code);
        this.currentLanguageName = lang ? lang.name : 'English';
        localStorage.setItem('preferred_language', code);
        localStorage.setItem('appLang', code);
      },
      error: () => {
        // Already applied saved/default above, nothing to do
      }
    });
  }

  setupFormValueChanges() {
    // Reset city and location when state changes
    this.registerForm.get('state')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((stateId) => {
        this.registerForm.patchValue({ city: null, location: null }, { emitEvent: false });
        this.cities = [];
        this.locations = [];
        this.filteredCities = [];
        this.filteredLocations = [];
        this.citySearchTerm = '';
        this.locationSearchTerm = '';
        this.showCitySuggestions = false;
        this.showLocationSuggestions = false;

        if (stateId) {
          this.loadCities(stateId);
        }
      });

    // Reset location when city changes
    this.registerForm.get('city')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((cityId) => {
        this.registerForm.get('location')?.reset(null, { emitEvent: false });
        this.locations = [];
        this.filteredLocations = [];
        this.locationSearchTerm = '';
        this.showLocationSuggestions = false;

        if (cityId) {
          this.loadLocations(cityId);
        }
      });
  }

  onCitySearchChange(event: Event | CustomEvent): void {
    const rawValue = (event as CustomEvent)?.detail?.value ?? (event.target as HTMLInputElement)?.value ?? '';
    this.citySearchTerm = String(rawValue);

    const selectedCityId = this.registerForm.get('city')?.value;
    if (selectedCityId) {
      const selectedCity = this.cities.find((city) => city.id === Number(selectedCityId));
      if (selectedCity && !this.matchesCityInput(selectedCity, this.citySearchTerm)) {
        this.registerForm.patchValue({ city: null, location: null }, { emitEvent: false });
        this.locations = [];
        this.filteredLocations = [];
        this.locationSearchTerm = '';
      }
    }

    this.filterCities();
    this.showCitySuggestions = !!this.registerForm.get('state')?.value;
  }

  onLocationSearchChange(event: Event | CustomEvent): void {
    const rawValue = (event as CustomEvent)?.detail?.value ?? (event.target as HTMLInputElement)?.value ?? '';
    this.locationSearchTerm = String(rawValue);

    const selectedLocationId = this.registerForm.get('location')?.value;
    if (selectedLocationId) {
      const selectedLocation = this.locations.find((location) => location.id === Number(selectedLocationId));
      if (selectedLocation && !this.matchesLocationInput(selectedLocation, this.locationSearchTerm)) {
        this.registerForm.get('location')?.setValue(null, { emitEvent: false });
      }
    }

    this.filterLocations();
    this.showLocationSuggestions = !!this.registerForm.get('city')?.value;
  }

  onCityInputFocus(): void {
    if (!this.registerForm.get('state')?.value) {
      return;
    }
    this.filteredCities = [...this.cities];
    this.showCitySuggestions = true;
  }

  onCityInputBlur(): void {
    this.registerForm.get('city')?.markAsTouched();
    setTimeout(() => {
      this.showCitySuggestions = false;
    }, 150);
  }

  onLocationInputFocus(): void {
    if (!this.registerForm.get('city')?.value) {
      return;
    }
    this.filteredLocations = [...this.locations];
    this.showLocationSuggestions = true;
  }

  onLocationInputBlur(): void {
    this.registerForm.get('location')?.markAsTouched();
    setTimeout(() => {
      this.showLocationSuggestions = false;
    }, 150);
  }

  selectCity(city: City, event?: Event): void {
    event?.preventDefault();
    this.registerForm.patchValue({ city: city.id, location: null }, { emitEvent: false });
    this.citySearchTerm = this.getCityDisplayName(city);
    this.locationSearchTerm = '';
    this.showCitySuggestions = false;
    this.locations = [];
    this.filteredLocations = [];
    this.loadLocations(city.id);
  }

  selectLocation(location: Location, event?: Event): void {
    event?.preventDefault();
    this.registerForm.get('location')?.setValue(location.id, { emitEvent: false });
    this.locationSearchTerm = this.getLocationDisplayName(location);
    this.showLocationSuggestions = false;
  }

  clearSelectedCity(): void {
    this.registerForm.patchValue({ city: null, location: null }, { emitEvent: false });
    this.citySearchTerm = '';
    this.locationSearchTerm = '';
    this.locations = [];
    this.filteredLocations = [];
    this.filteredCities = [...this.cities];
    this.showCitySuggestions = false;
    this.showLocationSuggestions = false;
  }

  clearSelectedLocation(): void {
    this.registerForm.get('location')?.setValue(null, { emitEvent: false });
    this.locationSearchTerm = '';
    this.filteredLocations = [...this.locations];
    this.showLocationSuggestions = false;
  }

  toggleLoginPasswordVisibility() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegisterPasswordVisibility() {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  toggleForgotNewPasswordVisibility() {
    this.showForgotNewPassword = !this.showForgotNewPassword;
  }

  toggleForgotConfirmPasswordVisibility() {
    this.showForgotConfirmPassword = !this.showForgotConfirmPassword;
  }

  passwordMatchValidator(control: AbstractControl) {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  emailOrPhoneValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return { required: true };

    // Simple email validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    // Simple phone validation (numeric, 10+ digits)
    const phonePattern = /^[0-9]{10,15}$/;

    if (emailPattern.test(value) || phonePattern.test(value)) {
      return null;
    }

    return { invalidFormat: true };
  }

  private isValidEmail(value: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailPattern.test(value.trim());
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const credentials: LoginCredentials = {
      identifier: this.loginForm.value.identifier,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          // Check if email verification is required
          if (response.email_verification_required) {
            this.pendingVerificationEmail = credentials.identifier;
            this.authMode = 'verify-email';
            this.presentToast(
              this.translate.instant('AUTH.EMAIL_NOT_VERIFIED'),
              'warning'
            );
            return;
          }

          this.presentToast(this.translate.instant('AUTH.LOGIN_SUCCESS'), 'success');
          this.initUserLanguage();

          // Save language preference to database after login
          const savedLang = localStorage.getItem('preferred_language') || 'en';
          const langObj = this.languages.find(l => l.code === savedLang);
          if (langObj) {
            this.translateApiService.setLanguagePreference(langObj.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                error: () => {
                  // Silently fail - language preference already set locally
                }
              });
          }

          const userRole = this.authService.getUserRole();
          setTimeout(() => {
            switch (userRole) {
              case 'admin':
                this.router.navigate(['/admin/control-tower']);
                break;
              case 'ops_l1':
                this.router.navigate(['/ops/dashboard']);
                break;
              case 'finance':
                this.router.navigate(['/finance/dashboard']);
                break;
              case 'wholesaler':
                this.router.navigate(['/wholesaler/business-registration']);
                break;
              case 'retailer':
                this.router.navigate(['/buyer/business-registration']);
                break;
              case 'driver':
                this.router.navigate(['/transport/driver-registration']);
                break;
              default:
                this.presentToast(this.translate.instant('AUTH.UNKNOWN_ROLE_ERROR'), 'danger');
            }
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;

          let errorMessage = this.translate.instant('AUTH.LOGIN_ERROR');

          // Check for email verification error
          if (error.status === 403 && error.error && error.error.error === 'email_not_verified') {
            this.pendingVerificationEmail = credentials.identifier;
            this.authMode = 'verify-email';
            errorMessage = this.translate.instant('AUTH.EMAIL_NOT_VERIFIED');
          } else if (error.error && error.error.error) {
            if (error.error.error.includes('invalid credentials')) {
              errorMessage = this.translate.instant('AUTH.INVALID_CREDENTIALS');
            }
          } else if (error.status === 0) {
            errorMessage = this.translate.instant('AUTH.CONNECTION_ERROR');
          }

          this.presentToast(errorMessage, 'danger');
        }
      });
  }

  openForgotPasswordModal() {
    this.authMode = 'forgot-password';
    this.forgotPasswordMode = 'request';
    this.forgotPasswordErrorKey = '';
    this.stopForgotPasswordTimers();

    const existingIdentifier = this.loginForm.get('identifier')?.value;
    const normalized = String(existingIdentifier ?? '').trim().toLowerCase();
    if (normalized && this.isValidEmail(normalized)) {
      this.forgotPasswordForm.patchValue({ email: normalized }, { emitEvent: false });
    } else {
      this.forgotPasswordForm.patchValue({ email: '' }, { emitEvent: false });
    }
  }

  closeForgotPasswordModal() {
    this.authMode = 'login';
    this.resetForgotPasswordFlow();
  }

  backToForgotRequest() {
    this.forgotPasswordMode = 'request';
    this.forgotPasswordErrorKey = '';
    this.forgotPasswordForm.patchValue({ code: '', newPassword: '', confirmPassword: '' }, { emitEvent: false });
  }

  submitForgotPasswordRequest() {
    const emailControl = this.forgotPasswordForm.get('email');

    if (!emailControl || emailControl.invalid) {
      emailControl?.markAsTouched();
      return;
    }

    this.isForgotLoading = true;
    this.forgotPasswordErrorKey = '';
    const email = String(emailControl.value).trim().toLowerCase();

    this.authService.requestPasswordReset(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isForgotLoading = false;
          this.forgotPasswordEmail = email;
          this.forgotPasswordMaskedDestination = this.maskEmail(email);
          this.forgotPasswordMode = 'reset';
          this.forgotPasswordForm.patchValue({ code: '', newPassword: '', confirmPassword: '' }, { emitEvent: false });
          this.forgotPasswordForm.get('code')?.markAsUntouched();
          this.forgotPasswordForm.get('newPassword')?.markAsUntouched();
          this.forgotPasswordForm.get('confirmPassword')?.markAsUntouched();
          this.startForgotPasswordExpiryCountdown(response.expires_in_seconds ?? 600);
          this.startForgotPasswordResendCooldown(response.resend_after_seconds ?? 60);

          this.presentToast(this.translate.instant('AUTH.FORGOT_PASSWORD_CODE_SENT'), 'success');
        },
        error: () => {
          this.isForgotLoading = false;
          this.forgotPasswordErrorKey = 'AUTH.FORGOT_PASSWORD_REQUEST_FAILED';
          this.presentToast(this.translate.instant(this.forgotPasswordErrorKey), 'danger');
        }
      });
  }

  submitForgotPasswordReset() {
    const codeControl = this.forgotPasswordForm.get('code');
    const newPasswordControl = this.forgotPasswordForm.get('newPassword');
    const confirmPasswordControl = this.forgotPasswordForm.get('confirmPassword');

    codeControl?.markAsTouched();
    newPasswordControl?.markAsTouched();
    confirmPasswordControl?.markAsTouched();

    if (this.forgotPasswordForm.invalid || this.forgotPasswordExpirySeconds <= 0) {
      if (this.forgotPasswordExpirySeconds <= 0) {
        this.forgotPasswordErrorKey = 'AUTH.FORGOT_PASSWORD_CODE_EXPIRED';
      }
      return;
    }

    this.isForgotLoading = true;
    this.forgotPasswordErrorKey = '';

    this.authService.resetPasswordWithCode({
      email: this.forgotPasswordEmail,
      code: String(codeControl?.value).trim(),
      newPassword: String(newPasswordControl?.value)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isForgotLoading = false;
          this.forgotPasswordMode = 'success';
          this.stopForgotPasswordTimers();
          this.presentToast(this.translate.instant('AUTH.FORGOT_PASSWORD_RESET_SUCCESS'), 'success');
        },
        error: (error) => {
          this.isForgotLoading = false;

          const errorCode = error?.error?.error;
          if (errorCode === 'reset_code_invalid') {
            this.forgotPasswordErrorKey = 'AUTH.FORGOT_PASSWORD_INVALID_CODE';
          } else if (errorCode === 'reset_code_expired') {
            this.forgotPasswordErrorKey = 'AUTH.FORGOT_PASSWORD_CODE_EXPIRED';
          } else if (errorCode === 'weak_password') {
            this.forgotPasswordErrorKey = 'AUTH.FORGOT_PASSWORD_WEAK_PASSWORD';
          } else {
            this.forgotPasswordErrorKey = 'AUTH.FORGOT_PASSWORD_RESET_FAILED';
          }

          this.presentToast(this.translate.instant(this.forgotPasswordErrorKey), 'danger');
        }
      });
  }

  resendForgotPasswordCode() {
    if (this.forgotPasswordResendCooldown > 0 || this.isResendResetCodeLoading) {
      return;
    }

    this.isResendResetCodeLoading = true;
    this.forgotPasswordErrorKey = '';

    this.authService.resendPasswordReset(this.forgotPasswordEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isResendResetCodeLoading = false;
          this.startForgotPasswordExpiryCountdown(response.expires_in_seconds ?? 600);
          this.startForgotPasswordResendCooldown(response.resend_after_seconds ?? 60);
          this.presentToast(this.translate.instant('AUTH.FORGOT_PASSWORD_CODE_RESENT'), 'success');
        },
        error: () => {
          this.isResendResetCodeLoading = false;
          this.forgotPasswordErrorKey = 'AUTH.FORGOT_PASSWORD_REQUEST_FAILED';
          this.presentToast(this.translate.instant(this.forgotPasswordErrorKey), 'danger');
        }
      });
  }

  forgotPasswordContinueToLogin() {
    this.closeForgotPasswordModal();
    this.authMode = 'login';
  }

  getForgotPasswordCountdownLabel(): string {
    const totalSeconds = Math.max(this.forgotPasswordExpirySeconds, 0);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  private maskEmail(email: string): string {
    const [username, domain] = email.trim().split('@');
    if (!username || !domain) {
      return email;
    }

    const safeUsername = username.length > 2
      ? `${username[0]}${'*'.repeat(Math.max(username.length - 2, 1))}${username[username.length - 1]}`
      : `${username[0] ?? ''}*`;

    return `${safeUsername}@${domain}`;
  }

  private startForgotPasswordExpiryCountdown(seconds: number) {
    if (this.forgotPasswordExpiryTimer) {
      clearInterval(this.forgotPasswordExpiryTimer);
    }

    this.forgotPasswordExpirySeconds = Math.max(seconds, 0);
    this.forgotPasswordExpiryTimer = setInterval(() => {
      this.forgotPasswordExpirySeconds--;

      if (this.forgotPasswordExpirySeconds <= 0) {
        this.forgotPasswordExpirySeconds = 0;
        clearInterval(this.forgotPasswordExpiryTimer);
      }
    }, 1000);
  }

  private startForgotPasswordResendCooldown(seconds: number) {
    if (this.forgotPasswordResendTimer) {
      clearInterval(this.forgotPasswordResendTimer);
    }

    this.forgotPasswordResendCooldown = Math.max(seconds, 0);
    this.forgotPasswordResendTimer = setInterval(() => {
      this.forgotPasswordResendCooldown--;

      if (this.forgotPasswordResendCooldown <= 0) {
        this.forgotPasswordResendCooldown = 0;
        clearInterval(this.forgotPasswordResendTimer);
      }
    }, 1000);
  }

  private stopForgotPasswordTimers() {
    if (this.forgotPasswordExpiryTimer) {
      clearInterval(this.forgotPasswordExpiryTimer);
      this.forgotPasswordExpiryTimer = null;
    }

    if (this.forgotPasswordResendTimer) {
      clearInterval(this.forgotPasswordResendTimer);
      this.forgotPasswordResendTimer = null;
    }
  }

  private resetForgotPasswordFlow() {
    this.stopForgotPasswordTimers();
    this.isForgotLoading = false;
    this.isResendResetCodeLoading = false;
    this.forgotPasswordMode = 'request';
    this.forgotPasswordEmail = '';
    this.forgotPasswordMaskedDestination = '';
    this.forgotPasswordExpirySeconds = 0;
    this.forgotPasswordResendCooldown = 0;
    this.forgotPasswordErrorKey = '';
    this.showForgotNewPassword = false;
    this.showForgotConfirmPassword = false;

    this.forgotPasswordForm.patchValue({
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: ''
    }, { emitEvent: false });
  }


  onRegisterSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.citySearchTerm.trim() && !this.registerForm.get('city')?.value) {
      this.registerForm.get('city')?.markAsTouched();
      this.presentToast(this.translate.instant('AUTH.SELECT_CITY_FROM_LIST'), 'warning');
      return;
    }

    if (this.locationSearchTerm.trim() && !this.registerForm.get('location')?.value) {
      this.registerForm.get('location')?.markAsTouched();
      this.presentToast(this.translate.instant('AUTH.SELECT_LOCATION_FROM_LIST'), 'warning');
      return;
    }

    this.isLoading = true;
    const formData = { ...this.registerForm.value };

    const userData = {
      identifier: formData.identifier,
      password: formData.password,
      name: formData.name,
      address: formData.address,
      pincode: formData.pincode,
      location: formData.location,
      state: formData.state,
      role_id: formData.role_id,
      active_status: formData.active_status
    };

    this.authService.registerUser(userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          // Check if email verification is required
          if (response.email_verification_required) {
            this.pendingVerificationEmail = formData.identifier;
            this.authMode = 'verify-email';
            this.presentToast(
              this.translate.instant('AUTH.VERIFICATION_EMAIL_SENT'),
              'success'
            );
          } else {
            // Phone registration - no verification needed
            this.presentToast(this.translate.instant('AUTH.REGISTER_SUCCESS'), 'success');
            this.registerForm.reset({
              state: null,
              city: null,
              location: null,
              address: '',
              pincode: '',
              active_status: 1
            });
            this.cities = [];
            this.locations = [];
            this.filteredCities = [];
            this.filteredLocations = [];
            this.citySearchTerm = '';
            this.locationSearchTerm = '';
            this.showCitySuggestions = false;
            this.showLocationSuggestions = false;
            this.authMode = 'login';
          }
        },
        error: (error) => {
          this.isLoading = false;

          let errorMessage = this.translate.instant('AUTH.REGISTER_ERROR');

          if (error.error && typeof error.error === 'object' && error.error.error) {
            if (error.error.error.includes('already exists')) {
              errorMessage = this.translate.instant('AUTH.USER_EXISTS_ERROR');
            } else if (error.error.error.includes('Invalid email')) {
              errorMessage = this.translate.instant('AUTH.INVALID_EMAIL_ERROR');
            }
          } else if (error.status === 0) {
            errorMessage = this.translate.instant('AUTH.CONNECTION_ERROR');
          } else if (error.status === 400) {
            errorMessage = this.translate.instant('AUTH.VALIDATION_ERROR');
          }

          this.presentToast(errorMessage, 'danger');
        }
      });
  }


  loadStates() {
    this.isLoadingStates = true;
    this.authService.getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => {
          this.states = states;
          this.isLoadingStates = false;
        },
        error: (error) => {
          this.isLoadingStates = false;
          this.presentToast(this.translate.instant('AUTH.LOAD_STATES_ERROR'), 'danger');
        }
      });
  }

  loadCities(stateId: number) {
    this.isLoadingCities = true;
    this.authService.getCitiesOfState(stateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cities) => {
          this.cities = cities;
          this.filteredCities = [...cities];
          this.syncCitySearchFromSelection();
          this.isLoadingCities = false;
        },
        error: (error) => {
          this.isLoadingCities = false;
          this.presentToast(this.translate.instant('AUTH.LOAD_CITIES_ERROR'), 'danger');
        }
      });
  }

  loadLocations(cityId: number) {
    this.isLoadingLocations = true;
    this.authService.getLocationsByCity(cityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locations) => {
          this.locations = locations;
          this.filteredLocations = [...locations];
          this.syncLocationSearchFromSelection();
          this.isLoadingLocations = false;
        },
        error: (error) => {
          this.isLoadingLocations = false;
          this.presentToast(this.translate.instant('AUTH.LOAD_LOCATIONS_ERROR'), 'danger');
        }
      });
  }

  async resendVerificationEmail() {
    if (this.resendCooldown > 0) return;

    this.isResending = true;
    this.authService.resendVerification(this.pendingVerificationEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isResending = false;
          this.presentToast(this.translate.instant('AUTH.VERIFICATION_EMAIL_RESENT'), 'success');
          this.startCooldown(60);
        },
        error: (error) => {
          this.isResending = false;
          let errorMessage = this.translate.instant('AUTH.RESEND_FAILED');
          if (error.error && error.error.error === 'Email already verified') {
            errorMessage = this.translate.instant('AUTH.EMAIL_ALREADY_VERIFIED');
            this.authMode = 'login';
          }
          this.presentToast(errorMessage, 'danger');
        }
      });
  }

  private startCooldown(seconds: number) {
    this.resendCooldown = seconds;
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownTimer);
      }
    }, 1000);
  }

  backToLogin() {
    this.authMode = 'login';
    this.pendingVerificationEmail = '';
    this.loginForm.reset();
  }

  private filterCities(): void {
    const searchTerm = this.citySearchTerm.trim().toLowerCase();
    if (!searchTerm) {
      this.filteredCities = [...this.cities];
      return;
    }

    this.filteredCities = this.cities.filter((city) =>
      this.getCitySearchText(city).includes(searchTerm)
    );
  }

  private filterLocations(): void {
    const searchTerm = this.locationSearchTerm.trim().toLowerCase();
    if (!searchTerm) {
      this.filteredLocations = [...this.locations];
      return;
    }

    this.filteredLocations = this.locations.filter((location) =>
      this.getLocationSearchText(location).includes(searchTerm)
    );
  }

  private syncCitySearchFromSelection(): void {
    const selectedCityId = this.registerForm.get('city')?.value;
    if (!selectedCityId) {
      return;
    }

    const selectedCity = this.cities.find((city) => city.id === Number(selectedCityId));
    this.citySearchTerm = selectedCity ? this.getCityDisplayName(selectedCity) : '';
  }

  private syncLocationSearchFromSelection(): void {
    const selectedLocationId = this.registerForm.get('location')?.value;
    if (!selectedLocationId) {
      return;
    }

    const selectedLocation = this.locations.find((location) => location.id === Number(selectedLocationId));
    this.locationSearchTerm = selectedLocation ? this.getLocationDisplayName(selectedLocation) : '';
  }

  private reloadReferenceDataForLanguage(): void {
    this.authService.clearReferenceDataCache();
    this.loadStates();

    const stateId = Number(this.registerForm.get('state')?.value);
    if (stateId) {
      this.loadCities(stateId);
    }

    const cityId = Number(this.registerForm.get('city')?.value);
    if (cityId) {
      this.loadLocations(cityId);
    }
  }

  getStateDisplayName(state: State): string {
    return state.state_name || state.state_name_en || '';
  }

  getCityDisplayName(city: City): string {
    return city.city_name || city.city_name_en || '';
  }

  getLocationDisplayName(location: Location): string {
    return location.location_name || location.location_name_en || '';
  }

  private getCitySearchText(city: City): string {
    return [
      city.city_name,
      city.city_name_en,
      city.city_shortname,
    ].filter(Boolean).join(' ').toLowerCase();
  }

  private getLocationSearchText(location: Location): string {
    return [
      location.location_name,
      location.location_name_en,
      location.city_name,
      location.city_name_en,
    ].filter(Boolean).join(' ').toLowerCase();
  }

  private matchesCityInput(city: City, input: string): boolean {
    const normalizedInput = input.trim().toLowerCase();
    return [
      city.city_name,
      city.city_name_en,
    ].filter(Boolean).some((value) => value!.toLowerCase() === normalizedInput);
  }

  private matchesLocationInput(location: Location, input: string): boolean {
    const normalizedInput = input.trim().toLowerCase();
    return [
      location.location_name,
      location.location_name_en,
    ].filter(Boolean).some((value) => value!.toLowerCase() === normalizedInput);
  }

  // Language selection methods
  async selectLanguage() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('AUTH.SELECT_LANGUAGE'),
      inputs: this.languages.map(lang => ({
        type: 'radio' as const,
        label: lang.name,
        value: lang.code,
        checked: lang.code === this.selectedLanguage
      })),
      buttons: [
        {
          text: this.translate.instant('AUTH.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('AUTH.OK'),
          handler: (selectedCode: string) => {
            if (selectedCode) {
              this.changeLanguage(selectedCode);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  changeLanguage(langCode: string) {
    const lang = this.languages.find(l => l.code === langCode);
    if (!lang) return;

    const normalizedLangCode = this.normalizeLanguageCode(langCode);
    this.selectedLanguage = normalizedLangCode;
    this.currentLanguageName = lang.name;
    localStorage.setItem('preferred_language', normalizedLangCode);
    localStorage.setItem('appLang', normalizedLangCode);
    this.authService.clearReferenceDataCache();
    this.translate.use(normalizedLangCode);

    // Save to backend/database for persistence across sessions
    if (this.authService.getToken()) {
      // Only save to backend if user is already authenticated
      this.translateApiService.setLanguagePreference(lang.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Language preference saved successfully to database
          },
          error: () => {
            // Silently fail - language preference already set locally
          }
        });
    }
  }

  private normalizeLanguageCode(langCode: string): string {
    const baseLang = String(langCode || 'en').toLowerCase().split('-')[0];
    return this.languages.some((lang) => lang.code === baseLang) ? baseLang : 'en';
  }

  ngOnDestroy() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
    this.stopForgotPasswordTimers();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
