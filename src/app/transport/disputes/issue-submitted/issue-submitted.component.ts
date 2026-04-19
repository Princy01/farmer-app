import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { TransportDisputesApiError, TransportDisputesService } from '../transport-disputes.service';

@Component({
  selector: 'app-transport-issue-submitted',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
  templateUrl: './issue-submitted.component.html',
  styleUrls: ['./issue-submitted.component.scss'],
})
export class IssueSubmittedComponent implements OnInit, OnDestroy {
  disputeId: number | null = null;
  caseReference = '-';
  status = 'new';
  orderId: number | null = null;
  jobId: number | null = null;

  loading = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private disputesService: TransportDisputesService,
    private translate: TranslateService
  ) {
    addIcons({
      checkmarkCircleOutline,
      alertCircleOutline,
    });
  }

  ngOnInit(): void {
    this.loadSubmittedIssue();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubmittedIssue(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const queryCaseReference = this.route.snapshot.queryParamMap.get('caseReference');
    const queryStatus = this.route.snapshot.queryParamMap.get('status');
    const queryOrderId = this.route.snapshot.queryParamMap.get('orderId');
    const queryJobId = this.route.snapshot.queryParamMap.get('jobId');

    if (!id || Number.isNaN(+id) || +id <= 0) {
      this.error = this.translate.instant('BUYER_DISPUTES.ERROR_INVALID_DISPUTE_ID');
      this.loading = false;
      return;
    }

    this.disputeId = +id;
    this.orderId = queryOrderId && !Number.isNaN(+queryOrderId) ? +queryOrderId : null;
    this.jobId = queryJobId && !Number.isNaN(+queryJobId) ? +queryJobId : null;

    if (queryCaseReference) {
      this.caseReference = queryCaseReference;
    }

    if (queryStatus) {
      this.status = queryStatus;
    }

    this.loading = true;
    this.error = null;

    this.disputesService
      .getDisputeById(this.disputeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.caseReference = detail.case_reference;
          this.status = detail.status;
          this.orderId = detail.order_id || this.orderId;
          this.jobId = detail.job_id || this.jobId;
          this.loading = false;
        },
        error: (err: TransportDisputesApiError) => {
          this.error = this.resolveErrorMessage(err);
          this.loading = false;
        },
      });
  }

  goToIssueDetail(): void {
    if (!this.disputeId) {
      return;
    }

    this.router.navigate(['/transport/issue-detail', this.disputeId]);
  }

  goToMyIssues(): void {
    this.router.navigate(['/transport/my-issues']);
  }

  goBackToOrder(): void {
    if (this.jobId) {
      this.router.navigate(['/transport/delivery-confirmation', this.jobId]);
      return;
    }

    if (this.orderId) {
      this.router.navigate(['/transport/report-issue', this.orderId]);
      return;
    }

    this.router.navigate(['/transport/delivery-history']);
  }

  getStatusLabel(status: string): string {
    const key = this.getStatusTranslationKey(status);
    return this.translate.instant(key);
  }

  private getStatusTranslationKey(status: string): string {
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

    return map[normalized] || 'BUYER_DISPUTES.STATUS_ISSUE_RECEIVED';
  }

  private resolveErrorMessage(error: TransportDisputesApiError): string {
    if (error.apiMessage) {
      return error.apiMessage;
    }

    if (error.translationKey) {
      return this.translate.instant(error.translationKey);
    }

    return this.translate.instant('BUYER_DISPUTES.ERROR_GENERIC');
  }
}
