import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonicModule,
  AlertController,
  LoadingController,
  ToastController,
  NavController
} from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  phonePortraitOutline,
  businessOutline,
  checkmarkCircleOutline,
  timeOutline,
  warningOutline
} from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  PaymentDetailsService,
  PaymentDetailsResponse,
  PaymentDetailsSubmitRequest,
  PaymentDestinationType,
  PayeePayoutDestination
} from '../services/payment-details.service';

@Component({
  selector: 'app-payment-details',
  templateUrl: './payment-details.page.html',
  styleUrls: ['./payment-details.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class PaymentDetailsPage implements OnInit {
  isLoading = true;
  isSubmitting = false;
  loadError: string | null = null;
  details: PaymentDetailsResponse | null = null;
  returnUrl: string | null = null;

  destinationType: PaymentDestinationType = 'upi';
  displayLabel = 'Primary payout';
  accountHolderName = '';
  upiId = '';
  bankName = '';
  branchName = '';
  ifscCode = '';
  accountNumber = '';
  notes = '';

  constructor(
    private paymentDetailsService: PaymentDetailsService,
    private translate: TranslateService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({
      arrowBackOutline,
      phonePortraitOutline,
      businessOutline,
      checkmarkCircleOutline,
      timeOutline,
      warningOutline
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.loadDetails();
  }

  async loadDetails(): Promise<void> {
    this.isLoading = true;
    this.loadError = null;

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PAYMENT_DETAILS.LOADING')
    });
    await loading.present();

    this.paymentDetailsService.getMyPaymentDetails().subscribe({
      next: (details) => {
        this.details = details;
        this.isLoading = false;
        this.loadError = null;
        loading.dismiss();
      },
      error: () => {
        this.isLoading = false;
        this.loadError = this.translate.instant('PAYMENT_DETAILS.LOAD_ERROR');
        loading.dismiss();
      }
    });
  }

  getStatusLabel(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'verified':
        return this.translate.instant('PAYMENT_DETAILS.STATUS_VERIFIED');
      case 'pending':
        return this.translate.instant('PAYMENT_DETAILS.STATUS_PENDING');
      case 'rejected':
        return this.translate.instant('PAYMENT_DETAILS.STATUS_REJECTED');
      case 'needs_update':
        return this.translate.instant('PAYMENT_DETAILS.STATUS_NEEDS_UPDATE');
      default:
        return this.translate.instant('PAYMENT_DETAILS.STATUS_MISSING');
    }
  }

  getStatusIcon(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'verified':
        return 'checkmark-circle-outline';
      case 'pending':
        return 'time-outline';
      case 'rejected':
      case 'needs_update':
        return 'warning-outline';
      default:
        return 'warning-outline';
    }
  }

  getStatusMessage(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'verified':
        return this.translate.instant('PAYMENT_DETAILS.VERIFIED_MESSAGE');
      case 'pending':
        return this.translate.instant('PAYMENT_DETAILS.PENDING_MESSAGE');
      case 'rejected':
      case 'needs_update':
        return this.translate.instant('PAYMENT_DETAILS.UPDATE_REQUIRED_MESSAGE');
      default:
        return this.translate.instant('PAYMENT_DETAILS.MISSING_MESSAGE');
    }
  }

  getExistingDetails(): PayeePayoutDestination | null {
    const items = this.details?.items || [];
    return items.length > 0 ? items[0] : null;
  }

  canSubmit(): boolean {
    if (!this.accountHolderName.trim()) {
      return false;
    }
    if (this.destinationType === 'upi') {
      return !!this.upiId.trim();
    }
    return !!this.bankName.trim() && !!this.ifscCode.trim() && !!this.accountNumber.trim();
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) {
      await this.showToast(this.translate.instant('PAYMENT_DETAILS.REQUIRED_FIELDS'), 'warning');
      return;
    }

    this.isSubmitting = true;

    const payload: PaymentDetailsSubmitRequest = {
      destination_type: this.destinationType,
      display_label: this.displayLabel.trim() || 'Primary payout',
      account_holder_name: this.accountHolderName.trim(),
      notes: this.notes.trim() || undefined
    };

    if (this.destinationType === 'upi') {
      payload.upi_id = this.upiId.trim();
    } else {
      payload.bank_name = this.bankName.trim();
      payload.branch_name = this.branchName.trim() || undefined;
      payload.ifsc_code = this.ifscCode.trim();
      payload.account_number = this.accountNumber.trim();
    }

    this.paymentDetailsService.submitMyPaymentDetails(payload).subscribe({
      next: async () => {
        this.isSubmitting = false;
        await this.showToast(this.translate.instant('PAYMENT_DETAILS.SUBMIT_SUCCESS'), 'success');
        await this.loadDetails();
      },
      error: async () => {
        this.isSubmitting = false;
        await this.showToast(this.translate.instant('PAYMENT_DETAILS.SUBMIT_ERROR'), 'danger');
      }
    });
  }

  async continue(): Promise<void> {
    if (this.returnUrl) {
      await this.router.navigateByUrl(this.returnUrl);
      return;
    }
    this.navCtrl.back();
  }

  async goBack(): Promise<void> {
    this.navCtrl.back();
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  async showDetailsInfo(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PAYMENT_DETAILS.TITLE'),
      message: this.translate.instant('PAYMENT_DETAILS.INFO_MESSAGE'),
      buttons: [this.translate.instant('PAYMENT_DETAILS.OK')]
    });
    await alert.present();
  }

  maskAccountNumber(accountNumber?: string): string {
    if (!accountNumber) {
      return '';
    }
    const trimmed = accountNumber.trim();
    if (trimmed.length <= 4) {
      return trimmed;
    }
    return `${'*'.repeat(trimmed.length - 4)}${trimmed.slice(-4)}`;
  }
}
