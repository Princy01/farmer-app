import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBack, businessOutline, documentTextOutline } from 'ionicons/icons';
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
  isLoading = false;
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
      pan_number: [{ value: '', disabled: true }],
      aadhaar_number: [{ value: '', disabled: true }],
      government_license_number: [{ value: '', disabled: true }],
    });

    addIcons({ chevronBack, businessOutline, documentTextOutline });
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

  private async showToast(messageKey: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/buyer/buyer-home']);
  }
}