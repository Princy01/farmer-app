import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save, create, chevronBack } from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil, of } from 'rxjs';
import { Router } from '@angular/router';
import { EmailVerificationModalComponent } from './email-verification-modal.component';
import { BusinessInfoService, UpdateBusinessRequest } from './business-info.service';

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
  businessInfo: any = null; // Replace with your model

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
      address: ['', Validators.required],
      mobile_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      gst_number: ['', Validators.required],
      pan_number: [{ value: '', disabled: true }],
    });

    addIcons({ save, create, chevronBack });
  }

  ngOnInit(): void {
    this.loadBusinessInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBusinessInfo(): void {
    this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_BUSINESS_INFO.LOADING'),
    }).then(async (loading) => {
      await loading.present();
      this.isLoading = true;

      this.businessInfoService
        .getBusinessInfo()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            if (!res?.data) {
              loading.dismiss();
              this.showToast('RETAILER_BUSINESS_INFO.LOAD_ERROR', 'danger');
              return;
            }
            this.businessInfo = res.data;
            this.form.patchValue(res.data);
            loading.dismiss();
          },
          error: async (err) => {
            this.isLoading = false;
            await loading.dismiss();
            const msg = err?.error?.error ?? 'RETAILER_BUSINESS_INFO.LOAD_ERROR';
            await this.showToast(msg, 'danger');
          },
        });
    });
  }

  enableEdit() {
    this.isEditMode = true;
    this.form.get('address')?.enable();
    this.form.get('mobile_number')?.enable();
    this.form.get('email')?.enable();
    this.form.get('gst_number')?.enable();
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.showToast('RETAILER_BUSINESS_INFO.FIX_ERRORS', 'danger');
      return;
    }

    if (this.isLoading) {
      return; // Prevent double-submit
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_BUSINESS_INFO.UPDATING'),
    });
    await loading.present();
    this.isLoading = true;

    const payload: UpdateBusinessRequest = {
      address: this.form.get('address')?.value,
      gst_number: this.form.get('gst_number')?.value,
    };

    this.businessInfoService
      .updateBusiness(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.isLoading = false;
          await loading.dismiss();
          this.businessInfo = { ...this.businessInfo, ...payload };
          this.isEditMode = false;
          this.cancelEdit();
          await this.showToast('RETAILER_BUSINESS_INFO.UPDATE_SUCCESS', 'success');
        },
        error: async (err) => {
          this.isLoading = false;
          await loading.dismiss();
          const serverMsg: string = err?.error?.error ?? '';
          let toastMsg: string;

          if (serverMsg.includes('GST number already exists')) {
            toastMsg = this.translate.instant('RETAILER_BUSINESS_INFO.GST_EXISTS');
          } else if (serverMsg.includes('No changes detected')) {
            toastMsg = this.translate.instant('RETAILER_BUSINESS_INFO.NO_CHANGES');
          } else if (serverMsg.includes('Address must be at least')) {
            toastMsg = this.translate.instant('RETAILER_BUSINESS_INFO.ADDRESS_TOO_SHORT');
          } else {
            toastMsg = this.translate.instant('RETAILER_BUSINESS_INFO.UPDATE_FAILED');
          }

          await this.showToast(toastMsg, 'danger');
        },
      });
  }

  cancelEdit() {
    this.isEditMode = false;
    this.form.patchValue(this.businessInfo);
    this.form.get('address')?.disable();
    this.form.get('mobile_number')?.disable();
    this.form.get('email')?.disable();
    this.form.get('gst_number')?.disable();
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  private async showToast(messageKey: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
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

  goBack() {
    this.router.navigate(['/buyer/buyer-home']);
  }
}