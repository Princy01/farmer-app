import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowForwardOutline,
  cashOutline,
  documentTextOutline,
  peopleOutline,
  pulseOutline,
  refreshOutline,
  storefrontOutline,
  timeOutline,
  warningOutline,
} from 'ionicons/icons';
import { ConsoleDashboardService } from './console-dashboard.service';
import {
  AdminControlTowerSummary,
  FinanceDashboardSummary,
  OpsDashboardSummary,
  SummaryRefreshMeta,
} from './console-dashboard.models';

type SummaryKind = 'admin' | 'ops' | 'finance';
type SummaryPayload = AdminControlTowerSummary | OpsDashboardSummary | FinanceDashboardSummary;
type CardTone = 'neutral' | 'accent' | 'warning' | 'danger';

interface SummaryCard {
  label: string;
  value: string;
  tone: CardTone;
  route?: string;
  helper?: string;
}

interface SummarySection {
  title: string;
  subtitle: string;
  cards: SummaryCard[];
}

@Component({
  selector: 'app-console-summary-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonBadge,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonIcon,
    IonSpinner,
  ],
  templateUrl: './console-summary-page.component.html',
  styleUrls: ['./console-summary-page.component.scss'],
})
export class ConsoleSummaryPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  protected readonly summaryKind: SummaryKind;
  protected readonly title: string;
  protected readonly description: string;
  protected readonly consoleLabel: string;

  protected isLoading = true;
  protected errorMessage: string | null = null;
  protected sections: SummarySection[] = [];
  protected lastRefreshedLabel = '';
  protected serverTimeLabel = '';
  protected nextRefreshSeconds = 300;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly dashboardService: ConsoleDashboardService,
  ) {
    addIcons({
      alertCircleOutline,
      arrowForwardOutline,
      cashOutline,
      documentTextOutline,
      peopleOutline,
      pulseOutline,
      refreshOutline,
      storefrontOutline,
      timeOutline,
      warningOutline,
    });

    const data = this.route.snapshot.data;
    this.summaryKind = data['summaryKind'] as SummaryKind;
    this.title = data['title'] ?? 'Dashboard';
    this.description = data['description'] ?? '';
    this.consoleLabel = data['consoleLabel'] ?? 'Console';
  }

  ngOnInit(): void {
    this.loadSummary();

    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.nextRefreshSeconds <= 1) {
          this.loadSummary();
          return;
        }
        this.nextRefreshSeconds -= 1;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected trackSection(_index: number, section: SummarySection): string {
    return section.title;
  }

  protected trackCard(_index: number, card: SummaryCard): string {
    return card.label;
  }

  protected getToneClass(card: SummaryCard): string {
    return `tone-${card.tone}`;
  }

  private loadSummary(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.getSummaryRequest()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.isLoading = false;
          this.sections = this.buildSections(summary);
          this.applyRefreshMeta(summary);
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'We could not load this dashboard summary right now.';
        },
      });
  }

  private getSummaryRequest(): Observable<SummaryPayload> {
    switch (this.summaryKind) {
      case 'ops':
        return this.dashboardService.getOpsDashboardSummary() as Observable<SummaryPayload>;
      case 'finance':
        return this.dashboardService.getFinanceDashboardSummary() as Observable<SummaryPayload>;
      default:
        return this.dashboardService.getAdminControlTowerSummary() as Observable<SummaryPayload>;
    }
  }

  private applyRefreshMeta(summary: SummaryRefreshMeta): void {
    this.nextRefreshSeconds = summary.next_refresh_after_seconds || 300;
    this.lastRefreshedLabel = this.formatDateTime(summary.refreshed_at);
    this.serverTimeLabel = this.formatDateTime(summary.server_time);
  }

  private buildSections(summary: SummaryPayload): SummarySection[] {
    switch (this.summaryKind) {
      case 'ops':
        return this.buildOpsSections(summary as OpsDashboardSummary);
      case 'finance':
        return this.buildFinanceSections(summary as FinanceDashboardSummary);
      default:
        return this.buildAdminSections(summary as AdminControlTowerSummary);
    }
  }

  private buildAdminSections(summary: AdminControlTowerSummary): SummarySection[] {
    return [
      {
        title: 'Network Snapshot',
        subtitle: 'Core marketplace and account totals',
        cards: [
          this.card('Businesses', summary.total_businesses, 'neutral'),
          this.card('Branches', summary.total_branches, 'neutral'),
          this.card('Active Branches', summary.active_branches, 'accent'),
          this.card('Master Data', 'Open', 'accent', '/admin/master-data', 'States, cities, locations'),
          this.card('Console Access', 'Open', 'accent', '/admin/console-access', 'Grant ops and finance access'),
          this.card('Pending Orders', summary.pending_orders, 'warning'),
        ],
      },
      {
        title: 'Operations Watch',
        subtitle: 'High-signal queues for admin review',
        cards: [
          this.card('Open Disputes', summary.open_disputes, 'warning', '/admin/control-tower'),
          this.card('Overdue Disputes', summary.overdue_disputes, 'danger', '/admin/control-tower'),
          this.card('Pending Branch Verification', summary.pending_branch_verification, 'warning', '/admin/onboarding-watch'),
          this.card('Pending Driver Onboarding', summary.pending_driver_onboarding, 'warning', '/admin/onboarding-watch'),
          this.card('Pending Buyer KYC', summary.pending_buyer_kyc, 'accent', '/admin/onboarding-watch'),
          this.card('Pending Wholesaler License', summary.pending_wholesaler_license, 'accent', '/admin/onboarding-watch'),
        ],
      },
      {
        title: 'Transport And Finance',
        subtitle: 'Fast read on job pressure and high-value signals',
        cards: [
          this.card('Open Transport Jobs', summary.open_transport_jobs, 'warning', '/admin/transport-watch'),
          this.card('Total Transport Jobs', summary.total_transport_jobs, 'neutral'),
          this.card('Large Orders', summary.large_orders, 'accent', '/admin/payment-watch', `Threshold ${this.formatAmount(summary.large_order_threshold)}`),
          this.card('Monthly Revenue', this.formatAmount(summary.monthly_revenue), 'neutral'),
          this.card('Total Revenue', this.formatAmount(summary.total_revenue), 'neutral'),
        ],
      },
    ];
  }

  private buildOpsSections(summary: OpsDashboardSummary): SummarySection[] {
    return [
      {
        title: 'Case Queue',
        subtitle: 'Dispute handling pressure and due-state',
        cards: [
          this.card('Open Cases', summary.total_open, 'neutral'),
          this.card('Awaiting Evidence', summary.awaiting_evidence, 'warning'),
          this.card('Pending Execution', summary.pending_execution, 'accent'),
          this.card('Due Today', summary.due_today, 'warning'),
          this.card('Due Soon', summary.due_soon, 'accent'),
          this.card('Overdue', summary.overdue, 'danger'),
        ],
      },
      {
        title: 'Operational Review',
        subtitle: 'Queues ops should clear before the day slips',
        cards: [
          this.card('Pending Branch Verification', summary.pending_branch_verification, 'warning', '/ops/onboarding-watch'),
          this.card('Pending Driver Onboarding', summary.pending_driver_onboarding, 'warning', '/ops/onboarding-watch'),
          this.card('Pending Buyer KYC', summary.pending_buyer_kyc, 'accent', '/ops/onboarding-watch'),
          this.card('Pending Wholesaler License', summary.pending_wholesaler_license, 'accent', '/ops/onboarding-watch'),
          this.card('Resolution Breached', summary.resolution_breached, 'danger'),
          this.card('First Response Breached', summary.first_response_breached, 'warning'),
        ],
      },
      {
        title: 'Transport Watch',
        subtitle: 'Immediate transport exceptions',
        cards: [
          this.card('Ride Not Assigned', summary.ride_not_assigned, 'warning', '/ops/transport-watch'),
          this.card('Ride Not Taken', summary.ride_not_taken, 'warning', '/ops/transport-watch'),
          this.card('Pickup Delayed', summary.pickup_delayed, 'danger', '/ops/transport-watch'),
          this.card('Delivery Overdue', summary.delivery_overdue, 'danger', '/ops/transport-watch'),
        ],
      },
    ];
  }

  private buildFinanceSections(summary: FinanceDashboardSummary): SummarySection[] {
    return [
      {
        title: 'Finance Queue',
        subtitle: 'Cases and execution work waiting on finance',
        cards: [
          this.card('Open Cases', summary.total_open, 'neutral'),
          this.card('Pending Execution', summary.pending_execution, 'accent'),
          this.card('Due Today', summary.due_today, 'warning'),
          this.card('Due Soon', summary.due_soon, 'accent'),
          this.card('Overdue', summary.overdue, 'danger'),
        ],
      },
      {
        title: 'Payment Watch',
        subtitle: 'Failures and high-value exceptions',
        cards: [
          this.card('Payment Failures', summary.payment_failures, 'danger', '/finance/payment-watch'),
          this.card('High Value Cases', summary.high_value_cases, 'warning', '/finance/payment-watch'),
          this.card('Large Orders', summary.large_orders, 'accent', '/finance/payment-watch', `Threshold ${this.formatAmount(summary.large_order_threshold)}`),
        ],
      },
      {
        title: 'Revenue Snapshot',
        subtitle: 'Current top-line metrics exposed by backend',
        cards: [
          this.card('Monthly Revenue', this.formatAmount(summary.monthly_revenue), 'neutral'),
          this.card('Total Revenue', this.formatAmount(summary.total_revenue), 'neutral'),
        ],
      },
    ];
  }

  private card(label: string, value: number | string, tone: CardTone, route?: string, helper?: string): SummaryCard {
    return {
      label,
      value: typeof value === 'number' ? this.formatNumber(value) : value,
      tone,
      route,
      helper,
    };
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
  }

  private formatAmount(value: number): string {
    return `₹${this.formatNumber(value)}`;
  }

  private formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  }
}
