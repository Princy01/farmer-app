import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  chevronForwardOutline,
  imageOutline,
  trashOutline,
  addOutline,
  cameraOutline,
} from 'ionicons/icons';
import { ReturnReason } from '../retailer-order-details.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface EvidenceImage {
  id: number;
  file: File;
  previewUrl: string;
  capturedAt: string;
}

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
  currentStep: 'reasons' | 'remarks' | 'evidence' | 'success' | 'error' = 'reasons';
  selectedReasonId: number | null = null;
  selectedReasonDescription: string = '';
  submitting = false;
  errorMessage = '';

  // Evidence (local collection only — no upload yet)
  readonly MAX_IMAGES = 3;
  evidenceImages: EvidenceImage[] = [];
  isStartingCamera = false;
  isWebCameraOpen = false;
  evidenceError: string | null = null;

  private webCameraStream: MediaStream | null = null;

  constructor(
    private modalCtrl: ModalController,
    private formBuilder: FormBuilder
  ) {
    addIcons({
      closeOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      chevronForwardOutline,
      imageOutline,
      trashOutline,
      addOutline,
      cameraOutline,
    });
  }

  ngOnInit(): void {
    this.returnForm = this.formBuilder.group({
      remarks: ['', [Validators.maxLength(500)]]
    });
  }

  // ─── Step 1 ───────────────────────────────────────────────────────────────

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

  // ─── Step 2 ───────────────────────────────────────────────────────────────

  proceedToEvidence(): void {
    this.currentStep = 'evidence';
  }

  // ─── Step 3: Evidence (local collection) ──────────────────────────────────

  get canAddMoreImages(): boolean {
    return this.evidenceImages.length < this.MAX_IMAGES;
  }

  get hasMinimumEvidence(): boolean {
    return this.evidenceImages.length >= 1;
  }

  async startEvidenceCapture(): Promise<void> {
    this.evidenceError = null;

    if (this.isStartingCamera) {
      return;
    }

    if (this.evidenceImages.length >= this.MAX_IMAGES) {
      this.evidenceError = 'RETAILER_ORDER_DETAILS.EVIDENCE_STEP_LABEL';
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await this.captureViaCamera();
      return;
    }

    await this.openWebCamera();
  }

  async captureFromWebCamera(): Promise<void> {
    const video = document.querySelector('#returnEvidenceModalVideo') as HTMLVideoElement;
    if (!video || !video.videoWidth || !video.videoHeight) {
      this.evidenceError = 'RETAILER_ORDER_DETAILS.RETURN_EVIDENCE_CAMERA_FAILED';
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      this.evidenceError = 'RETAILER_ORDER_DETAILS.RETURN_EVIDENCE_CAMERA_FAILED';
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((generatedBlob) => resolve(generatedBlob), 'image/jpeg', 0.92);
    });

    if (!blob) {
      this.evidenceError = 'RETAILER_ORDER_DETAILS.RETURN_EVIDENCE_CAMERA_FAILED';
      return;
    }

    const file = new File([blob], `return_evidence_${Date.now()}.jpg`, { type: 'image/jpeg' });
    this.addEvidenceImage(file);
    this.closeWebCamera();
  }

  cancelEvidenceCapture(): void {
    this.closeWebCamera();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    input.value = '';

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.evidenceError = 'RETAILER_ORDER_DETAILS.EVIDENCE_INVALID_TYPE';
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      this.evidenceError = 'RETAILER_ORDER_DETAILS.EVIDENCE_TOO_LARGE';
      return;
    }

    this.addEvidenceImage(file);
  }

  private addEvidenceImage(file: File): void {
    if (this.evidenceImages.length >= this.MAX_IMAGES) {
      this.evidenceError = 'RETAILER_ORDER_DETAILS.EVIDENCE_LIMIT';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const evidence: EvidenceImage = {
      id: Date.now() + Math.floor(Math.random() * 10000),
      file,
      previewUrl,
      capturedAt: new Date().toISOString(),
    };

    this.evidenceImages.push(evidence);
    this.evidenceError = null;
  }

  removeImage(index: number): void {
    const evidence = this.evidenceImages[index];
    if (evidence.previewUrl) {
      URL.revokeObjectURL(evidence.previewUrl);
    }
    this.evidenceImages.splice(index, 1);
  }

  trackByEvidence(_index: number, item: EvidenceImage): number {
    return item.id;
  }

  private async captureViaCamera(): Promise<void> {
    try {
      this.isStartingCamera = true;
      const photo = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!photo.webPath) {
        this.evidenceError = 'RETAILER_ORDER_DETAILS.RETURN_EVIDENCE_CAMERA_FAILED';
        return;
      }

      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const file = new File([blob], `return_evidence_${Date.now()}.${photo.format || 'jpg'}`, {
        type: blob.type || 'image/jpeg',
      });

      this.addEvidenceImage(file);
    } catch (error) {
      this.evidenceError = this.getCameraErrorMessage(error);
    } finally {
      this.isStartingCamera = false;
    }
  }

  private async openWebCamera(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.evidenceError = 'RETAILER_ORDER_DETAILS.RETURN_EVIDENCE_CAMERA_NOT_SUPPORTED';
      return;
    }

    this.isStartingCamera = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      this.webCameraStream = stream;
      this.isWebCameraOpen = true;

      // Wait for video element to be rendered
      await this.waitForVideoElement();
      const video = document.querySelector('#returnEvidenceModalVideo') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch (error: unknown) {
      this.evidenceError = this.getCameraErrorMessage(error);
    } finally {
      this.isStartingCamera = false;
    }
  }

  private async waitForVideoElement(): Promise<void> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const video = document.querySelector('#returnEvidenceModalVideo');
      if (video) {
        return;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 30));
    }
    throw new Error('video_element_not_ready');
  }

  private closeWebCamera(): void {
    if (this.webCameraStream) {
      this.webCameraStream.getTracks().forEach((track) => track.stop());
      this.webCameraStream = null;
    }

    const video = document.querySelector('#returnEvidenceModalVideo') as HTMLVideoElement;
    if (video) {
      video.srcObject = null;
    }

    this.isWebCameraOpen = false;
  }

  private getCameraErrorMessage(error: unknown): string {
    const errorName = (error as { name?: string })?.name || '';

    if (errorName === 'NotAllowedError' || errorName === 'SecurityError') {
      return 'RETAILER_ORDER_DETAILS.RETURN_EVIDENCE_CAMERA_PERMISSION';
    }

    if (errorName === 'NotFoundError' || errorName === 'OverconstrainedError' || errorName === 'DevicesNotFoundError') {
      return 'RETAILER_ORDER_DETAILS.RETURN_EVIDENCE_CAMERA_NOT_SUPPORTED';
    }

    return 'RETAILER_ORDER_DETAILS.RETURN_EVIDENCE_CAMERA_FAILED';
  }

  // ─── Final submit ─────────────────────────────────────────────────────────

  async submitReturn(): Promise<void> {
    if (!this.selectedReasonId || this.submitting || !this.hasMinimumEvidence) {
      return;
    }

    this.submitting = true;
    const remarks = this.returnForm.get('remarks')?.value || '';
    const evidenceFiles = this.evidenceImages.map((img) => ({
      file: img.file,
      capturedAt: img.capturedAt,
    }));

    try {
      await this.modalCtrl.dismiss({
        returnReasonId: this.selectedReasonId,
        remarks,
        evidenceFiles, // Pass files, not URLs — they'll be uploaded after dispute is created
      });
    } catch {
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
    this.evidenceImages.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
    });
    await this.modalCtrl.dismiss();
  }

  getRemarksCharCount(): number {
    return this.returnForm.get('remarks')?.value?.length || 0;
  }
}