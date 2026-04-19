import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, firstValueFrom, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  cameraOutline,
  helpCircleOutline,
  imageOutline,
  trashOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { OrderFullDetails, WholesalerApiService } from '../../services/wholesaler-api.service';
import {
  AddEvidencePayload,
  BuyerDisputesApiError,
  BuyerDisputesService,
  CreateDisputePayload,
  CreateDisputeResponse,
  DuplicateDisputeCase,
  IssueType,
} from '../wholesaler-disputes.service';

interface PendingEvidenceItem {
  id: number;
  file: File;
  previewUrl: string;
  caption: string;
  capturedAt: string;
  capturedLatitude?: number;
  capturedLongitude?: number;
}

@Component({
  selector: 'app-report-issue',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './report-issue.component.html',
  styleUrls: ['./report-issue.component.scss'],
})
export class ReportIssueComponent implements OnInit, OnDestroy {
  @ViewChild('webCameraVideo') webCameraVideo?: ElementRef<HTMLVideoElement>;

  order: OrderFullDetails | null = null;
  issueTypes: IssueType[] = [];

  loading = true;
  submitting = false;
  isStartingCamera = false;
  isWebCameraOpen = false;
  error: string | null = null;
  evidenceError: string | null = null;

  selectedIssueTypeId: number | null = null;
  otherIssueTitle = '';
  description = '';
  evidenceCaption = '';
  pendingEvidence: PendingEvidenceItem[] = [];
  duplicateExistingCase: DuplicateDisputeCase | null = null;
  blockRetry = false;

  issueTypeError: string | null = null;
  otherIssueTitleError: string | null = null;
  descriptionError: string | null = null;

  private orderId: number | null = null;
  private webCameraStream: MediaStream | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private wholesalerService: WholesalerApiService,
    private disputesService: BuyerDisputesService,
    private translate: TranslateService
  ) {
    addIcons({
      alertCircleOutline,
      arrowBackOutline,
      cameraOutline,
      helpCircleOutline,
      imageOutline,
      trashOutline,
    });
  }

  ngOnInit(): void {
    this.loadScreenData();
  }

  ngOnDestroy(): void {
    this.closeWebCamera();
    this.clearPendingEvidence();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadScreenData(): void {
    const routeOrderId = this.route.snapshot.paramMap.get('orderId');

    if (!routeOrderId || Number.isNaN(+routeOrderId) || +routeOrderId <= 0) {
      this.error = this.translate.instant('BUYER_DISPUTES.ERROR_INVALID_ORDER_ID');
      this.loading = false;
      return;
    }

    this.orderId = +routeOrderId;
    this.loading = true;
    this.error = null;
    this.blockRetry = false;
    this.duplicateExistingCase = null;

    forkJoin({
      order: this.wholesalerService.getOrderFullDetails(this.orderId),
      issueTypesResponse: this.disputesService.getIssueTypes(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ order, issueTypesResponse }) => {
          this.order = order;
          this.issueTypes = (issueTypesResponse.items || []).filter((item) => item.is_active);
          this.loading = false;
        },
        error: (err: Error | BuyerDisputesApiError) => {
          this.error = this.resolveErrorMessage(err);
          this.loading = false;
        },
      });
  }

  submit(): void {
    this.clearValidationErrors();
    this.blockRetry = false;
    this.duplicateExistingCase = null;

    if (!this.validateForm() || !this.order) {
      return;
    }

    const title = this.isOtherIssueTypeSelected() ? this.otherIssueTitle.trim() : undefined;

    const payload: CreateDisputePayload = {
      issue_type_id: this.selectedIssueTypeId as number,
      title,
      description: this.description.trim(),
      source_channel: 'app',
      order_id: this.order.order_id,
    };

    this.submitting = true;

    this.disputesService
      .createDispute(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response: CreateDisputeResponse) => {
          try {
            await this.uploadQueuedEvidence(response.case_id);
            this.clearPendingEvidence();

            this.submitting = false;
            this.router.navigate(['/wholesaler/issue-submitted', response.case_id], {
              queryParams: {
                caseReference: response.case_reference,
                status: response.status,
                orderId: this.order?.order_id,
              },
            });
          } catch {
            this.clearPendingEvidence();
            this.submitting = false;
            this.router.navigate(['/wholesaler/issue-detail', response.case_id], {
              queryParams: {
                evidenceUploadNotice: '1',
              },
            });
          }
        },
        error: (err: BuyerDisputesApiError) => {
          this.submitting = false;

          if (this.isDuplicateDisputeError(err)) {
            this.error = this.translate.instant('BUYER_DISPUTES.ERROR_DUPLICATE_OPEN_DISPUTE');
            this.duplicateExistingCase = err.existingCase || null;
            this.blockRetry = true;
            return;
          }

          if (this.isManualCaseWindowError(err)) {
            this.error = this.translate.instant('BUYER_DISPUTES.ERROR_MANUAL_CASE_REQUIRED');
            this.blockRetry = true;
            return;
          }

          this.error = this.resolveErrorMessage(err, true);
        },
      });
  }

  onIssueTypeChange(): void {
    this.issueTypeError = null;
    this.otherIssueTitleError = null;

    if (!this.isOtherIssueTypeSelected()) {
      this.otherIssueTitle = '';
    }
  }

  isOtherIssueTypeSelected(): boolean {
    if (!this.selectedIssueTypeId) {
      return false;
    }

    const selectedIssueType = this.issueTypes.find((type) => type.id === this.selectedIssueTypeId);
    if (!selectedIssueType) {
      return false;
    }

    const normalizedCode = this.normalizeIssueTypeToken(selectedIssueType.code);
    const normalizedName = this.normalizeIssueTypeToken(selectedIssueType.name);
    return normalizedCode === 'other' || normalizedName === 'other';
  }

  openExistingIssue(): void {
    if (!this.duplicateExistingCase?.case_id) {
      return;
    }

    this.router.navigate(['/wholesaler/issue-detail', this.duplicateExistingCase.case_id]);
  }

  async startEvidenceCapture(): Promise<void> {
    this.evidenceError = null;

    if (this.submitting || this.isStartingCamera) {
      return;
    }

    if (this.pendingEvidence.length >= 3) {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_EVIDENCE_LIMIT');
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await this.captureViaNativeCamera();
      return;
    }

    await this.openWebCamera();
  }

  async captureFromWebCamera(): Promise<void> {
    if (!this.webCameraVideo?.nativeElement) {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_CAMERA_CAPTURE_FAILED');
      return;
    }

    const video = this.webCameraVideo.nativeElement;

    if (!video.videoWidth || !video.videoHeight) {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_CAMERA_CAPTURE_FAILED');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_CAMERA_CAPTURE_FAILED');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((generatedBlob) => resolve(generatedBlob), 'image/jpeg', 0.92);
    });

    if (!blob) {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_CAMERA_CAPTURE_FAILED');
      return;
    }

    const file = new File([blob], `evidence_${Date.now()}.jpg`, { type: 'image/jpeg' });
    await this.queueEvidence(file);
    this.closeWebCamera();
  }

  cancelWebCameraCapture(): void {
    this.closeWebCamera();
  }

  removePendingEvidence(index: number): void {
    const item = this.pendingEvidence[index];
    if (!item) {
      return;
    }

    URL.revokeObjectURL(item.previewUrl);
    this.pendingEvidence.splice(index, 1);
  }

  trackByPendingEvidence(_index: number, item: PendingEvidenceItem): number {
    return item.id;
  }

  goBack(): void {
    if (this.orderId) {
      this.router.navigate(['/wholesaler/order-details', this.orderId]);
      return;
    }

    this.router.navigate(['/wholesaler/orders']);
  }

  goToMyIssues(): void {
    this.router.navigate(['/wholesaler/my-issues']);
  }

  trackByIssueType(_index: number, item: IssueType): number {
    return item.id;
  }

  getIssueTypeLabel(issueType: IssueType): string {
    const translationKey = this.getIssueTypeTranslationKey(issueType.code);
    return this.translateWithFallback(translationKey, issueType.name);
  }

  private validateForm(): boolean {
    let isValid = true;

    if (!this.selectedIssueTypeId) {
      this.issueTypeError = this.translate.instant('BUYER_DISPUTES.ERROR_ISSUE_TYPE_REQUIRED');
      isValid = false;
    }

    if (this.isOtherIssueTypeSelected() && !this.otherIssueTitle.trim()) {
      this.otherIssueTitleError = this.translate.instant('BUYER_DISPUTES.ERROR_OTHER_TITLE_REQUIRED');
      isValid = false;
    }

    if (this.otherIssueTitle.trim().length > 120) {
      this.otherIssueTitleError = this.translate.instant('BUYER_DISPUTES.ERROR_OTHER_TITLE_MAX', { max: 120 });
      isValid = false;
    }

    if (!this.description.trim()) {
      this.descriptionError = this.translate.instant('BUYER_DISPUTES.ERROR_DESCRIPTION_REQUIRED');
      isValid = false;
    }

    if (this.description.trim().length > 1000) {
      this.descriptionError = this.translate.instant('BUYER_DISPUTES.ERROR_DESCRIPTION_MAX', { max: 1000 });
      isValid = false;
    }

    return isValid;
  }

  private clearValidationErrors(): void {
    this.issueTypeError = null;
    this.otherIssueTitleError = null;
    this.descriptionError = null;
    this.error = null;
  }

  private async captureViaNativeCamera(): Promise<void> {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!photo.webPath) {
        this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_CAMERA_CAPTURE_FAILED');
        return;
      }

      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const file = new File([blob], `evidence_${Date.now()}.${photo.format || 'jpg'}`, {
        type: blob.type || 'image/jpeg',
      });

      await this.queueEvidence(file);
    } catch {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_CAMERA_CAPTURE_FAILED');
    }
  }

  private async openWebCamera(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_CAMERA_NOT_SUPPORTED');
      return;
    }

    this.isStartingCamera = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: 'environment',
          },
        },
        audio: false,
      });

      this.webCameraStream = stream;
      this.isWebCameraOpen = true;

      const video = await this.waitForWebCameraVideoElement();

      video.srcObject = stream;
      await video.play();
    } catch (error: unknown) {
      this.evidenceError = this.getWebCameraErrorMessage(error);
      this.closeWebCamera();
    } finally {
      this.isStartingCamera = false;
    }
  }

  private async waitForWebCameraVideoElement(): Promise<HTMLVideoElement> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const video = this.webCameraVideo?.nativeElement;
      if (video) {
        return video;
      }

      await new Promise<void>((resolve) => setTimeout(resolve, 30));
    }

    throw new Error('camera_video_not_ready');
  }

  private getWebCameraErrorMessage(error: unknown): string {
    const errorName = (error as { name?: string })?.name || '';

    if (errorName === 'NotAllowedError' || errorName === 'SecurityError') {
      return this.translate.instant('BUYER_DISPUTES.ERROR_CAMERA_PERMISSION');
    }

    if (
      errorName === 'NotFoundError' ||
      errorName === 'OverconstrainedError' ||
      errorName === 'DevicesNotFoundError'
    ) {
      return this.translate.instant('BUYER_DISPUTES.ERROR_CAMERA_NOT_SUPPORTED');
    }

    return this.translate.instant('BUYER_DISPUTES.ERROR_CAMERA_CAPTURE_FAILED');
  }

  private closeWebCamera(): void {
    if (this.webCameraStream) {
      this.webCameraStream.getTracks().forEach((track) => track.stop());
      this.webCameraStream = null;
    }

    if (this.webCameraVideo?.nativeElement) {
      this.webCameraVideo.nativeElement.srcObject = null;
    }

    this.isWebCameraOpen = false;
  }

  private async queueEvidence(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_IMAGE_ONLY');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_IMAGE_SIZE');
      return;
    }

    if (this.pendingEvidence.length >= 3) {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_EVIDENCE_LIMIT');
      return;
    }

    const location = await this.tryGetCurrentLocation();

    this.pendingEvidence.push({
      id: Date.now() + Math.floor(Math.random() * 10000),
      file,
      previewUrl: URL.createObjectURL(file),
      caption: this.evidenceCaption.trim(),
      capturedAt: new Date().toISOString(),
      capturedLatitude: location?.latitude,
      capturedLongitude: location?.longitude,
    });

    this.evidenceCaption = '';
    this.evidenceError = null;
  }

  private async uploadQueuedEvidence(disputeId: number): Promise<void> {
    for (const item of this.pendingEvidence) {
      const payload: AddEvidencePayload = {
        image: item.file,
        caption: item.caption,
        capture_source: 'camera',
        captured_at: item.capturedAt,
        captured_latitude: item.capturedLatitude,
        captured_longitude: item.capturedLongitude,
      };

      await firstValueFrom(this.disputesService.addEvidence(disputeId, payload));
    }
  }

  private clearPendingEvidence(): void {
    for (const item of this.pendingEvidence) {
      URL.revokeObjectURL(item.previewUrl);
    }

    this.pendingEvidence = [];
  }

  private async tryGetCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    if (!('geolocation' in navigator)) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => resolve(null),
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000,
        }
      );
    });
  }

  private resolveErrorMessage(error: Error | BuyerDisputesApiError, preferApiMessage: boolean = false): string {
    const typedError = error as BuyerDisputesApiError;

    if (preferApiMessage && typedError.apiMessage) {
      return typedError.apiMessage;
    }

    if (typedError.translationKey) {
      return this.translate.instant(typedError.translationKey);
    }

    if (error.message) {
      const translated = this.translate.instant(error.message);
      return translated !== error.message ? translated : error.message;
    }

    return this.translate.instant('BUYER_DISPUTES.ERROR_GENERIC');
  }

  private isDuplicateDisputeError(error: BuyerDisputesApiError): boolean {
    return error.statusCode === 409 && error.errorCode === 'duplicate_dispute';
  }

  private isManualCaseWindowError(error: BuyerDisputesApiError): boolean {
    const message = (error.apiMessage || '').toLowerCase();
    return (
      message.includes('within 5 minutes of delivery') &&
      (message.includes('contact support') || message.includes('manual case creation'))
    );
  }

  private normalizeIssueTypeToken(value?: string): string {
    return (value || '').trim().toLowerCase();
  }

  private getIssueTypeTranslationKey(issueTypeCode: string): string {
    const normalizedCode = (issueTypeCode || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    return `BUYER_DISPUTES.ISSUE_TYPE_${normalizedCode}`;
  }

  private translateWithFallback(translationKey: string, fallback: string): string {
    const translated = this.translate.instant(translationKey);
    return translated !== translationKey ? translated : fallback;
  }
}
