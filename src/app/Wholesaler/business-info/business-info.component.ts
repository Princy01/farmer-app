import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save, create, chevronBack, close } from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { BusinessInfoService } from './business-info.service';
import { EmailVerificationModalComponent } from './email-verification-modal.component';

@Component({
  selector: 'app-business-info',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './business-info.component.html',
  styleUrls: ['./business-info.component.scss'],
})
export class BusinessInfoComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isEditMode = false;
  isLoading = false;
  businessInfo: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    private router: Router,
    private businessInfoService: BusinessInfoService
  ) {
    this.form = this.fb.group({
      b_registration_num: [{ value: '', disabled: true }],
      b_owner_name: [{ value: '', disabled: true }],
      b_category_name: [{ value: '', disabled: true }],
      b_type_name: [{ value: '', disabled: true }],
      established_year: [{ value: '', disabled: true }],
      state_name: [{ value: '', disabled: true }],
      city_name: [{ value: '', disabled: true }],
      location_name: [{ value: '', disabled: true }],
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      mobile_number: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      gst_number: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{15}$/)]],
      pan_number: [{ value: '', disabled: true }],
    });

    addIcons({ save, create, chevronBack, close });
  }

  ngOnInit(): void {
    this.loadBusinessInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load business information from API with user-friendly error handling
   */
  private loadBusinessInfo(): void {
    this.isLoading = true;
    this.businessInfoService
      .getBusinessInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res?.data) {
            this.businessInfo = res.data;
            this.form.patchValue(res.data);
          } else {
            this.showToast('WHOLESALER_BUSINESS_INFO.INVALID_DATA', 'danger');
          }
        },
        error: async (err) => {
          this.isLoading = false;
          const userMsg = this.getErrorMessage(err);
          await this.showToast(userMsg, 'danger');
        },
      });
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private getErrorMessage(error: any): string {
    if (!error) return 'WHOLESALER_BUSINESS_INFO.UNKNOWN_ERROR';

    if (error.name === 'TimeoutError') {
      return 'WHOLESALER_BUSINESS_INFO.REQUEST_TIMEOUT';
    }
    if (error.status === 0) {
      return 'WHOLESALER_BUSINESS_INFO.NETWORK_ERROR';
    }
    if (error.status === 401) {
      return 'WHOLESALER_BUSINESS_INFO.SESSION_EXPIRED';
    }
    if (error.status === 403) {
      return 'WHOLESALER_BUSINESS_INFO.PERMISSION_DENIED';
    }
    if (error.status === 404) {
      return 'WHOLESALER_BUSINESS_INFO.NOT_FOUND';
    }
    if (error.status >= 500) {
      return 'WHOLESALER_BUSINESS_INFO.SERVER_ERROR';
    }

    return error?.error?.error ?? 'WHOLESALER_BUSINESS_INFO.LOAD_ERROR';
  }

  enableEdit() {
    this.isEditMode = true;
    const addressControl = this.form.get('address');
    const gstControl = this.form.get('gst_number');

    if (addressControl) addressControl.enable();
    if (gstControl) gstControl.enable();
  }

  cancelEdit() {
    this.isEditMode = false;
    if (this.businessInfo) {
      this.form.patchValue(this.businessInfo);
    }
    const addressControl = this.form.get('address');
    const gstControl = this.form.get('gst_number');

    if (addressControl) addressControl.disable();
    if (gstControl) gstControl.disable();

    this.form.markAsUntouched();
  }

  /**
   * Submit form with validation and user feedback
   */
  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.showToast('WHOLESALER_BUSINESS_INFO.FIX_ERRORS', 'danger');
      return;
    }

    const addressVal = this.form.get('address')?.value;
    const gstVal = this.form.get('gst_number')?.value;

    // Ensure we have required values
    if (!addressVal || !gstVal) {
      await this.showToast('WHOLESALER_BUSINESS_INFO.FIX_ERRORS', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('WHOLESALER_BUSINESS_INFO.UPDATING'),
      spinner: 'crescent',
    });
    await loading.present();

    const payload = {
      address: addressVal.trim(),
      gst_number: gstVal.trim().toUpperCase(),
    };

    this.businessInfoService
      .updateBusiness(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          await loading.dismiss();
          if (this.businessInfo) {
            this.businessInfo = { ...this.businessInfo, ...payload };
          }
          this.isEditMode = false;
          const addressControl = this.form.get('address');
          const gstControl = this.form.get('gst_number');
          if (addressControl) addressControl.disable();
          if (gstControl) gstControl.disable();
          this.form.markAsUntouched();
          await this.showToast('WHOLESALER_BUSINESS_INFO.UPDATE_SUCCESS', 'success');
        },
        error: async (err) => {
          await loading.dismiss();
          const userMsg = this.getUpdateErrorMessage(err);
          await this.showToast(userMsg, 'danger');
        },
      });
  }

  /**
   * Convert technical update errors to user-friendly messages
   */
  private getUpdateErrorMessage(error: any): string {
    if (!error) return 'WHOLESALER_BUSINESS_INFO.UPDATE_FAILED';

    if (error.name === 'TimeoutError') {
      return 'WHOLESALER_BUSINESS_INFO.REQUEST_TIMEOUT';
    }
    if (error.status === 0) {
      return 'WHOLESALER_BUSINESS_INFO.NETWORK_ERROR';
    }
    if (error.status === 401) {
      return 'WHOLESALER_BUSINESS_INFO.SESSION_EXPIRED';
    }

    const serverMsg: string = error?.error?.error ?? '';
    if (serverMsg.includes('GST number already exists')) {
      return 'WHOLESALER_BUSINESS_INFO.GST_EXISTS';
    }
    if (serverMsg.includes('No changes detected')) {
      return 'WHOLESALER_BUSINESS_INFO.NO_CHANGES';
    }
    if (serverMsg.includes('Address must be at least')) {
      return 'WHOLESALER_BUSINESS_INFO.ADDRESS_TOO_SHORT';
    }

    return 'WHOLESALER_BUSINESS_INFO.UPDATE_FAILED';
  }

  /**
   * Display toast notification with auto-translation
   */
  private async showToast(message: string, color: string, useTranslate = true) {
    const toast = await this.toastCtrl.create({
      message: useTranslate ? this.translate.instant(message) : message,
      duration: color === 'success' ? 2500 : 3500,
      color,
      position: 'bottom',
      buttons: [{
        text: this.translate.instant('COMMON.DISMISS'),
        role: 'cancel',
      }],
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }

  async openEmailVerificationModal() {
    const modal = await this.modalCtrl.create({
      component: EmailVerificationModalComponent,
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    // Optionally refresh business info after successful email change
    if (data?.emailUpdated) {
      this.loadBusinessInfo();
    }
  }
}