import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { imageOutline, addOutline, downloadOutline } from 'ionicons/icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RetailerOrderService } from '../retailer-order-details.service';

export interface DisputeEvidence {
  disputeId: number;
  evidenceItems: EvidenceGalleryItem[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
}

export interface EvidenceGalleryItem {
  sourceUrl: string;
  displayUrl: string | null;
  loading: boolean;
  error: string | null;
}

export interface EvidenceUploadItem {
  file: File;
  previewUrl: string;
  uploadedUrl: string | null;
  uploading: boolean;
  error: string | null;
}

/**
 * Component for displaying and managing evidence for a return dispute.
 * Shows existing evidence gallery and allows adding new evidence.
 */
@Component({
  selector: 'app-dispute-evidence-gallery',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, TranslatePipe],
  templateUrl: './dispute-evidence-gallery.component.html',
  styleUrls: ['./dispute-evidence-gallery.component.scss']
})
export class DisputeEvidenceGalleryComponent implements OnInit, OnDestroy {
  @Input() disputeId: number | null = null;

  @ViewChild('evidenceFileInput') evidenceFileInput!: ElementRef<HTMLInputElement>;

  disputeEvidence: DisputeEvidence | null = null;
  uploadingItems: EvidenceUploadItem[] = [];
  readonly MAX_IMAGES = 3;

  private destroy$ = new Subject<void>();

  constructor(private orderService: RetailerOrderService) {
    addIcons({ imageOutline, addOutline, downloadOutline });
  }

  ngOnInit(): void {
    if (this.disputeId) {
      this.loadEvidenceGallery();
    }
  }

  ngOnDestroy(): void {
    this.revokePreviewUrls();
    this.revokeEvidenceUrls();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load existing evidence for the dispute
   */
  loadEvidenceGallery(): void {
    if (!this.disputeId) return;

    this.revokeEvidenceUrls();
    this.disputeEvidence = {
      disputeId: this.disputeId,
      evidenceItems: [],
      loading: true,
      error: null,
      uploading: false
    };

    this.orderService
      .getReturnDisputeEvidence(this.disputeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (this.disputeEvidence) {
            this.disputeEvidence.evidenceItems = (response.evidence_urls || []).map(
              (sourceUrl) => ({
                sourceUrl,
                displayUrl: null,
                loading: true,
                error: null
              })
            );
            this.disputeEvidence.loading = false;
            this.disputeEvidence.error = null;
            this.disputeEvidence.evidenceItems.forEach((item) => {
              this.loadEvidenceImage(item);
            });
          }
        },
        error: (err) => {
          if (this.disputeEvidence) {
            this.disputeEvidence.loading = false;
            this.disputeEvidence.error = err?.message || 'DISPUTE_EVIDENCE.ERROR_LOADING';
          }
        }
      });
  }

  /**
   * Handle file selection for new evidence
   */
  onEvidenceFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    input.value = ''; // Reset for re-selection

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const entry: EvidenceUploadItem = {
        file,
        previewUrl: '',
        uploadedUrl: null,
        uploading: false,
        error: 'DISPUTE_EVIDENCE.INVALID_TYPE'
      };
      this.uploadingItems.push(entry);
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      const entry: EvidenceUploadItem = {
        file,
        previewUrl: '',
        uploadedUrl: null,
        uploading: false,
        error: 'DISPUTE_EVIDENCE.TOO_LARGE'
      };
      this.uploadingItems.push(entry);
      return;
    }

    // Create preview and upload
    const previewUrl = URL.createObjectURL(file);
    const entry: EvidenceUploadItem = {
      file,
      previewUrl,
      uploadedUrl: null,
      uploading: true,
      error: null
    };
    this.uploadingItems.push(entry);

    this.uploadEvidenceToDispute(entry);
  }

  /**
   * Upload evidence to existing dispute
   */
  private uploadEvidenceToDispute(entry: EvidenceUploadItem): void {
    if (!this.disputeId) return;

    this.orderService
      .addReturnDisputeEvidence(this.disputeId, entry.file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          entry.uploadedUrl = response.file_url;
          entry.uploading = false;

          // Add to main gallery
          if (this.disputeEvidence) {
            const evidenceItem: EvidenceGalleryItem = {
              sourceUrl: response.file_url,
              displayUrl: null,
              loading: true,
              error: null
            };
            this.disputeEvidence.evidenceItems.push(evidenceItem);
            this.loadEvidenceImage(evidenceItem);
          }
        },
        error: (err) => {
          entry.uploading = false;
          entry.error = err?.message || 'DISPUTE_EVIDENCE.UPLOAD_FAILED';
        }
      });
  }

  /**
   * Retry failed upload
   */
  retryUpload(entry: EvidenceUploadItem): void {
    entry.error = null;
    entry.uploading = true;
    this.uploadEvidenceToDispute(entry);
  }

  /**
   * Remove from uploading list (not from gallery)
   */
  removeUploadingItem(index: number): void {
    const entry = this.uploadingItems[index];
    if (entry.previewUrl) {
      URL.revokeObjectURL(entry.previewUrl);
    }
    this.uploadingItems.splice(index, 1);
  }

  /**
   * Programmatically trigger the hidden file input.
   * Using a direct click() call avoids Ionic swallowing the label→input click chain.
   */
  triggerFileInput(): void {
    this.evidenceFileInput?.nativeElement?.click();
  }

  /**
   * Check if more evidence can be added.
   * Only counts items still pending/uploading — successfully uploaded ones
   * have already been pushed into disputeEvidence.evidenceItems.
   */
  get canAddMoreEvidence(): boolean {
    const existingCount = this.disputeEvidence?.evidenceItems.length || 0;
    const pendingCount = this.uploadingItems.filter(
      item => !item.uploadedUrl && !item.error
    ).length;
    return existingCount + pendingCount < this.MAX_IMAGES;
  }

  /**
   * Download/view evidence image
   */
  openEvidenceImage(item: EvidenceGalleryItem): void {
    if (item.displayUrl) {
      window.open(item.displayUrl, '_blank');
    }
  }

  retryEvidenceImage(item: EvidenceGalleryItem, event: Event): void {
    event.stopPropagation();
    this.loadEvidenceImage(item);
  }

  /**
   * Cleanup preview URLs
   */
  private revokePreviewUrls(): void {
    this.uploadingItems.forEach(item => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
  }

  private loadEvidenceImage(item: EvidenceGalleryItem): void {
    if (item.displayUrl) {
      URL.revokeObjectURL(item.displayUrl);
      item.displayUrl = null;
    }

    item.loading = true;
    item.error = null;

    this.orderService
      .getReturnDisputeEvidenceFile(item.sourceUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          if (!blob.size) {
            item.loading = false;
            item.error = 'DISPUTE_EVIDENCE.ERROR_LOADING';
            return;
          }
          item.displayUrl = URL.createObjectURL(blob);
          item.loading = false;
        },
        error: (err) => {
          item.loading = false;
          item.error = err?.message || 'DISPUTE_EVIDENCE.ERROR_LOADING';
        }
      });
  }

  private revokeEvidenceUrls(): void {
    this.disputeEvidence?.evidenceItems.forEach((item) => {
      if (item.displayUrl) {
        URL.revokeObjectURL(item.displayUrl);
        item.displayUrl = null;
      }
    });
  }

  /**
   * Check if there are any uploads in progress
   */
  get isAnyUploading(): boolean {
    return this.uploadingItems.some(item => item.uploading);
  }

  /**
   * Retry loading evidence
   */
  retryLoadEvidenceGallery(): void {
    this.loadEvidenceGallery();
  }
}
