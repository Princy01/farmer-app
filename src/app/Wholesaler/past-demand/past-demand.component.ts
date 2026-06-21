import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, cubeOutline, timeOutline,
  trendingUpOutline, chevronDownCircleOutline
} from 'ionicons/icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import { WholesalerApiService, WholesalerPastDemandProduct } from '../services/wholesaler-api.service';

/**
 * Full, paginated "Recently in Demand" (past demand) screen.
 * Backed entirely by GET /wholesaler/past-demand (page, limit) -
 * the same endpoint used to populate the top-5 widget on the home screen.
 * Reached via the home screen's "Recently in Demand" card's "View all" link.
 */
@Component({
  selector: 'app-past-demand',
  templateUrl: './past-demand.component.html',
  styleUrls: ['./past-demand.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe]
})
export class PastDemandPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  items: WholesalerPastDemandProduct[] = [];
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
      arrowBackOutline, cubeOutline, timeOutline,
      trendingUpOutline, chevronDownCircleOutline
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
      .getWholesalerPastDemand(this.currentPage, this.itemsPerPage)
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

  isOutOfStock(item: WholesalerPastDemandProduct): boolean {
    return item.total_stock === 0;
  }
}