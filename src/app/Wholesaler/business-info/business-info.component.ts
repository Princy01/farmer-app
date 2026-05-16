import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
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
}