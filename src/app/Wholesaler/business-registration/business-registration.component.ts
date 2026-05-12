import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save } from 'ionicons/icons';
import { BusinessType, BusinessCategory, BusinessRegistrationService } from './business-registration.service';
import { AuthService } from 'src/app/auth/auth.service';
import { WholesalerApiService } from '../services/wholesaler-api.service';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

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
  businessTypes: BusinessType[] = [];
  isSubmitting = false;

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
      mobile_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      established_year: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      user_id: [null, Validators.required],
      gst_number: ['', Validators.required],
      pan_number: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
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
    this.fetchBusinessCategories();
    this.fetchBusinessTypes();
  }

  private setUserId(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.form.get('user_id')?.setValue(userId);
    } else {
      this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.USER_ID_NOT_FOUND');
    }
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

    const payload = this.form.value;

    this.businessRegistrationService.addNewBusiness(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          await loading.dismiss();
          this.isSubmitting = false;
          await this.showSuccessToast('WHOLESALER_BUSINESS_REGISTRATION.REGISTRATION_SUCCESS');
          this.form.reset();
          this.router.navigate(['/wholesaler/add-business-location']);
        },
        error: async (err) => {
          await loading.dismiss();
          this.isSubmitting = false;
          await this.showErrorToast('WHOLESALER_BUSINESS_REGISTRATION.REGISTRATION_FAILED');
        }
      });
  }
}