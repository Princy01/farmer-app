import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkCircleOutline, alertCircleOutline, chevronForwardOutline } from 'ionicons/icons';
import { ReturnReason } from '../retailer-order-details.service';

@Component({
  selector: 'app-return-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, TranslateModule, TranslatePipe],
  templateUrl: './return-request-modal.component.html',
  styleUrls: ['./return-request-modal.component.scss']
})
export class ReturnRequestModalComponent implements OnInit {
  @Input() returnReasons: ReturnReason[] = [];

  returnForm!: FormGroup;
  currentStep: 'reasons' | 'remarks' | 'success' | 'error' = 'reasons';
  selectedReasonId: number | null = null;
  selectedReasonDescription: string = '';
  submitting = false;
  errorMessage = '';

  constructor(
    private modalCtrl: ModalController,
    private formBuilder: FormBuilder
  ) {
    addIcons({ closeOutline, checkmarkCircleOutline, alertCircleOutline, chevronForwardOutline });
  }

  ngOnInit(): void {
    this.returnForm = this.formBuilder.group({
      remarks: ['', [Validators.maxLength(500)]]
    });
  }

  selectReason(reasonId: number, description: string): void {
    this.selectedReasonId = reasonId;
    this.selectedReasonDescription = description;
  }

  proceedToRemarks(): void {
    if (this.selectedReasonId) {
      this.currentStep = 'remarks';
    }
  }

  backToReasons(): void {
    this.currentStep = 'reasons';
    this.selectedReasonId = null;
    this.selectedReasonDescription = '';
  }

  async submitReturn(): Promise<void> {
    if (!this.selectedReasonId || this.submitting) {
      return;
    }

    this.submitting = true;
    const remarks = this.returnForm.get('remarks')?.value || '';

    try {
      await this.modalCtrl.dismiss({
        returnReasonId: this.selectedReasonId,
        remarks: remarks
      });
    } catch (err) {
      this.submitting = false;
    }
  }

  showSuccess(): void {
    this.currentStep = 'success';
    setTimeout(() => {
      this.close();
    }, 2000);
  }

  showError(message: string): void {
    this.currentStep = 'error';
    this.errorMessage = message;
  }

  async close(): Promise<void> {
    await this.modalCtrl.dismiss();
  }

  getRemarksCharCount(): number {
    return this.returnForm.get('remarks')?.value?.length || 0;
  }
}
