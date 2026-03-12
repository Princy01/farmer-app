import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save, create, chevronBack, close } from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { BusinessInfoService } from './business-info.service';

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
  businessInfo: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
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
      address: ['', [Validators.required, Validators.minLength(5)]],
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

  private loadBusinessInfo(): void {
    this.businessInfoService
      .getBusinessInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.businessInfo = res.data;
          this.form.patchValue(res.data);
        },
        error: async (err) => {
          const msg = err?.error?.error ?? 'WHOLESALER_BUSINESS_INFO.LOAD_ERROR';
          await this.showToast(msg, 'danger', false);
        },
      });
  }

  enableEdit() {
    this.isEditMode = true;
    this.form.get('address')?.enable();
    this.form.get('gst_number')?.enable();
  }

  cancelEdit() {
    this.isEditMode = false;
    this.form.patchValue(this.businessInfo);
    this.form.get('address')?.disable();
    this.form.get('gst_number')?.disable();
    this.form.markAsUntouched();
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.showToast('WHOLESALER_BUSINESS_INFO.FIX_ERRORS', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('WHOLESALER_BUSINESS_INFO.UPDATING'),
    });
    await loading.present();

    const payload = {
      address: this.form.get('address')?.value,
      gst_number: this.form.get('gst_number')?.value,
    };

    this.businessInfoService
      .updateBusiness(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          await loading.dismiss();
          this.businessInfo = { ...this.businessInfo, ...payload };
          this.isEditMode = false;
          this.form.get('address')?.disable();
          this.form.get('gst_number')?.disable();
          await this.showToast('WHOLESALER_BUSINESS_INFO.UPDATE_SUCCESS', 'success');
        },
        error: async (err) => {
          await loading.dismiss();
          const serverMsg: string = err?.error?.error ?? '';

          let toastMsg: string;
          if (serverMsg.includes('GST number already exists')) {
            toastMsg = this.translate.instant('WHOLESALER_BUSINESS_INFO.GST_EXISTS');
          } else if (serverMsg.includes('No changes detected')) {
            toastMsg = this.translate.instant('WHOLESALER_BUSINESS_INFO.NO_CHANGES');
          } else if (serverMsg.includes('Address must be at least')) {
            toastMsg = this.translate.instant('WHOLESALER_BUSINESS_INFO.ADDRESS_TOO_SHORT');
          } else {
            toastMsg = this.translate.instant('WHOLESALER_BUSINESS_INFO.UPDATE_FAILED');
          }

          await this.showToast(toastMsg, 'danger', false);
        },
      });
  }

  private async showToast(message: string, color: string, useTranslate = true) {
    const toast = await this.toastCtrl.create({
      message: useTranslate ? this.translate.instant(message) : message,
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }
}