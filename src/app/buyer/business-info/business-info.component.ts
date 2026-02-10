import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save, create, chevronBack } from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil, of } from 'rxjs';
import { Router } from '@angular/router';

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
  businessInfo: any = null; // Replace with your model

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private translate: TranslateService,
    private router: Router
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
    // TODO: Replace with API call
    const mockData = {
      b_registration_num: 'REG123456',
      b_owner_name: 'John Doe',
      b_category_name: 'Grains',
      b_type_name: 'Private Ltd',
      established_year: '2015',
      state_name: 'Maharashtra',
      city_name: 'Mumbai',
      location_name: 'Andheri',
      address: '123, Main Street, Andheri',
      mobile_number: '9876543210',
      email: 'john@example.com',
      gst_number: '27ABCDE1234F1Z5',
      pan_number: 'ABCDE1234F',
    };
    this.businessInfo = mockData;
    this.form.patchValue(mockData);
  }

  enableEdit() {
    this.isEditMode = true;
    this.form.get('address')?.enable();
    this.form.get('mobile_number')?.enable();
    this.form.get('email')?.enable();
    this.form.get('gst_number')?.enable();
  }

  async onSubmit() {
      await this.showToast('RETAILER_BUSINESS_INFO.FIX_ERRORS', 'danger');

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_BUSINESS_INFO.UPDATING'),
    });
    await loading.present();

    // TODO: Replace with API call
    setTimeout(async () => {
      await loading.dismiss();
      this.isEditMode = false;
      this.form.get('address')?.disable();
      this.form.get('mobile_number')?.disable();
      this.form.get('email')?.disable();
      this.form.get('gst_number')?.disable();
      await this.showToast('RETAILER_BUSINESS_INFO.UPDATE_SUCCESS', 'success');
    }, 1200);
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