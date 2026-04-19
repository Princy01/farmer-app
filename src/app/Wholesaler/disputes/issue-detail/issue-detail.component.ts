import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  cameraOutline,
  imageOutline,
  refreshOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import {
  AddEvidencePayload,
  BuyerDisputesApiError,
  BuyerDisputesService,
  DisputeAction,
  DisputeDetail,
  DisputeEvidence,
  IssueType,
} from '../wholesaler-disputes.service';

interface DisputeEvidenceView extends DisputeEvidence {
  imageUrl?: string;
}

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './issue-detail.component.html',
  styleUrls: ['./issue-detail.component.scss'],
})
export class IssueDetailComponent implements OnInit, OnDestroy {
  @ViewChild('webCameraVideo') webCameraVideo?: ElementRef<HTMLVideoElement>;

  dispute: DisputeDetail | null = null;
  actions: DisputeAction[] = [];
  evidenceItems: DisputeEvidenceView[] = [];

  loading = true;
  loadingActions = false;
  loadingEvidence = false;
  uploadingEvidence = false;
  isStartingCamera = false;
  isWebCameraOpen = false;

  error: string | null = null;
  evidenceError: string | null = null;

  caption = '';

  private disputeId: number | null = null;
  private pendingReplaceEvidenceId: number | null = null;
  private webCameraStream: MediaStream | null = null;
  private initialEvidenceNotice: string | null = null;
  private issueTypeCodeById = new Map<number, string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private disputesService: BuyerDisputesService,
    private translate: TranslateService
  ) {
    addIcons({
      alertCircleOutline,
      arrowBackOutline,
      cameraOutline,
      imageOutline,
      refreshOutline,
    });
  }

  ngOnInit(): void {
    const evidenceUploadNotice = this.route.snapshot.queryParamMap.get('evidenceUploadNotice');
    if (evidenceUploadNotice === '1') {
      this.initialEvidenceNotice = this.translate.instant('BUYER_DISPUTES.ERROR_EVIDENCE_UPLOAD_CONTINUE');
    }

    this.loadIssueTypes();
    this.loadDisputeDetail();
  }

  ngOnDestroy(): void {
    this.closeWebCamera();
    this.revokeEvidenceUrls();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDisputeDetail(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id || Number.isNaN(+id) || +id <= 0) {
      this.error = this.translate.instant('BUYER_DISPUTES.ERROR_INVALID_DISPUTE_ID');
      this.loading = false;
      return;
    }

    this.disputeId = +id;
    this.error = null;
    this.loading = true;

    this.disputesService
      .getDisputeById(this.disputeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dispute = response;
          this.loading = false;
          this.loadActions();
          this.refreshEvidence();
        },
        error: (err: BuyerDisputesApiError) => {
          this.error = this.resolveErrorMessage(err);
          this.loading = false;
        },
      });
  }

  loadActions(): void {
    if (!this.disputeId) {
      return;
    }

    this.loadingActions = true;

    this.disputesService
      .getDisputeActions(this.disputeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.actions = response.items || [];
          this.loadingActions = false;
        },
        error: () => {
          this.actions = [];
          this.loadingActions = false;
        },
      });
  }

  refreshEvidence(): void {
    if (!this.disputeId) {
      return;
    }

    this.loadingEvidence = true;

    if (this.initialEvidenceNotice) {
      this.evidenceError = this.initialEvidenceNotice;
      this.initialEvidenceNotice = null;
    } else {
      this.evidenceError = null;
    }

    this.disputesService
      .getDisputeEvidence(this.disputeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.revokeEvidenceUrls();
          this.evidenceItems = (response.items || []).map((item) => ({ ...item }));
          this.loadingEvidence = false;
          this.hydrateEvidenceFiles();
        },
        error: (err: BuyerDisputesApiError) => {
          this.evidenceItems = [];
          this.loadingEvidence = false;
          this.evidenceError = this.resolveErrorMessage(err);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/wholesaler/my-issues']);
  }

  goToOrder(): void {
    if (!this.dispute?.order_id) {
      return;
    }

    this.router.navigate(['/wholesaler/order-details', this.dispute.order_id]);
  }

  async startEvidenceCapture(): Promise<void> {
    this.evidenceError = null;
    this.pendingReplaceEvidenceId = null;

    if (!this.disputeId || this.uploadingEvidence || this.isStartingCamera) {
      return;
    }

    if (this.evidenceItems.length >= 3) {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_EVIDENCE_LIMIT');
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await this.captureViaNativeCamera();
      return;
    }

    await this.openWebCamera();
  }

  async startEvidenceReplacement(evidenceId: number): Promise<void> {
    this.evidenceError = null;

    if (!this.disputeId || this.uploadingEvidence || this.isStartingCamera) {
      return;
    }

    this.pendingReplaceEvidenceId = evidenceId;

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

    await this.uploadEvidenceFile(file, this.pendingReplaceEvidenceId);
    this.closeWebCamera();
    this.pendingReplaceEvidenceId = null;
  }

  cancelWebCameraCapture(): void {
    this.closeWebCamera();
    this.pendingReplaceEvidenceId = null;
  }

  getStatusLabel(status: string): string {
    const normalized = (status || '').toLowerCase();
    const map: Record<string, string> = {
      new: 'BUYER_DISPUTES.STATUS_ISSUE_RECEIVED',
      triaged: 'BUYER_DISPUTES.STATUS_MORE_INFORMATION_NEEDED',
      awaiting_evidence: 'BUYER_DISPUTES.STATUS_MORE_INFORMATION_NEEDED',
      under_review: 'BUYER_DISPUTES.STATUS_UNDER_REVIEW',
      pending_external_action: 'BUYER_DISPUTES.STATUS_WAITING_FOR_UPDATE',
      pending_execution: 'BUYER_DISPUTES.STATUS_ACTION_IN_PROGRESS',
      resolved: 'BUYER_DISPUTES.STATUS_RESOLVED',
      closed: 'BUYER_DISPUTES.STATUS_CLOSED',
      cancelled: 'BUYER_DISPUTES.STATUS_CLOSED',
    };

    return this.translate.instant(map[normalized] || 'BUYER_DISPUTES.STATUS_ISSUE_RECEIVED');
  }

  getStatusColor(status: string): string {
    const normalized = (status || '').toLowerCase();
    const map: Record<string, string> = {
      new: 'primary',
      triaged: 'warning',
      awaiting_evidence: 'warning',
      under_review: 'tertiary',
      pending_external_action: 'warning',
      pending_execution: 'secondary',
      resolved: 'success',
      closed: 'medium',
      cancelled: 'medium',
    };

    return map[normalized] || 'medium';
  }

  trackByAction(_index: number, action: DisputeAction): number {
    return action.action_id;
  }

  trackByEvidence(_index: number, evidence: DisputeEvidenceView): number {
    return evidence.evidence_id;
  }

  getIssueTypeLabel(): string {
    if (!this.dispute) {
      return '-';
    }

    const issueTypeCode = this.issueTypeCodeById.get(this.dispute.issue_type_id);
    if (!issueTypeCode) {
      return this.dispute.issue_type_name;
    }

    const translationKey = this.getIssueTypeTranslationKey(issueTypeCode);
    return this.translateWithFallback(translationKey, this.dispute.issue_type_name);
  }

  formatActionType(actionType: string): string {
    if (!actionType) {
      return this.translate.instant('BUYER_DISPUTES.ACTION_UPDATE');
    }

    const normalized = actionType.trim().toLowerCase();
    const knownActionTranslationKeys: Record<string, string> = {
      case_created: 'BUYER_DISPUTES.ACTION_CASE_CREATED',
      status_changed: 'BUYER_DISPUTES.ACTION_STATUS_CHANGED',
      evidence_added: 'BUYER_DISPUTES.ACTION_EVIDENCE_ADDED',
      note_added: 'BUYER_DISPUTES.ACTION_NOTE_ADDED',
      assignment_changed: 'BUYER_DISPUTES.ACTION_ASSIGNMENT_CHANGED',
      sla_updated: 'BUYER_DISPUTES.ACTION_SLA_UPDATED',
    };

    const translationKey =
      knownActionTranslationKeys[normalized] ||
      `BUYER_DISPUTES.ACTION_TYPE_${normalized.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
    const translated = this.translate.instant(translationKey);

    if (translated !== translationKey) {
      return translated;
    }

    return actionType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private loadIssueTypes(): void {
    this.disputesService
      .getIssueTypes()
      .pipe(
        catchError(() => of({ items: [] as IssueType[] })),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.issueTypeCodeById.clear();

        for (const issueType of response.items || []) {
          this.issueTypeCodeById.set(issueType.id, issueType.code);
        }
      });
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
      const fileType = blob.type || 'image/jpeg';
      const extension = photo.format || 'jpg';
      const file = new File([blob], `evidence_${Date.now()}.${extension}`, { type: fileType });

      await this.uploadEvidenceFile(file, this.pendingReplaceEvidenceId);
      this.pendingReplaceEvidenceId = null;
    } catch {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_CAMERA_CAPTURE_FAILED');
      this.pendingReplaceEvidenceId = null;
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

  private async uploadEvidenceFile(file: File, evidenceIdToReplace: number | null = null): Promise<void> {
    if (!this.disputeId) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_IMAGE_ONLY');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      this.evidenceError = this.translate.instant('BUYER_DISPUTES.ERROR_IMAGE_SIZE');
      return;
    }

    const location = await this.tryGetCurrentLocation();

    const payload: AddEvidencePayload = {
      image: file,
      caption: this.caption.trim(),
      capture_source: 'camera',
      captured_at: new Date().toISOString(),
      captured_latitude: location?.latitude,
      captured_longitude: location?.longitude,
    };

    this.uploadingEvidence = true;
    this.evidenceError = null;

    const uploadRequest =
      typeof evidenceIdToReplace === 'number'
        ? this.disputesService.replaceEvidence(this.disputeId, evidenceIdToReplace, payload)
        : this.disputesService.addEvidence(this.disputeId, payload);

    uploadRequest.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.caption = '';
        this.uploadingEvidence = false;
        this.pendingReplaceEvidenceId = null;
        this.refreshEvidence();
      },
      error: (err: BuyerDisputesApiError) => {
        this.uploadingEvidence = false;
        this.pendingReplaceEvidenceId = null;
        this.evidenceError = this.resolveErrorMessage(err, true);
      },
    });
  }

  private async hydrateEvidenceFiles(): Promise<void> {
    if (!this.disputeId) {
      return;
    }

    for (const item of this.evidenceItems) {
      this.disputesService
        .getEvidenceFile(this.disputeId, item.evidence_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob) => {
            const objectUrl = URL.createObjectURL(blob);
            item.imageUrl = objectUrl;
          },
          error: () => {
            item.imageUrl = undefined;
          },
        });
    }
  }

  private revokeEvidenceUrls(): void {
    for (const item of this.evidenceItems) {
      if (item.imageUrl) {
        URL.revokeObjectURL(item.imageUrl);
      }
    }
  }

  private resolveErrorMessage(error: BuyerDisputesApiError, preferApiMessage: boolean = false): string {
    if (preferApiMessage && error.apiMessage) {
      return error.apiMessage;
    }

    if (error.translationKey) {
      return this.translate.instant(error.translationKey);
    }

    if (error.apiMessage) {
      return error.apiMessage;
    }

    return this.translate.instant('BUYER_DISPUTES.ERROR_GENERIC');
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

  private getIssueTypeTranslationKey(issueTypeCode: string): string {
    const normalizedCode = (issueTypeCode || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    return `BUYER_DISPUTES.ISSUE_TYPE_${normalizedCode}`;
  }

  private translateWithFallback(translationKey: string, fallback: string): string {
    const translated = this.translate.instant(translationKey);
    return translated !== translationKey ? translated : fallback;
  }
}
