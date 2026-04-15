import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { BuyerDisputesApiError, BuyerDisputesService } from '../buyer-disputes.service';

@Component({
  selector: 'app-issue-submitted',
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

  loading = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private disputesService: BuyerDisputesService,
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

    if (!id || Number.isNaN(+id) || +id <= 0) {
      this.error = this.translate.instant('BUYER_DISPUTES.ERROR_INVALID_DISPUTE_ID');
      this.loading = false;
      return;
    }

    this.disputeId = +id;
    this.orderId = queryOrderId && !Number.isNaN(+queryOrderId) ? +queryOrderId : null;

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
          this.loading = false;
        },
        error: (err: BuyerDisputesApiError) => {
          this.error = this.resolveErrorMessage(err);
          this.loading = false;
        },
      });
  }

  goToIssueDetail(): void {
    if (!this.disputeId) {
      return;
    }

    this.router.navigate(['/buyer/issue-detail', this.disputeId]);
  }

  goToMyIssues(): void {
    this.router.navigate(['/buyer/my-issues']);
  }

  goBackToOrder(): void {
    if (this.orderId) {
      this.router.navigate(['/buyer/retailer-order-details', this.orderId]);
      return;
    }

    this.router.navigate(['/buyer/retailer-order-history']);
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

  private resolveErrorMessage(error: BuyerDisputesApiError): string {
    if (error.apiMessage) {
      return error.apiMessage;
    }

    if (error.translationKey) {
      return this.translate.instant(error.translationKey);
    }

    return this.translate.instant('BUYER_DISPUTES.ERROR_GENERIC');
  }
}
