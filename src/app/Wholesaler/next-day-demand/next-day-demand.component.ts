import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, cubeOutline, calendarOutline,
  alertCircleOutline, checkmarkCircleOutline, chevronDownCircleOutline
} from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import { WholesalerApiService, WholesalerDemandProduct } from '../services/wholesaler-api.service';

/**
 * Full, paginated "Items Needed for Tomorrow" screen.
 * Backed entirely by GET /wholesaler/next-day-demand (page, limit) -
 * the same endpoint used to populate the top-5 widget on the home screen.
 * Reached via the home screen's "Cater for Tomorrow" banner.
 */
@Component({
  selector: 'app-next-day-demand',
  templateUrl: './next-day-demand.component.html',
  styleUrls: ['./next-day-demand.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe]
})
export class NextDayDemandPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  items: WholesalerDemandProduct[] = [];
  currentPage = 0;
  itemsPerPage = 20;
  isLoading = false;
  isInfiniteScrollEnabled = true;

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private wholesalerService: WholesalerApiService,
    private translate: TranslateService
  ) {
    addIcons({
      arrowBackOutline, cubeOutline, calendarOutline,
      alertCircleOutline, checkmarkCircleOutline, chevronDownCircleOutline
    });
  }

  ngOnInit() {
    this.loadItems(true);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadItems(reset = false, onComplete?: () => void) {
    if (this.isLoading) {
      onComplete?.();
      return;
    }

    if (reset) {
      this.currentPage = 0;
      this.items = [];
      this.isInfiniteScrollEnabled = true;
    }

    this.isLoading = true;

    this.wholesalerService
      .getWholesalerNextDayDemand(this.currentPage, this.itemsPerPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.items = [...this.items, ...data];

          if (data.length < this.itemsPerPage) {
            this.isInfiniteScrollEnabled = false;
          } else {
            this.currentPage++;
          }

          this.isLoading = false;
          onComplete?.();
        },
        error: () => {
          this.isLoading = false;
          this.isInfiniteScrollEnabled = false;
          onComplete?.();
        }
      });
  }

  onInfiniteScroll(event: any) {
    this.loadItems(false, () => {
      event.target.complete();
      if (!this.isInfiniteScrollEnabled) {
        event.target.disabled = true;
      }
    });
  }

  handleRefresh(event: any) {
    this.loadItems(true, () => event.target.complete());
  }

  goBack() {
    this.navCtrl.back();
  }

  viewDetails(productId: number) {
    this.router.navigate(['/wholesaler/product-details', productId]);
  }

  isShort(item: WholesalerDemandProduct): boolean {
    return item.shortage > 0;
  }

  /** Returns 0-100 capped percentage of stock coverage for the progress bar */
  getStockCoveragePercent(item: WholesalerDemandProduct): number {
    if (item.qty_needed <= 0) return 100;
    const pct = (item.total_stock / item.qty_needed) * 100;
    return Math.min(100, Math.max(0, pct));
  }
}