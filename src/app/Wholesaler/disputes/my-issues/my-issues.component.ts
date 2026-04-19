import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { alertCircleOutline, arrowBackOutline, clipboardOutline } from 'ionicons/icons';
import {
  BuyerDisputesApiError,
  BuyerDisputesService,
  DisputeListItem,
  IssueType,
} from '../wholesaler-disputes.service';

@Component({
  selector: 'app-my-issues',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
  templateUrl: './my-issues.component.html',
  styleUrls: ['./my-issues.component.scss'],
})
export class MyIssuesComponent implements OnInit, OnDestroy {
  disputes: DisputeListItem[] = [];
  loading = true;
  error: string | null = null;

  private orderIdFilter: number | undefined;
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
      clipboardOutline,
    });
  }

  ngOnInit(): void {
    const orderIdParam = this.route.snapshot.queryParamMap.get('orderId');
    if (orderIdParam && !Number.isNaN(+orderIdParam) && +orderIdParam > 0) {
      this.orderIdFilter = +orderIdParam;
    }

    this.loadDisputes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDisputes(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      disputesResponse: this.disputesService.getMyDisputes(1, 20, this.orderIdFilter),
      issueTypesResponse: this.disputesService.getIssueTypes().pipe(catchError(() => of({ items: [] as IssueType[] }))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ disputesResponse, issueTypesResponse }) => {
          this.disputes = disputesResponse.items || [];
          this.issueTypeCodeById.clear();

          for (const issueType of issueTypesResponse.items || []) {
            this.issueTypeCodeById.set(issueType.id, issueType.code);
          }

          this.loading = false;
        },
        error: (err: BuyerDisputesApiError) => {
          this.error = this.resolveErrorMessage(err);
          this.loading = false;
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/wholesaler/orders']);
  }

  openIssue(dispute: DisputeListItem): void {
    this.router.navigate(['/wholesaler/issue-detail', dispute.case_id]);
  }

  goToOrder(dispute: DisputeListItem): void {
    if (!dispute.order_id) {
      return;
    }
    this.router.navigate(['/wholesaler/order-details', dispute.order_id]);
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

  getIssueTypeLabel(dispute: DisputeListItem): string {
    const issueTypeCode = this.issueTypeCodeById.get(dispute.issue_type_id);

    if (!issueTypeCode) {
      return dispute.issue_type_name;
    }

    const translationKey = this.getIssueTypeTranslationKey(issueTypeCode);
    return this.translateWithFallback(translationKey, dispute.issue_type_name);
  }

  trackByDispute(_index: number, dispute: DisputeListItem): number {
    return dispute.case_id;
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

  private getIssueTypeTranslationKey(issueTypeCode: string): string {
    const normalizedCode = (issueTypeCode || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    return `BUYER_DISPUTES.ISSUE_TYPE_${normalizedCode}`;
  }

  private translateWithFallback(translationKey: string, fallback: string): string {
    const translated = this.translate.instant(translationKey);
    return translated !== translationKey ? translated : fallback;
  }
}
