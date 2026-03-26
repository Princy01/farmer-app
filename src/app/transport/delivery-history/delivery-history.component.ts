import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DeliveryService, Delivery } from './delivery-history.service';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-delivery-history',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './delivery-history.component.html',
  styleUrls: ['./delivery-history.component.scss']
})
export class DeliveryHistoryComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  deliveries: Delivery[] = [];
  filteredDeliveries: Delivery[] = [];
  isLoading: boolean = false;
  isResolvingDispute: string | null = null;
  error: string | null = null;
  private searchSubject$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private deliveryService: DeliveryService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadDeliveryHistory();
    this.initializeSearchFilter();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSearchFilter() {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.performSearch(query);
      });
  }

  loadDeliveryHistory() {
    this.isLoading = true;
    this.error = null;

    this.deliveryService
      .getDeliveryHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && Array.isArray(response.deliveries) && response.deliveries.length > 0) {
            this.deliveries = response.deliveries;
            this.filteredDeliveries = [...this.deliveries];
            this.error = null;
          } else {
            this.deliveries = [];
            this.filteredDeliveries = [];
          }
          this.isLoading = false;
        },
        error: () => {
          this.error = this.translate.instant('DELIVERY_HISTORY.LOAD_ERROR');
          this.deliveries = [];
          this.filteredDeliveries = [];
          this.isLoading = false;
        }
      });
  }

  filterDeliveries() {
    this.searchSubject$.next(this.searchQuery);
  }

  private performSearch(query: string) {
    if (!query.trim()) {
      this.filteredDeliveries = [...this.deliveries];
      return;
    }

    const lowerCaseQuery = query.toLowerCase();
    this.filteredDeliveries = this.deliveries.filter(delivery =>
      delivery.pickup_address.toLowerCase().includes(lowerCaseQuery) ||
      delivery.drop_address.toLowerCase().includes(lowerCaseQuery) ||
      delivery.order_id.toString().includes(lowerCaseQuery)
    );
  }

  resolveDispute(jobId: string) {
    if (this.isResolvingDispute) {
      return;
    }

    this.isResolvingDispute = jobId;
    this.deliveryService
      .resolveDispute(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.error = null;
          const updatedDelivery = this.deliveries.find(d => d.job_id === jobId);
          if (updatedDelivery) {
            updatedDelivery.hasDispute = false;
          }
          this.isResolvingDispute = null;
        },
        error: () => {
          this.error = this.translate.instant('DELIVERY_HISTORY.LOAD_ERROR');
          this.isResolvingDispute = null;
        }
      });
  }
}