import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DeliveryService, Delivery, DeliveryOrder } from './delivery-history.service';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

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
  expandedJobIds = new Set<number>();
  isLoading: boolean = false;
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
            this.expandedJobIds.clear();
            this.error = null;
          } else {
            this.deliveries = [];
            this.filteredDeliveries = [];
            this.expandedJobIds.clear();
          }
          this.isLoading = false;
        },
        error: () => {
          this.error = this.translate.instant('DELIVERY_HISTORY.LOAD_ERROR');
          this.deliveries = [];
          this.filteredDeliveries = [];
          this.expandedJobIds.clear();
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
    this.filteredDeliveries = this.deliveries.filter(delivery => {
      const orders = delivery.orders ?? [];
      const searchableText = [
        delivery.job_id?.toString() ?? '',
        (delivery.order_ids ?? []).join(','),
        delivery.delivery_date,
        ...orders.flatMap(order => [
          order.order_id?.toString() ?? '',
          this.getOrderDeliveryAddress(order),
          order.order_status,
          order.final_amount?.toString() ?? '',
          order.pickup_branch?.branch_address ?? '',
          order.dropoff_branch?.branch_address ?? '',
          ...(order.items ?? []).map(item => item.product_name),
        ]),
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(lowerCaseQuery);
    });
  }

  getOrderDeliveryAddress(order: DeliveryOrder): string {
    return order.dropoff_branch?.branch_address?.trim() || order.delivery_address?.trim() || '';
  }

  private getFirstOrder(delivery: Delivery): DeliveryOrder | null {
    const orders = delivery.orders ?? [];
    return orders.length > 0 ? orders[0] : null;
  }

  getPickupAddress(delivery: Delivery): string {
    return this.getFirstOrder(delivery)?.pickup_branch?.branch_address?.trim() || '';
  }

  getDropAddress(delivery: Delivery): string {
    const firstOrder = this.getFirstOrder(delivery);
    return firstOrder ? this.getOrderDeliveryAddress(firstOrder) : '';
  }

  toggleDeliveryDetails(jobId: number) {
    if (this.expandedJobIds.has(jobId)) {
      this.expandedJobIds.delete(jobId);
      return;
    }

    this.expandedJobIds.add(jobId);
  }

  isDeliveryExpanded(jobId: number): boolean {
    return this.expandedJobIds.has(jobId);
  }
}